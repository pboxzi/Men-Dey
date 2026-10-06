-- ============================================================
-- Gillian Anderson Management · Communication production layer
-- Notification engine (15 types, dedupe, deliveries), Resend-backed
-- email queue, server-side rate limits, message/document triggers,
-- reminders via pg_cron + pg_net, realtime publication, error logs
-- ============================================================
-- Email flow: DB functions queue rows in public.email_logs and POST to the
-- send-edge function (no secrets stored in the database — the function holds
-- RESEND_API_KEY and SUPABASE_SERVICE_ROLE_KEY as Supabase secrets). The
-- function claims a row with an optimistic status guard so a message can
-- never be sent twice. pg_cron retries anything stuck.

-- ------------------------------------------------------------
-- 1. Extensions (idempotent; already enabled on this project)
-- ------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

grant usage on schema net to postgres, service_role;
grant execute on all functions in schema net to postgres, service_role;
grant usage on schema cron to postgres;

-- ------------------------------------------------------------
-- 2. Notification types: the 15 spec types + legacy values still
--    present on existing rows (previous triggers are retyped below)
-- ------------------------------------------------------------
alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (type in (
    'new_message','request_update','information_required','membership_offer',
    'membership_accepted','payment_requested','payment_received',
    'membership_activated','experience_proposal','experience_confirmed',
    'experience_scheduled','experience_cancelled','document_uploaded',
    'management_announcement','system',
    'info','request','membership','experience','account'));
alter table public.notifications alter column type set default 'system';

-- per-user message notifications toggle (in-app + email gate)
alter table public.profiles
  add column if not exists notify_messages boolean not null default true;
grant update (notify_messages) on table public.profiles to authenticated;

-- ------------------------------------------------------------
-- 3. email_logs: queue + audit of every outbound email
--    (recipient, template, subject, provider ID, status, sent_at, error)
-- ------------------------------------------------------------
create table if not exists public.email_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users (id) on delete set null,
  recipient       text not null,
  template        text not null,
  subject         text not null,
  provider_id     text,
  status          text not null default 'queued'
                    check (status in ('queued','sending','sent','failed')),
  error           text,
  attempts        integer not null default 0,
  params          jsonb not null default '{}'::jsonb,
  dedupe_key      text,
  last_attempt_at timestamptz,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists email_logs_status_idx
  on public.email_logs (status, created_at)
  where status in ('queued','failed');
create unique index if not exists email_logs_dedupe_idx
  on public.email_logs (dedupe_key) where dedupe_key is not null;
alter table public.email_logs enable row level security;

revoke all on table public.email_logs from anon, authenticated;
revoke all on table public.email_logs from service_role;
grant insert, select, update on table public.email_logs to service_role;

drop policy if exists "email logs read" on public.email_logs;
create policy "email logs read" on public.email_logs
  for select to authenticated using ((select public.is_management()));

-- ------------------------------------------------------------
-- 4. notification_deliveries: dedupe ledger (no duplicate reminders)
-- ------------------------------------------------------------
create table if not exists public.notification_deliveries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  type            text not null,
  dedupe_key      text not null,
  notification_id uuid references public.notifications (id) on delete set null,
  email_log_id    uuid references public.email_logs (id) on delete set null,
  created_at      timestamptz not null default now()
);
create unique index if not exists notification_deliveries_dedupe_idx
  on public.notification_deliveries (user_id, dedupe_key);
alter table public.notification_deliveries enable row level security;

revoke all on table public.notification_deliveries from anon, authenticated;
drop policy if exists "notification deliveries read" on public.notification_deliveries;
create policy "notification deliveries read" on public.notification_deliveries
  for select to authenticated using ((select public.is_management()));

-- ------------------------------------------------------------
-- 5. rate_limits + rate_limit(): atomic fixed-window counter
-- ------------------------------------------------------------
create table if not exists public.rate_limits (
  bucket       text not null,
  key          text not null,
  window_start timestamptz not null default now(),
  count        integer not null default 0,
  primary key (bucket, key)
);
alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;
grant select, insert, update, delete on table public.rate_limits to service_role;

create or replace function public.rate_limit(
  p_bucket text, p_key text, p_max integer, p_window_seconds integer
)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare v_count integer;
begin
  delete from public.rate_limits
   where window_start < now() - interval '1 day';

  insert into public.rate_limits (bucket, key, window_start, count)
  values (p_bucket, p_key, now(), 1)
  on conflict (bucket, key) do update set
    count = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else rate_limits.count + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else rate_limits.window_start
    end
  returning count into v_count;

  return v_count <= p_max;
end;
$$;
revoke execute on function public.rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.rate_limit(text, text, integer, integer)
  to service_role;

-- ------------------------------------------------------------
-- 6. email queue: queue_email() inserts a row and immediately asks the
--    edge function to deliver it; retry_email_queue() re-posts stuck rows.
--    Nothing secret lives in the database: the function URL is public and
--    send-email holds its own secrets.
-- ------------------------------------------------------------
create or replace function public.queue_email(
  p_user_id uuid,
  p_template text,
  p_subject text,
  p_params jsonb default '{}'::jsonb,
  p_dedupe_key text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_recipient text;
  v_id        uuid;
  v_enabled   boolean;
begin
  if p_user_id is null or p_template is null or p_subject is null then
    return null;
  end if;

  select coalesce(p.email, u.email)
    into v_recipient
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.id = p_user_id;
  if v_recipient is null then
    return null;
  end if;

  -- management-controlled per-template switch (missing key = enabled)
  select case when s.value ? p_template
              then coalesce((s.value ->> p_template)::boolean, true)
              else true end
    into v_enabled
    from public.site_settings s
   where s.key = 'email_notifications';
  if coalesce(v_enabled, true) is not true then
    return null;
  end if;

  begin
    insert into public.email_logs
      (user_id, recipient, template, subject, params, dedupe_key, status)
    values
      (p_user_id, v_recipient, p_template, p_subject, p_params, p_dedupe_key, 'queued')
    returning id into v_id;
  exception when unique_violation then
    return null; -- already queued: never send twice
  end;

  return v_id;
end;
$$;
revoke execute on function public.queue_email(uuid, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.queue_email(uuid, text, text, jsonb, text)
  to service_role;

create or replace function public.post_email_job(p_log_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  begin
    update public.email_logs
       set last_attempt_at = now()
     where id = p_log_id
       and status in ('queued','failed')
       and attempts < 5;
  exception when others then
    raise notice 'email attempt marker failed: %', sqlerrm;
  end;

  begin
    perform net.http_post(
      url     := 'https://wmhndjdxvxtozeyesvsy.functions.supabase.co/send-email',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := jsonb_build_object('mode', 'process', 'log_id', p_log_id),
      timeout_milliseconds := 10000
    );
  exception when others then
    -- queue stays intact; pg_cron retries via retry_email_queue()
    raise notice 'email dispatch deferred: %', sqlerrm;
  end;
end;
$$;
revoke execute on function public.post_email_job(uuid)
  from public, anon, authenticated;
grant execute on function public.post_email_job(uuid) to service_role;

create or replace function public.retry_email_queue()
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare v_n integer := 0;
declare r record;
begin
  for r in
    select id from public.email_logs
     where attempts < 5
       and status in ('queued','failed')
       and (last_attempt_at is null
            or last_attempt_at < now() - interval '2 minutes')
     order by created_at
     limit 20
  loop
    perform public.post_email_job(r.id);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;
revoke execute on function public.retry_email_queue()
  from public, anon, authenticated;
grant execute on function public.retry_email_queue()
  to service_role;

-- ------------------------------------------------------------
-- 7. notify_user(): the notification engine
--    * category preference gate (in-app + email)
--    * (user, dedupe_key) ledger → duplicate events never notify twice
--    * 10-minute same-title window for callers without a key
--      (also collapses legacy trigger + typed trigger double fires)
--    * optional email through queue_email()
-- ------------------------------------------------------------
drop function if exists public.notify_user(uuid, text, text, text, text);
create or replace function public.notify_user(
  p_user_id       uuid,
  p_type          text,
  p_title         text,
  p_body          text,
  p_link          text,
  p_dedupe_key    text default null,
  p_email_template text default null,
  p_email_params  jsonb default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_kind       text;
  v_ok         boolean := true;
  v_id         uuid;
  v_delivery   uuid;
  v_log_id     uuid;
  v_email_prms jsonb;
begin
  if p_user_id is null or p_title is null then
    return null;
  end if;

  -- category preference (also gates email)
  v_kind := case p_type
    when 'request_update'         then 'request'
    when 'information_required'   then 'request'
    when 'document_uploaded'      then 'request'
    when 'membership_offer'       then 'membership'
    when 'membership_accepted'    then 'membership'
    when 'membership_activated'   then 'membership'
    when 'payment_requested'      then 'membership'
    when 'payment_received'       then 'membership'
    when 'experience_proposal'    then 'experiences'
    when 'experience_confirmed'   then 'experiences'
    when 'experience_scheduled'   then 'experiences'
    when 'experience_cancelled'   then 'experiences'
    when 'new_message'            then 'messages'
    when 'request'                then 'request'
    when 'membership'             then 'membership'
    when 'experience'             then 'experiences'
    else null
  end;
  if v_kind is not null then
    select case v_kind
      when 'request'     then coalesce(p.notify_requests, true)
      when 'membership'  then coalesce(p.notify_membership, true)
      when 'experiences' then coalesce(p.notify_experiences, true)
      when 'messages'    then coalesce(p.notify_messages, true)
      else true
    end
      into v_ok
      from public.profiles p
     where p.id = p_user_id;
    if v_ok is not true then
      return null;
    end if;
  end if;

  -- duplicate protection: explicit key wins; otherwise collapse identical
  -- titles to the same user within 10 minutes (new messages are exempt)
  if p_dedupe_key is not null then
    insert into public.notification_deliveries (user_id, type, dedupe_key)
    values (p_user_id, p_type, p_dedupe_key)
    on conflict (user_id, dedupe_key) do nothing
    returning id into v_delivery;
    if v_delivery is null then
      return null;
    end if;
  elsif p_type <> 'new_message' then
    if exists (
      select 1 from public.notifications n
       where n.user_id = p_user_id
         and n.title = p_title
         and n.created_at > now() - interval '10 minutes'
    ) then
      return null;
    end if;
  end if;

  insert into public.notifications (user_id, title, body, type, link)
  values (p_user_id, p_title, p_body, p_type, p_link)
  returning id into v_id;

  if p_email_template is not null then
    v_email_prms := coalesce(p_email_params, '{}'::jsonb)
      || jsonb_build_object(
           'name',  coalesce((select nullif(left(p2.full_name, 80), '')
                                from public.profiles p2 where p2.id = p_user_id), 'there'),
           'title', p_title,
           'body',  coalesce(p_body, ''),
           'link',  coalesce(p_link, '')
         );
    v_log_id := public.queue_email(
      p_user_id, p_email_template,
      coalesce(v_email_prms ->> 'email_subject', p_title),
      v_email_prms,
      p_dedupe_key
    );
    if v_log_id is not null then
      update public.notification_deliveries
         set email_log_id = v_log_id
       where id = v_delivery;
      perform public.post_email_job(v_log_id);
    end if;
  end if;

  return v_id;
end;
$$;
revoke execute on function public.notify_user(uuid, text, text, text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.notify_user(uuid, text, text, text, text, text, text, jsonb)
  to service_role;

-- ------------------------------------------------------------
-- 8. send_announcement(): management broadcast, deduped per user
-- ------------------------------------------------------------
create or replace function public.send_announcement(
  p_title text, p_body text, p_link text default null
)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare v_key text := 'announce:' || gen_random_uuid()::text;
declare v_n integer := 0;
declare r record;
begin
  if (select auth.role()) = 'anon' then
    raise exception 'only management can send announcements';
  end if;
  if (select auth.uid()) is not null and not public.is_management() then
    raise exception 'only management can send announcements';
  end if;
  if coalesce(btrim(p_title), '') = '' then
    raise exception 'announcement title is required';
  end if;

  for r in
    select id from public.profiles where role = 'user' and status = 'active'
  loop
    if public.notify_user(
      r.id, 'management_announcement', btrim(p_title),
      nullif(btrim(coalesce(p_body, '')), ''), p_link, v_key
    ) is not null then
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end;
$$;
revoke execute on function public.send_announcement(text, text, text)
  from public, anon;
grant execute on function public.send_announcement(text, text, text)
  to authenticated, service_role;

-- ------------------------------------------------------------
-- 9. Message & document triggers: rate limits + notifications
-- ------------------------------------------------------------
create or replace function public.enforce_message_rate()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_sender uuid := coalesce(new.sender_id, (select auth.uid()));
begin
  if v_sender is null then
    return new;
  end if;
  if not public.rate_limit('message_send', v_sender::text, 30, 300) then
    raise exception 'rate limit exceeded: you are sending messages too quickly — wait a few minutes'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_rate_messages on public.management_messages;
create trigger trg_rate_messages
  before insert on public.management_messages
  for each row execute function public.enforce_message_rate();

drop trigger if exists trg_rate_request_messages on public.request_messages;
create trigger trg_rate_request_messages
  before insert on public.request_messages
  for each row execute function public.enforce_message_rate();

create or replace function public.enforce_request_rate()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_user uuid := coalesce((select auth.uid()), new.user_id);
begin
  if v_user is null then
    return new;
  end if;
  if not public.rate_limit('request_create', v_user::text, 10, 3600) then
    raise exception 'rate limit exceeded: you have sent several requests recently — try again later'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_rate_requests on public.requests;
create trigger trg_rate_requests
  before insert on public.requests
  for each row execute function public.enforce_request_rate();

create or replace function public.enforce_upload_rate()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_key text := coalesce(new.uploaded_by, new.owner_user_id, (select auth.uid()));
begin
  if v_key is null then
    return new;
  end if;
  if not public.rate_limit('document_upload', v_key::text, 30, 3600) then
    raise exception 'rate limit exceeded: too many uploads — try again later'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_rate_documents on public.documents;
create trigger trg_rate_documents
  before insert on public.documents
  for each row execute function public.enforce_upload_rate();

-- fan → management: notify the other side of a conversation
create or replace function public.notify_new_conversation_message()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_conv record;
declare v_from_mgmt boolean;
declare v_staff record;
begin
  if new.is_internal then
    return new; -- internal notes never reach the fan
  end if;

  select id, user_id, assigned_to, subject
    into v_conv
    from public.management_conversations
   where id = new.conversation_id;
  if not found then
    return new;
  end if;

  v_from_mgmt := exists (
    select 1 from public.profiles p
     where p.id = new.sender_id and p.role in ('management','admin')
  );

  if v_from_mgmt then
    perform public.notify_user(
      v_conv.user_id, 'new_message',
      'New message from management',
      left(nullif(btrim(new.body), ''), 400),
      '/dashboard/messages/' || v_conv.id,
      null,
      'new_management_message',
      jsonb_build_object('email_subject', 'Management sent you a message')
    );
  else
    -- member wrote: notify management (assigned staff, or the whole team)
    for v_staff in
      select p.id from public.profiles p
       where p.role in ('management','admin')
         and p.status = 'active'
         and (v_conv.assigned_to is null or p.id = v_conv.assigned_to)
    loop
      perform public.notify_user(
        v_staff.id, 'new_message',
        'New message from a member',
        left(nullif(btrim(new.body), ''), 400),
        '/management/messages/' || v_conv.id,
        'staff-msg:' || new.id || ':' || v_staff.id
      );
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_message on public.management_messages;
create trigger trg_notify_message
  after insert on public.management_messages
  for each row execute function public.notify_new_conversation_message();

-- request thread messages: same bridge, link to the request detail page
create or replace function public.notify_request_message()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_request record;
declare v_from_mgmt boolean;
declare v_staff record;
begin
  if new.is_internal then
    return new;
  end if;

  select id, user_id, assigned_to, title
    into v_request
    from public.requests
   where id = new.request_id;
  if not found then
    return new;
  end if;

  v_from_mgmt := exists (
    select 1 from public.profiles p
     where p.id = new.sender_id and p.role in ('management','admin')
  );

  if v_from_mgmt then
    perform public.notify_user(
      v_request.user_id, 'new_message',
      'Management replied to your request',
      left(nullif(btrim(new.body), ''), 400),
      '/dashboard/requests/' || v_request.id,
      null,
      'new_management_message',
      jsonb_build_object('email_subject', 'Management replied to your request')
    );
  else
    for v_staff in
      select p.id from public.profiles p
       where p.role in ('management','admin')
         and p.status = 'active'
         and (v_request.assigned_to is null or p.id = v_request.assigned_to)
    loop
      perform public.notify_user(
        v_staff.id, 'new_message',
        'A member replied to a request',
        left(nullif(btrim(new.body), ''), 400),
        '/management/requests/' || v_request.id,
        'staff-req-msg:' || new.id || ':' || v_staff.id
      );
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_request_message on public.request_messages;
create trigger trg_notify_request_message
  after insert on public.request_messages
  for each row execute function public.notify_request_message();

-- request messages need a read receipt (mirrors migration 8 for conversations)
alter table public.request_messages
  add column if not exists read_at timestamptz;
revoke update on table public.request_messages from anon, authenticated;
grant update (read_at) on table public.request_messages to authenticated;

drop policy if exists "request messages mark read" on public.request_messages;
create policy "request messages mark read" on public.request_messages
  for update to authenticated
  using (
    (
      (select public.is_management())
      or exists (
        select 1 from public.requests r
         where r.id = request_id and r.user_id = (select auth.uid())
      )
    )
    and sender_id is distinct from (select auth.uid())
  );

-- management uploaded a document for a member → tell the member
create or replace function public.notify_document_uploaded()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_uploader uuid := coalesce(new.uploaded_by, (select auth.uid()));
begin
  if new.owner_user_id is null
     or v_uploader is null
     or new.owner_user_id = v_uploader
     or new.archived_at is not null then
    return new;
  end if;
  if not exists (
    select 1 from public.profiles p
     where p.id = v_uploader and p.role in ('management','admin')
  ) then
    return new;
  end if;
  perform public.notify_user(
    new.owner_user_id, 'document_uploaded',
    'A document was added for you',
    left(new.title, 200) || ' is now available in your documents.',
    '/dashboard/documents',
    'doc:' || new.id
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_document on public.documents;
create trigger trg_notify_document
  after insert on public.documents
  for each row execute function public.notify_document_uploaded();

-- ------------------------------------------------------------
-- 10. Business events retyped to the spec notification types
--     (same titles/bodies as before so existing behaviour is preserved)
-- ------------------------------------------------------------
drop trigger if exists trg_notify_membership_offer on public.membership_offers;
drop function if exists public.notify_membership_offer();
create function public.notify_membership_offer()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status = 'sent' and old.status = 'draft' then
    perform public.notify_user(
      new.user_id, 'membership_offer',
      'Management has sent you a membership offer',
      'Review the offer, its benefits and terms. You can accept or decline it yourself.',
      '/dashboard/membership/offers',
      'offer-sent:' || new.id,
      'membership_offer',
      jsonb_build_object('email_subject', 'A membership offer is waiting for you')
    );
  end if;
  return new;
end;
$$;
create trigger trg_notify_membership_offer
  after update of status on public.membership_offers
  for each row execute function public.notify_membership_offer();

-- member accepted the offer → tell management
create or replace function public.notify_offer_accepted()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_staff record;
begin
  if new.status = 'accepted' and old.status not in ('accepted','cancelled') then
    for v_staff in
      select id from public.profiles
       where role in ('management','admin') and status = 'active'
    loop
      perform public.notify_user(
        v_staff.id, 'membership_accepted',
        'A membership offer was accepted',
        'The member accepted the offer. Verify the payment to move the membership forward.',
        '/management/memberships',
        'offer-acc:' || new.id
      );
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_notify_offer_accepted on public.membership_offers;
create trigger trg_notify_offer_accepted
  after update of status on public.membership_offers
  for each row execute function public.notify_offer_accepted();

drop trigger if exists trg_apply_membership_payment on public.membership_payments;
drop function if exists public.apply_membership_payment();
create function public.apply_membership_payment()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  if new.status = 'paid' and old.status is distinct from 'paid' then
    update public.memberships m
       set status = 'verification'
     where m.id = new.membership_id and m.status = 'pending';
    perform public.notify_user(
      new.user_id, 'payment_received',
      'Payment received',
      'Management is verifying your payment. Your membership will be activated after confirmation.',
      '/dashboard/membership',
      'mempay:' || new.id,
      'payment_confirmation',
      jsonb_build_object(
        'email_subject', 'We received your payment',
        'amount', round(new.amount_cents / 100.0, 2),
        'currency', upper(new.currency)
      )
    );
  end if;
  return new;
end;
$$;
create trigger trg_apply_membership_payment
  before update of status on public.membership_payments
  for each row execute function public.apply_membership_payment();

drop trigger if exists trg_apply_experience_payment on public.experience_payments;
drop function if exists public.apply_experience_payment();
create function public.apply_experience_payment()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  if new.status = 'paid' and old.status is distinct from 'paid' then
    perform public.notify_user(
      new.user_id, 'payment_received',
      'Payment received',
      'Management is verifying your payment and will confirm your experience next.',
      '/dashboard/experiences/' || new.request_id,
      'exppay:' || new.id,
      'payment_confirmation',
      jsonb_build_object(
        'email_subject', 'We received your payment',
        'amount', round(new.amount_cents / 100.0, 2),
        'currency', upper(new.currency)
      )
    );
  end if;
  return new;
end;
$$;
create trigger trg_apply_experience_payment
  before update of status on public.experience_payments
  for each row execute function public.apply_experience_payment();

drop trigger if exists trg_apply_proposal_response on public.experience_proposals;
drop function if exists public.apply_proposal_response();
create function public.apply_proposal_response()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_request record;
begin
  select id, user_id, status into v_request
    from public.requests where id = new.request_id;

  if new.status = 'sent' and old.status = 'draft' then
    update public.requests
       set status = 'proposal'
     where id = new.request_id
       and status in ('submitted','in_review','information_requested');
    perform public.notify_user(
      v_request.user_id, 'experience_proposal',
      'Management sent you a proposal',
      'Review the dates, requirements and price, then accept or decline.',
      '/dashboard/experiences/' || new.request_id,
      'proposal-sent:' || new.id,
      'experience_proposal',
      jsonb_build_object('email_subject', 'A proposal is waiting for you')
    );
  end if;

  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    update public.requests
       set status = 'payment_required'
     where id = new.request_id and status = 'proposal';
    if new.amount_cents is not null and new.amount_cents > 0
       and not exists (
         select 1 from public.experience_payments p where p.proposal_id = new.id
       ) then
      insert into public.experience_payments (request_id, proposal_id, user_id, amount_cents, currency, status)
      values (new.request_id, new.id, v_request.user_id, new.amount_cents, new.currency, 'pending');
      perform public.notify_user(
        v_request.user_id, 'payment_requested',
        'Payment required for your experience',
        'Management will confirm the payment method. Your experience is confirmed after payment is verified.',
        '/dashboard/experiences/' || new.request_id,
        'proposal-pay:' || new.id,
        'payment_request',
        jsonb_build_object(
          'email_subject', 'A payment is requested for your experience',
          'amount', round(new.amount_cents / 100.0, 2),
          'currency', upper(new.currency)
        )
      );
    end if;
  end if;

  if new.status = 'declined' and old.status is distinct from 'declined' then
    update public.requests
       set status = 'cancelled'
     where id = new.request_id and status = 'proposal';
  end if;
  return new;
end;
$$;
create trigger trg_apply_proposal_response
  after update of status on public.experience_proposals
  for each row execute function public.apply_proposal_response();

-- membership activated (fires on the status change itself; the RPC's legacy
-- notify with the same title is collapsed by the 10-minute window)
create or replace function public.notify_membership_activated()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status = 'active' and old.status is distinct from 'active' then
    perform public.notify_user(
      new.user_id, 'membership_activated',
      'Your membership is active',
      'Your membership card has been issued and is ready to view.',
      '/dashboard/membership/card',
      'member-active:' || new.id,
      'membership_activation',
      jsonb_build_object('email_subject', 'Your membership is active')
    );
  end if;
  return new;
end;
$$;
drop trigger if exists trg_notify_membership_activated on public.memberships;
create trigger trg_notify_membership_activated
  after update of status on public.memberships
  for each row execute function public.notify_membership_activated();

-- experience scheduled / cancelled (covers RPC and direct management writes)
create or replace function public.notify_schedule_created()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_user uuid;
begin
  select r.user_id into v_user
    from public.requests r where r.id = new.request_id;
  if v_user is null then
    return new;
  end if;
  perform public.notify_user(
    v_user, 'experience_scheduled',
    'Your experience is scheduled',
    'The date, time and meeting details are now visible in your experiences.',
    '/dashboard/experiences/' || new.request_id,
    'schedule:' || new.id
  );
  return new;
end;
$$;
drop trigger if exists trg_notify_schedule_created on public.experience_schedules;
create trigger trg_notify_schedule_created
  after insert on public.experience_schedules
  for each row execute function public.notify_schedule_created();

create or replace function public.notify_schedule_cancelled()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_user uuid;
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    select r.user_id into v_user
      from public.requests r where r.id = new.request_id;
    if v_user is not null then
      perform public.notify_user(
        v_user, 'experience_cancelled',
        'Your experience was cancelled',
        'This date is no longer scheduled. Management will follow up with next steps.',
        '/dashboard/experiences/' || new.request_id,
        'sched-cancel:' || new.id
      );
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_notify_schedule_cancelled on public.experience_schedules;
create trigger trg_notify_schedule_cancelled
  after update of status on public.experience_schedules
  for each row execute function public.notify_schedule_cancelled();

-- full request lifecycle notifications
drop trigger if exists trg_notify_request_status on public.requests;
drop function if exists public.notify_request_status();
create function public.notify_request_status()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'information_requested' then
      perform public.notify_user(
        new.user_id, 'information_required',
        'Management needs more information',
        'Your request needs a little more detail before it can move forward.',
        '/dashboard/requests/' || new.id,
        'req-info:' || new.id);
    elsif new.status = 'in_review' then
      perform public.notify_user(
        new.user_id, 'request_update',
        'Your request is under review',
        'Management is reviewing the details you sent.',
        '/dashboard/requests/' || new.id,
        'req-review:' || new.id,
        'request_update',
        jsonb_build_object('email_subject', 'Your request is under review'));
    elsif new.status = 'approved' then
      perform public.notify_user(
        new.user_id, 'request_update',
        'Your request has been approved',
        'Management has approved your request and will be in touch with next steps.',
        '/dashboard/requests/' || new.id,
        'req-approved:' || new.id,
        'request_update',
        jsonb_build_object('email_subject', 'Your request has been approved'));
    elsif new.status = 'confirmed' then
      perform public.notify_user(
        new.user_id, 'experience_confirmed',
        'Your experience is confirmed',
        'Management has confirmed your experience. Scheduling details will follow.',
        '/dashboard/experiences/' || new.id,
        'req-confirmed:' || new.id,
        'experience_confirmation',
        jsonb_build_object('email_subject', 'Your experience is confirmed'));
    elsif new.status = 'completed' then
      perform public.notify_user(
        new.user_id, 'request_update',
        'Your experience is completed',
        'This experience has been marked complete. Thank you.',
        '/dashboard/experiences/' || new.id,
        'req-completed:' || new.id,
        'request_update',
        jsonb_build_object('email_subject', 'Your experience is completed'));
    elsif new.status = 'declined' and old.status not in ('declined','cancelled') then
      perform public.notify_user(
        new.user_id, 'request_update',
        'Management could not proceed',
        'Management has declined this request. You are welcome to send a new one.',
        '/dashboard/experiences/' || new.id,
        'req-declined:' || new.id,
        'request_update',
        jsonb_build_object('email_subject', 'Management could not proceed'));
    elsif new.status in ('cancelled','closed') and old.status not in ('cancelled','closed') then
      perform public.notify_user(
        new.user_id, 'request_update',
        'Your request has been closed',
        'This request is now closed. You are welcome to send a new one.',
        '/dashboard/requests/' || new.id,
        'req-closed:' || new.id);
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_notify_request_status
  after update of status on public.requests
  for each row execute function public.notify_request_status();

-- ------------------------------------------------------------
-- 11. Reminders & background jobs (pg_cron every 15 min / every minute)
--     Every send carries a dedupe key → never a duplicate reminder.
-- ------------------------------------------------------------
create or replace function public.run_reminders()
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare v_n integer := 0;
declare r record;
begin
  -- appointment reminders (~24h out)
  begin
    for r in
      select a.id, a.user_id, a.title, a.starts_at, a.timezone
        from public.appointments a
       where a.status in ('scheduled','confirmed')
         and a.starts_at > now() + interval '20 hours'
         and a.starts_at < now() + interval '28 hours'
    loop
      if public.notify_user(
        r.user_id, 'system',
        'Your appointment is coming up',
        r.title || ' starts ' || to_char(r.starts_at at time zone 'UTC',
                                          'Dy DD Mon YYYY, HH24:MI') || ' UTC',
        '/dashboard/experiences',
        'appt-rem:' || r.id,
        'appointment_reminder',
        jsonb_build_object(
          'email_subject', 'Your appointment is coming up',
          'appointment_title', r.title,
          'starts_at', r.starts_at,
          'timezone', coalesce(r.timezone, 'UTC'))
      ) is not null then
        v_n := v_n + 1;
      end if;
    end loop;
  exception when others then
    raise notice 'appointment reminders failed: %', sqlerrm;
  end;

  -- proposal expiration
  begin
    for r in
      with expired as (
        update public.experience_proposals p
           set status = 'expired'
         where p.status in ('sent','viewed')
           and p.expires_at is not null
           and p.expires_at < now()
        returning p.id, p.request_id
      )
      select e.id, e.request_id, req.user_id
        from expired e
        join public.requests req on req.id = e.request_id
    loop
      if public.notify_user(
        r.user_id, 'experience_proposal',
        'Your proposal has expired',
        'This proposal is no longer available. Management can send a new one on request.',
        '/dashboard/experiences/' || r.request_id,
        'proposal-exp:' || r.id
      ) is not null then
        v_n := v_n + 1;
      end if;
    end loop;
  exception when others then
    raise notice 'proposal expiration failed: %', sqlerrm;
  end;

  -- membership offer expiration
  begin
    for r in
      with expired as (
        update public.membership_offers o
           set status = 'expired'
         where o.status in ('draft','sent','viewed')
           and o.expires_at is not null
           and o.expires_at < now()
        returning o.id, o.user_id
      )
      select * from expired
    loop
      if public.notify_user(
        r.user_id, 'membership_offer',
        'Your membership offer has expired',
        'This offer is no longer available. Management can issue a new one on request.',
        '/dashboard/membership/offers',
        'offer-exp:' || r.id
      ) is not null then
        v_n := v_n + 1;
      end if;
    end loop;
  exception when others then
    raise notice 'offer expiration failed: %', sqlerrm;
  end;

  -- membership expiration: end + advance reminder
  begin
    for r in
      with ended as (
        update public.memberships m
           set status = 'expired'
         where m.status = 'active'
           and m.expiration_date is not null
           and m.expiration_date < now()
        returning m.id, m.user_id
      )
      select * from ended
    loop
      if public.notify_user(
        r.user_id, 'system',
        'Your membership has expired',
        'Your membership period has ended. Management can renew it for you.',
        '/dashboard/membership',
        'member-exp:' || r.id
      ) is not null then
        v_n := v_n + 1;
      end if;
    end loop;

    for r in
      select m.id, m.user_id from public.memberships m
       where m.status = 'active'
         and m.expiration_date is not null
         and m.expiration_date between now() and now() + interval '7 days'
    loop
      if public.notify_user(
        r.user_id, 'system',
        'Your membership expires soon',
        'Your membership expires within the next 7 days. Management can renew it for you.',
        '/dashboard/membership',
        'member-exp-warn:' || r.id,
        'membership_activation',
        jsonb_build_object('email_subject', 'Your membership expires soon')
      ) is not null then
        v_n := v_n + 1;
      end if;
    end loop;
  exception when others then
    raise notice 'membership expiration failed: %', sqlerrm;
  end;

  -- unread message reminders (one per conversation per day, both directions)
  begin
    for r in
      select distinct c.id as conv, c.user_id as target
        from public.management_conversations c
        join public.management_messages m on m.conversation_id = c.id
       where c.status = 'open'
         and m.read_at is null
         and m.sender_id is not null
         and m.sender_id <> c.user_id
         and m.created_at between now() - interval '25 hours'
                              and now() - interval '20 hours'
    loop
      if public.notify_user(
        r.target, 'new_message',
        'You have an unread message',
        'Management is waiting for you to read their latest message.',
        '/dashboard/messages/' || r.conv,
        'unread-fan:' || r.conv || ':' || to_char(now(), 'YYYY-MM-DD')
      ) is not null then
        v_n := v_n + 1;
      end if;
    end loop;

    for r in
      select distinct c.id as conv, c.assigned_to as target
        from public.management_conversations c
        join public.management_messages m on m.conversation_id = c.id
       where c.status = 'open'
         and c.assigned_to is not null
         and m.read_at is null
         and m.sender_id is not null
         and m.sender_id <> c.assigned_to
         and m.created_at between now() - interval '25 hours'
                              and now() - interval '20 hours'
    loop
      if public.notify_user(
        r.target, 'new_message',
        'A member is waiting for a reply',
        'An open conversation has an unread message from a member.',
        '/management/messages/' || r.conv,
        'unread-staff:' || r.conv || ':' || to_char(now(), 'YYYY-MM-DD')
      ) is not null then
        v_n := v_n + 1;
      end if;
    end loop;
  exception when others then
    raise notice 'unread message reminders failed: %', sqlerrm;
  end;

  -- pending request reminders: member weekly, assigned management daily
  begin
    for r in
      select rq.id, rq.user_id from public.requests rq
       where rq.status in ('in_review','information_requested')
         and rq.created_at < now() - interval '3 days'
         and rq.updated_at < now() - interval '1 day'
    loop
      if public.notify_user(
        r.user_id, 'request_update',
        'Your request is still with management',
        'Your request has not been forgotten — management is working through it.',
        '/dashboard/requests/' || r.id,
        'req-pending:' || r.id || ':' || to_char(now(), 'IYYY-IW')
      ) is not null then
        v_n := v_n + 1;
      end if;
    end loop;

    for r in
      select rq.id, rq.assigned_to as target from public.requests rq
       where rq.status in ('submitted','in_review','information_requested')
         and rq.assigned_to is not null
         and rq.updated_at < now() - interval '1 day'
    loop
      if public.notify_user(
        r.target, 'system',
        'A request is waiting for action',
        'An assigned request has had no update for more than a day.',
        '/management/requests/' || r.id,
        'req-mgmt:' || r.id || ':' || to_char(now(), 'YYYY-MM-DD')
      ) is not null then
        v_n := v_n + 1;
      end if;
    end loop;
  exception when others then
    raise notice 'pending request reminders failed: %', sqlerrm;
  end;

  return v_n;
end;
$$;
revoke execute on function public.run_reminders()
  from public, anon, authenticated;
grant execute on function public.run_reminders()
  to service_role;

select cron.unschedule(jobid) from cron.job
 where jobname in ('gma-reminders','gma-email-queue','gma-rate-cleanup');
select cron.schedule('gma-reminders', '*/15 * * * *',
  $$select public.run_reminders()$$);
select cron.schedule('gma-email-queue', '* * * * *',
  $$select public.retry_email_queue()$$);

-- ------------------------------------------------------------
-- 12. Realtime: every table the UI subscribes to
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'request_messages','management_conversations','documents',
    'experience_schedules','management_notes','tasks'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------
-- 13. client_error_logs: technical details stay server-side
-- ------------------------------------------------------------
create table if not exists public.client_error_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  context    text not null,
  message    text not null,
  created_at timestamptz not null default now()
);
create index if not exists client_error_logs_created_idx
  on public.client_error_logs (created_at desc);
alter table public.client_error_logs enable row level security;

revoke all on table public.client_error_logs from anon;
revoke update, delete on table public.client_error_logs from authenticated;
revoke update, delete on table public.client_error_logs from service_role;

drop policy if exists "client errors insert" on public.client_error_logs;
create policy "client errors insert" on public.client_error_logs
  for insert to authenticated
  with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists "client errors read" on public.client_error_logs;
create policy "client errors read" on public.client_error_logs
  for select to authenticated using ((select public.is_admin()));

-- ------------------------------------------------------------
-- 14. Email switches (management edits this row in Settings)
-- ------------------------------------------------------------
insert into public.site_settings (key, value, is_public)
values (
  'email_notifications',
  '{
    "verification": true,
    "welcome": true,
    "password_reset": true,
    "new_management_message": true,
    "request_update": true,
    "membership_offer": true,
    "payment_request": true,
    "payment_confirmation": true,
    "membership_activation": true,
    "experience_proposal": true,
    "experience_confirmation": true,
    "appointment_reminder": true
  }'::jsonb,
  false
)
on conflict (key) do nothing;
