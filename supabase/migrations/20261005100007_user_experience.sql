-- ============================================================
-- Gillian Anderson Management · Authenticated experience
-- Request workflow (categories, fields, real timeline),
-- message read-state + attachments, email preferences
-- ============================================================

-- ------------------------------------------------------------
-- 1. requests: spec categories, richer statuses, full fields
-- ------------------------------------------------------------
alter table public.requests
  add column preferred_date          date,
  add column preferred_time          text,
  add column location                text,
  add column participants            text,
  add column contact_method          text,
  add column additional_requirements text;

alter table public.requests drop constraint if exists requests_type_check;
alter table public.requests add constraint requests_type_check check (type in (
  'personal_experience','video_communication','voice_message','text_message',
  'virtual_meeting','meet_greet','business_professional','special_occasion','other'));

alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests add constraint requests_status_check check (status in (
  'submitted','in_review','information_requested','proposal',
  'approved','scheduled','completed','declined','cancelled'));

-- ------------------------------------------------------------
-- 2. status & field integrity
--    * clients may only create a request as 'submitted'
--    * users may only withdraw (cancel) their own submitted request
--    * assigned_to belongs to management
--    * resolved_at follows terminal statuses
-- ------------------------------------------------------------
create or replace function public.protect_request_status()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if (select auth.uid()) is not null and not public.is_management() then
      if not (old.user_id = (select auth.uid())
              and old.status = 'submitted'
              and new.status = 'cancelled') then
        raise exception 'only management can change request status';
      end if;
    end if;
    if new.status in ('approved','declined','completed','cancelled')
       and new.resolved_at is null then
      new.resolved_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_request_insert on public.requests;
create or replace function public.protect_request_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and not public.is_management()
     and new.status <> 'submitted' then
    raise exception 'requests must start as submitted';
  end if;
  return new;
end;
$$;
create trigger trg_protect_request_insert
  before insert on public.requests
  for each row execute function public.protect_request_insert();

drop trigger if exists trg_protect_request_cols on public.requests;
create trigger trg_protect_request_cols
  before update on public.requests
  for each row execute function public.protect_management_columns('assigned_to');

-- ------------------------------------------------------------
-- 3. request_events: the real timeline.
--    Only events that actually happened are written, by
--    SECURITY DEFINER triggers (no fabricated history).
-- ------------------------------------------------------------
create table public.request_events (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  actor_id   uuid references auth.users (id) on delete set null,
  event_type text not null check (event_type in (
    'submitted','management_received','review_started','information_requested',
    'proposal_created','approved','scheduled','completed','declined','cancelled')),
  note       text,
  created_at timestamptz not null default now()
);
create index request_events_request_idx on public.request_events (request_id, created_at);
alter table public.request_events enable row level security;

revoke all on table public.request_events from anon;
revoke insert, update, delete on table public.request_events from authenticated;

drop policy if exists "request events read" on public.request_events;
create policy "request events read" on public.request_events for select to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.requests r
      where r.id = request_id and r.user_id = (select auth.uid())
    )
  );
drop policy if exists "request events management insert" on public.request_events;
create policy "request events management insert" on public.request_events
  for insert to authenticated with check ((select public.is_management()));

create or replace function public.record_request_events()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare evt text;
begin
  if tg_op = 'INSERT' then
    insert into public.request_events (request_id, actor_id, event_type)
    values (new.id, (select auth.uid()), 'submitted');
    return new;
  end if;

  if new.assigned_to is not null and old.assigned_to is null then
    insert into public.request_events (request_id, actor_id, event_type)
    values (new.id, (select auth.uid()), 'management_received');
  end if;

  if new.status is distinct from old.status then
    evt := case new.status
      when 'in_review'             then 'review_started'
      when 'information_requested' then 'information_requested'
      when 'proposal'              then 'proposal_created'
      when 'approved'              then 'approved'
      when 'scheduled'             then 'scheduled'
      when 'completed'             then 'completed'
      when 'declined'              then 'declined'
      when 'cancelled'             then 'cancelled'
    end;
    if evt is not null then
      insert into public.request_events (request_id, actor_id, event_type)
      values (new.id, (select auth.uid()), evt);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_record_request_events on public.requests;
create trigger trg_record_request_events
  after insert or update on public.requests
  for each row execute function public.record_request_events();

-- ------------------------------------------------------------
-- 4. messages: read-state updates (column-limited) + attachments
-- ------------------------------------------------------------
alter table public.management_messages
  add column attachments jsonb not null default '[]',
  add constraint management_messages_attachments_array
    check (jsonb_typeof(attachments) = 'array');

grant update (read_at) on table public.management_messages to authenticated;

drop policy if exists "conversation messages mark read" on public.management_messages;
create policy "conversation messages mark read" on public.management_messages
  for update to authenticated
  using (
    not is_internal
    and exists (
      select 1 from public.management_conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    not is_internal
    and exists (
      select 1 from public.management_conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

-- ------------------------------------------------------------
-- 5. profiles: email notification preferences
-- ------------------------------------------------------------
alter table public.profiles
  add column notify_requests    boolean not null default true,
  add column notify_membership  boolean not null default true,
  add column notify_experiences boolean not null default true;

grant update (notify_requests, notify_membership, notify_experiences)
  on table public.profiles to authenticated;

-- ------------------------------------------------------------
-- 6. realtime: live messages, notifications, requests
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['management_messages','notifications','requests','request_events'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 7. verification (fails the migration loudly if incomplete)
-- ------------------------------------------------------------
do $$
declare ok int;
begin
  select count(*) into ok from information_schema.columns
   where table_schema = 'public' and table_name = 'requests'
     and column_name in ('preferred_date','preferred_time','location',
                         'participants','contact_method','additional_requirements');
  if ok <> 6 then raise exception 'request field columns: expected 6, got %', ok; end if;

  select count(*) into ok from information_schema.columns
   where table_schema = 'public' and table_name = 'profiles'
     and column_name in ('notify_requests','notify_membership','notify_experiences');
  if ok <> 3 then raise exception 'profile preference columns: expected 3, got %', ok; end if;

  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'management_messages'
       and column_name = 'attachments'
  ) then raise exception 'management_messages.attachments missing'; end if;

  if (select relrowsecurity from pg_class where oid = 'public.request_events'::regclass) is not true then
    raise exception 'request_events RLS not enabled';
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'management_messages'
       and policyname = 'conversation messages mark read'
  ) then raise exception 'message read-state policy missing'; end if;

  if not exists (
    select 1 from pg_constraint where conname = 'requests_status_check'
  ) then raise exception 'requests status check missing'; end if;

  raise notice 'user experience migration complete';
end $$;
