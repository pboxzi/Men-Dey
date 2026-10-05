-- ============================================================
-- Gillian Anderson Management - Management Office / CMS
--   1. documents: request / membership assignment + archive
--   2. tasks: links to the actual records
--   3. staff roles: granular staff permissions (server-side)
--   4. has_permission(): authorization helper for policies
--   5. permission-gated policies: payment verification, CMS writes
--   6. audit triggers: append-oriented trail for sensitive actions
-- ============================================================

-- ------------------------------------------------------------ 1. documents
-- ------------------------------------------------------------ assignment lets every document link to its actual record;
-- archive keeps history instead of deleting important data.
alter table public.documents
  add column if not exists request_id    uuid references public.requests (id) on delete set null,
  add column if not exists membership_id uuid references public.memberships (id) on delete set null,
  add column if not exists archived_at   timestamptz;

create index if not exists documents_request_idx    on public.documents (request_id);
create index if not exists documents_membership_idx on public.documents (membership_id);
create index if not exists documents_archived_idx   on public.documents (archived_at)
  where archived_at is not null;

-- ------------------------------------------------------------ 2. tasks
-- ------------------------------------------------------------ every task links back to the record it belongs to.
alter table public.tasks
  add column if not exists related_user_id       uuid references public.profiles (id) on delete set null,
  add column if not exists related_request_id    uuid references public.requests (id) on delete set null,
  add column if not exists related_experience_id uuid references public.experiences (id) on delete set null;

create index if not exists tasks_related_user_idx       on public.tasks (related_user_id);
create index if not exists tasks_related_request_idx    on public.tasks (related_request_id);
create index if not exists tasks_related_experience_idx on public.tasks (related_experience_id);

-- ------------------------------------------------------------ 3. staff roles
-- ------------------------------------------------------------ granular console roles. profiles.role stays the trust
-- boundary (user/management/admin); these scope what a staff
-- account may do inside the office. 'admin' and 'management'
-- accounts without a staff profile keep full console access.
insert into public.staff_roles (key, name, description, permissions) values
  ('admin',           'Administrator',    'Full access to the management office',
    array['*']),
  ('manager',         'Manager',          'Relationships, requests, experiences and payments',
    array['fans.read','requests.manage','messages.manage','membership.manage',
          'experience.manage','payments.manage','documents.manage','tasks.manage']),
  ('agent',           'Agent',            'Requests, conversations and follow-up work',
    array['fans.read','requests.manage','messages.manage','documents.manage','tasks.manage']),
  ('support',         'Support',          'Inbox, fans and task support',
    array['fans.read','messages.manage','tasks.manage']),
  ('finance',         'Finance',          'Payment verification, memberships and financial documents',
    array['fans.read','membership.manage','payments.manage','documents.manage','tasks.manage']),
  ('content_manager', 'Content Manager',  'CMS pages, sections and the media library',
    array['content.manage','documents.manage','tasks.manage'])
on conflict (key) do update
  set name        = excluded.name,
      description = excluded.description,
      permissions = excluded.permissions,
      updated_at  = now();

-- ------------------------------------------------------------ 4. has_permission
-- server-side authorization used inside RLS policies.
--   admin                     -> everything
--   active staff profile      -> permission must be in its staff role
--   management without staff  -> full console access (legacy behavior)
--   anyone else               -> nothing
create or replace function public.has_permission(p_permission text)
returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  select role into v_role
    from public.profiles
   where id = (select auth.uid());

  if v_role = 'admin' then
    return true;
  end if;
  if v_role is distinct from 'management' then
    return false;
  end if;

  if exists (
    select 1
      from public.staff_profiles sp
     where sp.user_id = (select auth.uid())
       and sp.is_active
       and sp.staff_role_id is not null
  ) then
    return exists (
      select 1
        from public.staff_profiles sp
        join public.staff_roles sr on sr.id = sp.staff_role_id
       where sp.user_id = (select auth.uid())
         and sp.is_active
         and (p_permission = any (sr.permissions) or '*' = any (sr.permissions))
    );
  end if;

  return true;
end;
$$;

revoke execute on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated, service_role;

-- ------------------------------------------------------------ 5. gated policies
-- ------------------------------------------------------------ payment verification: is_management + payments.manage.
drop policy if exists "membership payments update" on public.membership_payments;
create policy "membership payments update" on public.membership_payments
  for update to authenticated
  using ((select public.is_management()) and (select public.has_permission('payments.manage')))
  with check ((select public.is_management()) and (select public.has_permission('payments.manage')));

drop policy if exists "experience payments update" on public.experience_payments;
create policy "experience payments update" on public.experience_payments
  for update to authenticated
  using ((select public.is_management()) and (select public.has_permission('payments.manage')))
  with check ((select public.is_management()) and (select public.has_permission('payments.manage')));

-- content writes: administrators, or staff holding content.manage.
drop policy if exists "cms pages write" on public.cms_pages;
create policy "cms pages write" on public.cms_pages for all to authenticated
  using ((select public.is_admin()) or (select public.has_permission('content.manage')))
  with check ((select public.is_admin()) or (select public.has_permission('content.manage')));

drop policy if exists "cms sections write" on public.cms_sections;
create policy "cms sections write" on public.cms_sections for all to authenticated
  using ((select public.is_admin()) or (select public.has_permission('content.manage')))
  with check ((select public.is_admin()) or (select public.has_permission('content.manage')));

drop policy if exists "media assets write" on public.media_assets;
create policy "media assets write" on public.media_assets for all to authenticated
  using ((select public.is_admin()) or (select public.has_permission('content.manage')))
  with check ((select public.is_admin()) or (select public.has_permission('content.manage')));

-- ------------------------------------------------------------ 6. audit triggers
-- clients can never write audit_logs; every sensitive change is
-- recorded here from a server-side trigger instead.
create or replace function public.record_management_audit()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_entity text := tg_table_name;
  v_action text;
  v_meta   jsonb := '{}'::jsonb;
  v_label  text;
begin
  if tg_op = 'INSERT' then
    v_action := case v_entity
      when 'documents'      then 'document.uploaded'
      when 'staff_profiles' then 'staff.added'
      when 'site_settings'  then 'settings.created'
      else v_entity || '.created'
    end;
    v_meta := jsonb_build_object('id', new.id);

  elsif tg_op = 'UPDATE' then
    if v_entity = 'profiles' then
      if new.role is distinct from old.role then
        v_action := 'account.role_changed';
      elsif new.status is distinct from old.status then
        v_action := 'account.status_changed';
      else
        return new;
      end if;
      v_meta := jsonb_build_object(
        'user_id',    new.id,
        'from_role',  old.role,    'to_role',  new.role,
        'from_status', old.status, 'to_status', new.status);

    elsif v_entity = 'staff_profiles' then
      if new.staff_role_id is distinct from old.staff_role_id
         or new.is_active is distinct from old.is_active then
        v_action := 'staff.permission_changed';
        v_meta   := jsonb_build_object('user_id', new.user_id, 'active', new.is_active);
      else
        return new;
      end if;

    elsif v_entity = 'site_settings' then
      if new.value is distinct from old.value
         or new.is_public is distinct from old.is_public then
        v_action := 'settings.changed';
        v_meta   := jsonb_build_object('key', new.key, 'is_public', new.is_public);
      else
        return new;
      end if;

    elsif new.status is distinct from old.status then
      if v_entity in ('membership_payments','experience_payments')
         and new.status in ('paid','succeeded') then
        v_action := 'payment.verified';
      elsif v_entity in ('membership_offers','experience_proposals')
         and old.status = 'draft' and new.status = 'sent' then
        v_action := 'proposal.sent';
      else
        v_action := v_entity || '.status_changed';
      end if;
      v_meta := jsonb_build_object('from', old.status, 'to', new.status);

    else
      return new;  -- updated_at / non-status churn is not an event
    end if;

  else -- DELETE
    v_action := v_entity || '.deleted';
    v_meta   := jsonb_build_object('id', old.id);
  end if;

  select email into v_label
    from public.profiles
   where id = (select auth.uid());

  insert into public.audit_logs (actor_id, actor_label, action, entity, entity_id, metadata)
  values ((select auth.uid()), v_label, v_action, v_entity,
          case when tg_op = 'DELETE' then old.id::text else new.id::text end,
          v_meta);

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'requests','memberships','membership_offers','experience_proposals',
    'membership_payments','experience_payments','documents','staff_profiles',
    'profiles','tasks','applicant_profiles','site_settings'
  ] loop
    execute format('drop trigger if exists trg_audit_%s on public.%s', t, t);
    execute format(
      'create trigger trg_audit_%s after insert or update or delete on public.%s '
      'for each row execute function public.record_management_audit()', t, t);
  end loop;
end $$;

-- ============================================================
-- verification
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array['request_id','membership_id','archived_at'] loop
    if not exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'documents' and column_name = t
    ) then raise exception 'documents.% missing', t; end if;
  end loop;

  foreach t in array array['related_user_id','related_request_id','related_experience_id'] loop
    if not exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'tasks' and column_name = t
    ) then raise exception 'tasks.% missing', t; end if;
  end loop;

  if (select count(*) from public.staff_roles
       where key in ('admin','manager','agent','support','finance','content_manager')) <> 6 then
    raise exception 'staff roles not seeded';
  end if;
  if exists (
    select 1 from public.staff_roles where key = 'manager'
      and not ('payments.manage' = any (permissions))
  ) then raise exception 'manager must hold payments.manage'; end if;
  if exists (
    select 1 from public.staff_roles where key = 'content_manager'
      and not ('content.manage' = any (permissions))
  ) then raise exception 'content_manager must hold content.manage'; end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'has_permission'
  ) then raise exception 'has_permission missing'; end if;
  if has_function_privilege('anon', 'public.has_permission(text)', 'EXECUTE') then
    raise exception 'anon must not execute has_permission';
  end if;
  if not has_function_privilege('authenticated', 'public.has_permission(text)', 'EXECUTE') then
    raise exception 'authenticated must be able to execute has_permission';
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'membership_payments'
       and cmd = 'UPDATE' and qual like '%payments.manage%'
  ) then raise exception 'membership payments update must require payments.manage'; end if;
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'experience_payments'
       and cmd = 'UPDATE' and qual like '%payments.manage%'
  ) then raise exception 'experience payments update must require payments.manage'; end if;
  if exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename in ('cms_pages','cms_sections','media_assets')
       and cmd in ('INSERT','UPDATE','ALL')
       and qual not like '%content.manage%'
  ) then raise exception 'content writes must require content.manage'; end if;

  foreach t in array array[
    'requests','memberships','membership_offers','experience_proposals',
    'membership_payments','experience_payments','documents','staff_profiles',
    'profiles','tasks','applicant_profiles','site_settings'
  ] loop
    if not exists (
      select 1 from pg_trigger
       where tgname = 'trg_audit_' || t
         and tgrelid = ('public.' || t)::regclass
         and not tgisinternal
    ) then raise exception 'audit trigger missing on %', t; end if;
  end loop;

  raise notice 'management office migration complete';
end $$;
