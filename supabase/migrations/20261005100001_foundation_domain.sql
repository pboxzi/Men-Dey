-- ============================================================
-- Gillian Anderson Management · Foundation 2/5
-- Domain: communication, requests, membership, experiences, operations, CMS
-- ============================================================
-- Every business table: UUID id, created_at, updated_at where appropriate,
-- real foreign keys (no JSON stand-ins for related data), indexes on every
-- lookup column, RLS enabled.

-- ------------------------------------------------------------
-- Management communication (management is always the bridge)
-- ------------------------------------------------------------
create table public.management_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  subject     text not null,
  status      text not null default 'open' check (status in ('open','waiting','closed')),
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index mgmt_conv_user_idx     on public.management_conversations (user_id);
create index mgmt_conv_status_idx   on public.management_conversations (status);
create index mgmt_conv_assigned_idx on public.management_conversations (assigned_to);
alter table public.management_conversations enable row level security;

create table public.management_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.management_conversations (id) on delete cascade,
  sender_id       uuid references public.profiles (id) on delete set null,
  body            text not null,
  is_internal     boolean not null default false,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index mgmt_msg_conv_idx on public.management_messages (conversation_id, created_at);
create index mgmt_msg_sender_idx on public.management_messages (sender_id);
alter table public.management_messages enable row level security;

create table public.management_notes (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.management_conversations (id) on delete cascade,
  user_id         uuid references auth.users (id) on delete cascade,
  author_id       uuid references public.profiles (id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index mgmt_notes_conv_idx on public.management_notes (conversation_id);
create index mgmt_notes_user_idx on public.management_notes (user_id);
alter table public.management_notes enable row level security;

-- ------------------------------------------------------------
-- Requests (user → management)
-- ------------------------------------------------------------
create table public.requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  type         text not null check (type in (
                 'general','appearance','booking','collaboration','press','other')),
  title        text not null,
  description  text,
  status       text not null default 'submitted' check (status in (
                 'submitted','in_review','information_requested','approved',
                 'declined','closed','cancelled')),
  priority     text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_to  uuid references public.profiles (id) on delete set null,
  submitted_at timestamptz not null default now(),
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index requests_user_idx   on public.requests (user_id);
create index requests_status_idx on public.requests (status);
create index requests_assign_idx on public.requests (assigned_to);
alter table public.requests enable row level security;

create table public.request_messages (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  sender_id  uuid references public.profiles (id) on delete set null,
  body       text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);
create index request_messages_request_idx on public.request_messages (request_id, created_at);
alter table public.request_messages enable row level security;

-- Only management/admin may change request status (server-side, not RLS-only).
create or replace function public.protect_request_status()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     and (select auth.uid()) is not null
     and not public.is_management() then
    raise exception 'only management can change request status';
  end if;
  if new.status is distinct from old.status
     and new.status in ('approved','declined','closed')
     and new.resolved_at is null then
    new.resolved_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_request_status on public.requests;
create trigger trg_protect_request_status
  before update of status on public.requests
  for each row execute function public.protect_request_status();

-- ------------------------------------------------------------
-- Membership (spec: MEMBERSHIP)
-- ------------------------------------------------------------
create table public.membership_tiers (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  name         text not null,
  description  text,
  price_cents  integer not null check (price_cents >= 0),
  currency     text not null default 'USD',
  interval     text not null default 'monthly' check (interval in ('monthly','annual','one_time')),
  benefits     text[] not null default '{}',
  is_active    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index membership_tiers_active_idx on public.membership_tiers (is_active, sort_order);
alter table public.membership_tiers enable row level security;

create table public.membership_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  tier_id       uuid not null references public.membership_tiers (id),
  status        text not null default 'submitted' check (status in (
                  'submitted','in_review','approved','rejected','withdrawn')),
  statement     text,
  submitted_at  timestamptz not null default now(),
  reviewed_by   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  review_notes  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index membership_apps_user_idx  on public.membership_applications (user_id);
create index membership_apps_tier_idx  on public.membership_applications (tier_id);
create index membership_apps_status_idx on public.membership_applications (status);
alter table public.membership_applications enable row level security;

create table public.membership_offers (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.membership_applications (id) on delete cascade,
  tier_id        uuid not null references public.membership_tiers (id),
  status         text not null default 'sent' check (status in
                   ('sent','accepted','declined','expired')),
  offered_at     timestamptz not null default now(),
  expires_at     timestamptz,
  responded_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index membership_offers_app_idx  on public.membership_offers (application_id);
create index membership_offers_status_idx on public.membership_offers (status);
alter table public.membership_offers enable row level security;

create table public.memberships (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  tier_id         uuid not null references public.membership_tiers (id),
  application_id  uuid references public.membership_applications (id) on delete set null,
  offer_id        uuid references public.membership_offers (id) on delete set null,
  status          text not null default 'pending' check (status in
                    ('pending','active','paused','cancelled','expired')),
  membership_number text unique,
  started_at      timestamptz,
  expires_at      timestamptz,
  cancelled_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index memberships_user_idx   on public.memberships (user_id);
create index memberships_status_idx on public.memberships (status);
create index memberships_tier_idx   on public.memberships (tier_id);
alter table public.memberships enable row level security;

create table public.membership_payments (
  id           uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  currency     text not null default 'USD',
  status       text not null default 'pending' check (status in
                 ('pending','succeeded','failed','refunded')),
  provider     text,
  provider_ref text,
  paid_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index membership_payments_member_idx on public.membership_payments (membership_id);
create index membership_payments_status_idx on public.membership_payments (status);
alter table public.membership_payments enable row level security;

-- ------------------------------------------------------------
-- Experiences (experiences approved by management, bridged to Gillian)
-- ------------------------------------------------------------
create table public.experiences (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text,
  location     text,
  capacity     integer check (capacity is null or capacity > 0),
  price_cents  integer check (price_cents is null or price_cents >= 0),
  currency     text not null default 'USD',
  status       text not null default 'draft' check (status in
                 ('draft','published','full','cancelled','completed')),
  starts_at    timestamptz,
  ends_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index experiences_status_idx on public.experiences (status);
create index experiences_dates_idx  on public.experiences (starts_at, ends_at);
alter table public.experiences enable row level security;

create table public.experience_requests (
  id            uuid primary key default gen_random_uuid(),
  experience_id uuid references public.experiences (id) on delete set null,
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  description   text,
  preferred_dates text,
  status        text not null default 'submitted' check (status in
                  ('submitted','in_review','requirements','proposed','approved',
                   'declined','completed','cancelled')),
  assigned_to   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index exp_requests_user_idx  on public.experience_requests (user_id);
create index exp_requests_status_idx on public.experience_requests (status);
create index exp_requests_exp_idx   on public.experience_requests (experience_id);
alter table public.experience_requests enable row level security;

create table public.experience_requirements (
  id                  uuid primary key default gen_random_uuid(),
  experience_request_id uuid not null references public.experience_requests (id) on delete cascade,
  label               text not null,
  description         text,
  is_required         boolean not null default true,
  response            text,
  responded_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index exp_reqs_request_idx on public.experience_requirements (experience_request_id);
alter table public.experience_requirements enable row level security;

create table public.experience_proposals (
  id                  uuid primary key default gen_random_uuid(),
  experience_request_id uuid not null references public.experience_requests (id) on delete cascade,
  version             integer not null default 1,
  summary             text not null,
  terms               text,
  amount_cents        integer check (amount_cents is null or amount_cents >= 0),
  currency            text not null default 'USD',
  status              text not null default 'draft' check (status in
                        ('draft','sent','accepted','declined','expired')),
  sent_at             timestamptz,
  responded_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (experience_request_id, version)
);
create index exp_proposals_request_idx on public.experience_proposals (experience_request_id);
create index exp_proposals_status_idx  on public.experience_proposals (status);
alter table public.experience_proposals enable row level security;

create table public.experience_schedules (
  id                  uuid primary key default gen_random_uuid(),
  experience_id       uuid references public.experiences (id) on delete cascade,
  experience_request_id uuid references public.experience_requests (id) on delete cascade,
  title               text not null,
  location            text,
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  status              text not null default 'scheduled' check (status in
                        ('scheduled','changed','cancelled','completed')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index exp_schedules_exp_idx    on public.experience_schedules (experience_id);
create index exp_schedules_request_idx on public.experience_schedules (experience_request_id);
alter table public.experience_schedules enable row level security;

create table public.experience_payments (
  id                  uuid primary key default gen_random_uuid(),
  experience_request_id uuid references public.experience_requests (id) on delete cascade,
  proposal_id         uuid references public.experience_proposals (id) on delete set null,
  amount_cents        integer not null check (amount_cents >= 0),
  currency            text not null default 'USD',
  status              text not null default 'pending' check (status in
                        ('pending','succeeded','failed','refunded')),
  provider            text,
  provider_ref        text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index exp_payments_request_idx on public.experience_payments (experience_request_id);
create index exp_payments_status_idx  on public.experience_payments (status);
alter table public.experience_payments enable row level security;

create table public.appointments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  location    text,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'scheduled' check (status in
                ('scheduled','confirmed','cancelled','completed','no_show')),
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index appointments_user_idx  on public.appointments (user_id);
create index appointments_dates_idx on public.appointments (starts_at, ends_at);
alter table public.appointments enable row level security;

-- ------------------------------------------------------------
-- Operations
-- ------------------------------------------------------------
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  category      text not null default 'general' check (category in
                  ('general','contract','agreement','financial','brief','press','other')),
  visibility    text not null default 'management' check (visibility in
                  ('private','shared','management')),
  owner_user_id uuid references auth.users (id) on delete cascade,
  bucket        text,
  storage_path  text,
  mime_type     text,
  size_bytes    bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index documents_owner_idx on public.documents (owner_user_id);
create index documents_visibility_idx on public.documents (visibility);
alter table public.documents enable row level security;

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  body       text,
  type       text not null default 'info' check (type in
               ('info','request','membership','experience','account','system')),
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx   on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;
alter table public.notifications enable row level security;

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'open' check (status in
                ('open','in_progress','blocked','done','cancelled')),
  priority    text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assignee_id uuid references public.profiles (id) on delete set null,
  due_at      timestamptz,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index tasks_assignee_idx on public.tasks (assignee_id);
create index tasks_status_idx   on public.tasks (status);
alter table public.tasks enable row level security;

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users (id) on delete set null,
  actor_label text,
  action      text not null,
  entity      text not null,
  entity_id   text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_entity_idx  on public.audit_logs (entity, entity_id);
create index audit_logs_actor_idx   on public.audit_logs (actor_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
alter table public.audit_logs enable row level security;

create table public.site_settings (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      jsonb not null default '{}'::jsonb,
  is_public  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

-- ------------------------------------------------------------
-- CMS
-- ------------------------------------------------------------
create table public.cms_pages (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title      text not null,
  status     text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cms_pages enable row level security;

create table public.cms_sections (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.cms_pages (id) on delete cascade,
  key        text not null,
  title      text,
  content    jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, key)
);
create index cms_sections_page_idx on public.cms_sections (page_id, sort_order);
alter table public.cms_sections enable row level security;

create table public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  kind         text not null check (kind in ('image','video','document','audio')),
  bucket       text,
  storage_path text,
  url          text,
  alt_text     text,
  visibility   text not null default 'management' check (visibility in
                 ('private','shared','public')),
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index media_assets_kind_idx      on public.media_assets (kind);
create index media_assets_visibility_idx on public.media_assets (visibility);
alter table public.media_assets enable row level security;

-- ------------------------------------------------------------
-- updated_at triggers for every table that has the column
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'management_conversations','management_notes','requests',
    'membership_tiers','membership_applications','membership_offers',
    'memberships','membership_payments','experiences','experience_requests',
    'experience_requirements','experience_proposals','experience_schedules',
    'experience_payments','appointments','documents','tasks','site_settings',
    'cms_pages','cms_sections','media_assets'
  ] loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$I', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$I
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
