-- ============================================================
-- Gillian Anderson Management · Foundation 1/5
-- Core: helpers, profiles, staff, acknowledgement, applicants
-- ============================================================
-- Design notes:
--   * UUID primary keys, created_at/updated_at on every business table.
--   * Status/role columns are TEXT + CHECK (easy to evolve, no enum churn).
--   * Roles: user | management | admin, stored on profiles.role, changed ONLY
--     through SECURITY DEFINER functions. Clients never receive UPDATE rights
--     on profiles.role (column-level grants in migration 3).
--   * RLS is enabled explicitly on every table (the ensure_rls event trigger is
--     a second safety net).
--   * No data is invented: only the acknowledgement document (version 1) and
--     profile backfill for existing auth users are seeded (migration 5).
-- ============================================================

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Role checks: single source of truth used by RLS policies and the API.
-- (plpgsql: bodies are not parse-analyzed at creation, so definition order
--  relative to the tables they read does not matter.)
create or replace function public.is_admin()
returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
end;
$$;

create or replace function public.is_management()
returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('management', 'admin')
  );
end;
$$;

create or replace function public.is_self(p_user_id uuid)
returns boolean
language sql stable
set search_path = ''
as $$
  select p_user_id is not null and p_user_id = (select auth.uid());
$$;

grant execute on function public.set_updated_at() to public;
grant execute on function public.is_admin() to public;
grant execute on function public.is_management() to public;
grant execute on function public.is_self(uuid) to public;

-- ------------------------------------------------------------
-- profiles — authenticated identity (spec: USER PROFILE)
-- ------------------------------------------------------------
create table public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  email                    text,
  full_name                text,
  phone                    text,
  country                  text,
  city                     text,
  address                  text,
  date_of_birth            date,
  occupation               text,
  company                  text,
  website                  text,
  preferred_contact_method text check (preferred_contact_method in ('email','phone','sms','none')),
  profile_photo            text,
  role                     text not null default 'user' check (role in ('user','management','admin')),
  status                   text not null default 'pending' check (status in ('pending','active','suspended')),
  email_verified_at        timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index profiles_role_idx    on public.profiles (role);
create index profiles_status_idx  on public.profiles (status);
create index profiles_created_idx on public.profiles (created_at desc);

alter table public.profiles enable row level security;
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Server-side protection: role/status may only be written by trusted paths
-- (service role, SECURITY DEFINER admin functions). Self-promotion is
-- impossible even if a policy is ever misconfigured.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    if new.role = 'user' and new.status = 'pending' then
      return new;
    end if;
    if caller is null then
      return new;            -- trusted server-side path (backfill / service role)
    end if;
    raise exception 'cannot create profiles with elevated privileges';
  end if;

  if new.role is distinct from old.role then
    if caller is null then
      return new;            -- trusted server-side path (service role)
    end if;
    if public.is_admin() then
      return new;            -- administrator using admin_set_user_role()
    end if;
    raise exception 'role changes must be made by an administrator';
  end if;

  if new.status is distinct from old.status then
    if caller is null then
      return new;
    end if;
    if not public.is_admin() then
      raise exception 'not authorized to change account status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privileges on public.profiles;
create trigger trg_protect_profile_privileges
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Admin-only role assignment (secure server-side authorization).
create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if p_role not in ('user','management','admin') then
    raise exception 'invalid role';
  end if;
  if p_user_id = (select auth.uid()) and p_role <> 'admin' then
    raise exception 'you cannot remove your own administrator role';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  if not found then
    raise exception 'profile not found';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- staff_roles / staff_profiles — management team structure
-- ------------------------------------------------------------
create table public.staff_roles (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  name        text not null,
  description text,
  permissions text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.staff_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.profiles (id) on delete cascade,
  staff_role_id uuid references public.staff_roles (id) on delete set null,
  title         text,
  department    text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index staff_profiles_role_idx on public.staff_profiles (staff_role_id);
create index staff_profiles_active_idx on public.staff_profiles (is_active);

alter table public.staff_roles    enable row level security;
alter table public.staff_profiles enable row level security;

drop trigger if exists trg_staff_roles_updated_at on public.staff_roles;
create trigger trg_staff_roles_updated_at
  before update on public.staff_roles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_staff_profiles_updated_at on public.staff_profiles;
create trigger trg_staff_profiles_updated_at
  before update on public.staff_profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- acknowledgement_versions / acknowledgements (spec: ACKNOWLEDGEMENT)
-- Account creation cannot start until the applicant explicitly accepts the
-- current published version. The acceptance travels with the signup payload and
-- is validated + persisted by handle_new_user() (below) — an account can never
-- exist without a recorded acknowledgement.
-- ------------------------------------------------------------
create table public.acknowledgement_versions (
  id           uuid primary key default gen_random_uuid(),
  version      integer not null unique,
  title        text not null,
  content      text not null,
  is_active    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.acknowledgements (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users (id) on delete cascade,
  acknowledgement_version  integer not null references public.acknowledgement_versions (version),
  accepted_at              timestamptz not null,
  user_agent               text,
  ip_address               text,
  created_at               timestamptz not null default now(),
  unique (user_id, acknowledgement_version)
);

create index ack_versions_active_idx on public.acknowledgement_versions (is_active);
create index acknowledgements_user_idx on public.acknowledgements (user_id);

alter table public.acknowledgement_versions enable row level security;
alter table public.acknowledgements         enable row level security;

drop trigger if exists trg_ack_versions_updated_at on public.acknowledgement_versions;
create trigger trg_ack_versions_updated_at
  before update on public.acknowledgement_versions
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- account_agreements — terms/privacy acceptance recorded per account
-- ------------------------------------------------------------
create table public.account_agreements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  agreement_type text not null check (agreement_type in ('terms','privacy','membership')),
  version        text not null,
  accepted_at    timestamptz not null default now(),
  user_agent     text,
  created_at     timestamptz not null default now(),
  unique (user_id, agreement_type, version)
);

create index account_agreements_user_idx on public.account_agreements (user_id);
alter table public.account_agreements enable row level security;

-- ------------------------------------------------------------
-- applicant_profiles — pre-membership applicant record
-- ------------------------------------------------------------
create table public.applicant_profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users (id) on delete cascade,
  status         text not null default 'draft'
                 check (status in ('draft','submitted','in_review','approved','rejected')),
  headline       text,
  background     text,
  interests      text,
  referred_by    text,
  submitted_at   timestamptz,
  reviewed_by    uuid references public.profiles (id) on delete set null,
  reviewed_at    timestamptz,
  review_notes   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index applicant_profiles_status_idx on public.applicant_profiles (status);
alter table public.applicant_profiles enable row level security;

drop trigger if exists trg_applicant_profiles_updated_at on public.applicant_profiles;
create trigger trg_applicant_profiles_updated_at
  before update on public.applicant_profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- handle_new_user: profile + mandatory acknowledgement recording
-- Fires on Supabase Auth sign-up. Rejects the account when the signup payload
-- does not carry a valid acknowledgement (never silently accept).
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_ack_version integer;
  v_ack_at      timestamptz;
  v_user_agent   text;
  v_ack_exists   boolean;
begin
  v_ack_version := nullif(new.raw_user_meta_data ->> 'ack_version', '')::integer;
  v_ack_at      := nullif(new.raw_user_meta_data ->> 'ack_at', '')::timestamptz;
  v_user_agent  := left(new.raw_user_meta_data ->> 'user_agent', 500);

  if v_ack_version is null or v_ack_at is null then
    raise exception 'acknowledgement required before account creation'
      using errcode = 'P0001';
  end if;

  select exists (
    select 1 from public.acknowledgement_versions av
    where av.version = v_ack_version
      and av.is_active
      and av.published_at is not null
      and av.published_at <= v_ack_at
  ) into v_ack_exists;

  if not v_ack_exists then
    raise exception 'acknowledgement version is not valid or not published'
      using errcode = 'P0001';
  end if;

  insert into public.profiles (id, email, full_name, status, email_verified_at)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 200),
    'pending',
    case when new.email_confirmed_at is not null then new.email_confirmed_at end
  );

  insert into public.acknowledgements (user_id, acknowledgement_version, accepted_at, user_agent)
  values (new.id, v_ack_version, v_ack_at, v_user_agent)
  on conflict (user_id, acknowledgement_version) do nothing;

  -- Every account starts as an applicant record.
  insert into public.applicant_profiles (user_id) values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Email verification: when Supabase Auth confirms the address the account
-- becomes active. Profile writes run as definer (service path), so the status
-- change is allowed by protect_profile_privileges.
create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and (old.email_confirmed_at is null or old.email_confirmed_at is distinct from new.email_confirmed_at) then
    update public.profiles
       set email = new.email,
           email_verified_at = new.email_confirmed_at,
           status = case when status = 'pending' then 'active' else status end
     where id = new.id;
  elsif new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_email_confirmed();
