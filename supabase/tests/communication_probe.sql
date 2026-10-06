-- ============================================================
-- Gillian Anderson Management - Communication / notification probe
-- ============================================================
-- Transactional (BEGIN . ROLLBACK): exercises the production communication
-- surface - 15-type notification engine, dedupe ledger, preference gates,
-- email queue, rate limits, RLS isolation for request threads and error logs,
-- announcements, reminder idempotency, realtime publication, cron jobs.
--
-- Run: supabase db query --linked --file supabase/tests/communication_probe.sql

begin;

create temporary table probe_results (name text primary key, result text not null);

-- ------------------------------------------------------------
-- Setup: two fans + one management account, a request thread, an appointment
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  uid_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  uid_m uuid := '99999999-9999-4999-8999-999999999999';
  rid   uuid;
  ack   jsonb;
  meta  jsonb := '{"provider":"email","providers":["email"]}';
begin
  ack := jsonb_build_object(
    'ack_version', '1',
    'ack_at', to_char((now() at time zone 'utc') + interval '1 second', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'user_agent', 'probe'
  );

  insert into auth.users (id, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, aud, role,
                          created_at, updated_at)
  values
    (uid_a, 'comms-probe-a@example.test', 'x', now(), meta, ack, 'authenticated', 'authenticated', now(), now()),
    (uid_b, 'comms-probe-b@example.test', 'x', now(), meta, ack, 'authenticated', 'authenticated', now(), now()),
    (uid_m, 'comms-probe-m@example.test', 'x', now(), meta, ack, 'authenticated', 'authenticated', now(), now());

  if (select count(*) from public.profiles where id in (uid_a, uid_b, uid_m)) <> 3 then
    raise exception 'PROBE FAIL: signup did not create all probe profiles';
  end if;

  update public.profiles set role = 'management', status = 'active' where id = uid_m;
  update public.profiles set status = 'active' where id in (uid_a, uid_b);

  insert into public.requests (user_id, type, title, description, participants,
                               contact_method, preferred_date)
  values (uid_a, 'personal_experience', 'Probe request',
          'Communication probe request.', 'just me', 'email', '2026-12-01')
  returning id into rid;

  insert into public.request_messages (request_id, sender_id, body, is_internal)
  values
    (rid, uid_m, 'Member-visible probe reply', false),
    (rid, uid_m, 'Internal probe note - fan must never see this', true),
    (rid, uid_a, 'Fan probe reply', false);

  insert into probe_results values ('setup: probe accounts, request thread', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 1. Notification type constraint: 15 spec types + 5 legacy accepted,
--    unknown type rejected
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  t text;
  n int;
  types text[] := array[
    'new_message','request_update','information_required','membership_offer',
    'membership_accepted','payment_requested','payment_received',
    'membership_activated','experience_proposal','experience_confirmed',
    'experience_scheduled','experience_cancelled','document_uploaded',
    'management_announcement','system',
    'info','request','membership','experience','account'
  ];
begin
  foreach t in array types loop
    insert into public.notifications (user_id, title, body, type, link)
    values (uid_a, 'Type probe ' || t, 'body', t, '/dashboard');
  end loop;

  select count(*) into n from public.notifications
   where user_id = uid_a and title like 'Type probe %';
  if n <> 20 then
    raise exception 'PROBE FAIL: % of 20 notification types accepted', n;
  end if;

  begin
    insert into public.notifications (user_id, title, body, type, link)
    values (uid_a, 'Bad type probe', 'body', 'not_a_type', '/dashboard');
    raise exception 'PROBE FAIL: invalid notification type accepted';
  exception
    when raise_exception then
      if sqlerrm like 'PROBE FAIL%' then raise; end if;
    when check_violation then
      null;
  end;

  insert into probe_results values ('notification types: spec + legacy accepted, invalid rejected', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 2. notify_user dedupe: explicit key, 10-minute title window,
--    new_message exempt from the window, distinct keys pass
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  n int;
begin
  perform public.notify_user(uid_a, 'request_update', 'Dedupe key probe', 'b', '/l', 'probe-key-1');
  perform public.notify_user(uid_a, 'request_update', 'Dedupe key probe other title', 'b', '/l', 'probe-key-1');
  select count(*) into n from public.notifications
   where user_id = uid_a and title like 'Dedupe key probe%';
  if n <> 1 then
    raise exception 'PROBE FAIL: dedupe key left % rows (expected 1)', n;
  end if;

  perform public.notify_user(uid_a, 'request_update', 'Window probe title', 'b', '/l');
  perform public.notify_user(uid_a, 'request_update', 'Window probe title', 'b', '/l');
  select count(*) into n from public.notifications
   where user_id = uid_a and title = 'Window probe title';
  if n <> 1 then
    raise exception 'PROBE FAIL: title window left % rows (expected 1)', n;
  end if;

  perform public.notify_user(uid_a, 'new_message', 'Message window probe', 'b', '/l');
  perform public.notify_user(uid_a, 'new_message', 'Message window probe', 'b', '/l');
  select count(*) into n from public.notifications
   where user_id = uid_a and title = 'Message window probe';
  if n <> 2 then
    raise exception 'PROBE FAIL: new_message exemption left % rows (expected 2)', n;
  end if;

  perform public.notify_user(uid_a, 'request_update', 'Two keys probe', 'b', '/l', 'probe-k-a');
  perform public.notify_user(uid_a, 'request_update', 'Two keys probe', 'b', '/l', 'probe-k-b');
  select count(*) into n from public.notifications
   where user_id = uid_a and title = 'Two keys probe';
  if n <> 2 then
    raise exception 'PROBE FAIL: distinct keys left % rows (expected 2)', n;
  end if;

  insert into probe_results values ('notify_user dedupe: key, window, exemptions', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 3. Email queue: template call writes exactly one queued email_logs row and
--    links it to the delivery ledger; duplicate key never queues twice
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  n int;
  linked boolean;
begin
  perform public.notify_user(uid_a, 'request_update', 'Email queue probe', 'b', '/dashboard',
                             'probe-email-1', 'request_update',
                             jsonb_build_object('email_subject', 'Email queue probe'));
  select count(*) into n from public.email_logs
   where dedupe_key = 'probe-email-1' and status = 'queued' and template = 'request_update';
  if n <> 1 then
    raise exception 'PROBE FAIL: email queue wrote % rows (expected 1)', n;
  end if;

  select (email_log_id is not null) into linked
    from public.notification_deliveries
   where user_id = uid_a and dedupe_key = 'probe-email-1';
  if coalesce(linked, false) is not true then
    raise exception 'PROBE FAIL: delivery ledger is not linked to the email log';
  end if;

  perform public.notify_user(uid_a, 'request_update', 'Email queue probe duplicate', 'b', '/dashboard',
                             'probe-email-1', 'request_update');
  select count(*) into n from public.email_logs where dedupe_key = 'probe-email-1';
  select count(*) + n into n from public.notifications where title like 'Email queue probe%';
  if n <> 2 then
    raise exception 'PROBE FAIL: duplicate dedupe produced % rows (expected 1 email + 1 notification)', n;
  end if;

  insert into probe_results values ('email queue: one queued row per dedupe key', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 4. Preference gates: messages off blocks new_message, requests off blocks
--    request_update, management_announcement bypasses preference gates
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  n int;
begin
  update public.profiles set notify_messages = false where id = uid_a;
  perform public.notify_user(uid_a, 'new_message', 'Pref gated message', 'b', '/l');
  select count(*) into n from public.notifications
   where user_id = uid_a and title = 'Pref gated message';
  if n <> 0 then
    raise exception 'PROBE FAIL: message notification created despite notify_messages=false';
  end if;

  update public.profiles set notify_requests = false where id = uid_a;
  perform public.notify_user(uid_a, 'request_update', 'Pref gated request', 'b', '/l');
  select count(*) into n from public.notifications
   where user_id = uid_a and title = 'Pref gated request';
  if n <> 0 then
    raise exception 'PROBE FAIL: request notification created despite notify_requests=false';
  end if;

  perform public.notify_user(uid_a, 'management_announcement', 'Pref bypass probe', 'b', '/l');
  select count(*) into n from public.notifications
   where user_id = uid_a and title = 'Pref bypass probe';
  if n <> 1 then
    raise exception 'PROBE FAIL: announcement bypassed preference gates (% rows)', n;
  end if;

  update public.profiles
     set notify_messages = true, notify_requests = true, notify_experiences = true,
         notify_membership = true
   where id = uid_a;

  insert into probe_results values ('preference gates: messages, requests, announcement bypass', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 5. Rate limiter: fixed window counter allows exactly p_max, resets after
--    the window; service tables are invisible to authenticated clients
-- ------------------------------------------------------------
do $$
declare
  ok boolean;
  i int;
  granted_priv boolean;
begin
  for i in 1..3 loop
    perform public.rate_limit('probe_bucket', 'probe-key', 3, 60);
  end loop;
  ok := public.rate_limit('probe_bucket', 'probe-key', 3, 60);
  if ok then
    raise exception 'PROBE FAIL: rate limiter allowed the 4th call at max 3';
  end if;

  update public.rate_limits
     set window_start = now() - interval '2 minutes'
   where bucket = 'probe_bucket' and key = 'probe-key';
  ok := public.rate_limit('probe_bucket', 'probe-key', 3, 60);
  if not ok then
    raise exception 'PROBE FAIL: rate limiter did not reset after its window';
  end if;

  if has_table_privilege('authenticated', 'public.rate_limits', 'select')
     or has_table_privilege('authenticated', 'public.email_logs', 'select') then
    raise exception 'PROBE FAIL: authenticated clients can read rate_limits/email_logs';
  end if;

  if has_function_privilege('authenticated',
       'public.notify_user(uuid,text,text,text,text,text,text,jsonb)', 'execute')
     or has_function_privilege('authenticated', 'public.run_reminders()', 'execute')
     or has_function_privilege('authenticated', 'public.rate_limit(text,text,integer,integer)', 'execute') then
    raise exception 'PROBE FAIL: privileged functions are executable by authenticated clients';
  end if;

  insert into probe_results values ('rate limiter + privileged function grants', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 6. Request-create rate trigger: the 11th request inside an hour is refused
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  claims text;
  i int;
  raised boolean := false;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);

  for i in 1..9 loop
    insert into public.requests (user_id, type, title, description, participants,
                                 contact_method, preferred_date)
    values (uid_a, 'personal_experience', 'Rate probe ' || i,
            'Rate limit probe.', 'just me', 'email', '2026-12-01');
  end loop;

  begin
    insert into public.requests (user_id, type, title, description, participants,
                                 contact_method, preferred_date)
    values (uid_a, 'personal_experience', 'Rate probe over', 'Rate limit probe.',
            'just me', 'email', '2026-12-01');
  exception
    when others then
      if sqlerrm like '%rate limit%' then
        raised := true;
      else
        raise;
      end if;
  end;
  if not raised then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: 11th request inside the window was not rate limited';
  end if;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  insert into probe_results values ('request-create rate trigger: 11th refused', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 7. Request thread RLS: fan sees non-internal only on own request,
--    can mark incoming read, cannot mark their own, outsider sees nothing,
--    internal notes never become fan notifications
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  uid_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  rid   uuid;
  own_id uuid;
  n int;
begin
  select id into rid from public.requests where user_id = uid_a and title = 'Probe request';

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);

  select count(*) into n from public.request_messages where request_id = rid;
  if n <> 2 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: fan sees % thread rows (expected 2, internal hidden)', n;
  end if;

  select id into own_id from public.request_messages
   where request_id = rid and sender_id = uid_a;

  update public.request_messages
     set read_at = now()
   where request_id = rid and sender_id <> uid_a;
  get diagnostics n = row_count;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: fan marked % incoming messages read (expected 1)', n;
  end if;

  update public.request_messages set read_at = now() where id = own_id;
  get diagnostics n = row_count;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: fan marked their own message read (% rows)', n;
  end if;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.request_messages where request_id = rid;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: outsider sees % thread rows', n;
  end if;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);

  if exists (
    select 1 from public.notifications
     where user_id = uid_a and body like '%Internal probe note%'
  ) then
    raise exception 'PROBE FAIL: internal note leaked into fan notifications';
  end if;

  if exists (
    select 1 from public.request_messages
     where request_id = rid and sender_id = uid_a and read_at is not null
  ) then
    raise exception 'PROBE FAIL: fan own-message read receipt was written';
  end if;

  insert into probe_results values ('request thread RLS: isolation, receipts, internal secrecy', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 8. Notification RLS: one fan never sees another fan's notifications
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  uid_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  n int;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_b, 'role', 'authenticated')::text, true);

  select count(*) into n from public.notifications where user_id = uid_a;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user B sees % of user A notifications', n;
  end if;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  insert into probe_results values ('notification RLS: cross-user isolation', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 9. client_error_logs: fans may log their own errors, may not forge another
--    user, may not update or delete rows
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  uid_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  n int;
  rejected boolean := false;
  blocked boolean := false;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);

  insert into public.client_error_logs (user_id, context, message)
  values (uid_a, 'probe', 'probe error detail');

  begin
    insert into public.client_error_logs (user_id, context, message)
    values (uid_b, 'probe', 'forged error detail');
  exception
    when others then
      rejected := true;
  end;
  if not rejected then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A logged an error attributed to user B';
  end if;

  begin
    delete from public.client_error_logs where context = 'probe';
  exception
    when others then
      blocked := true;
  end;
  if not blocked then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: authenticated client can delete client_error_logs rows';
  end if;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);

  select count(*) into n from public.client_error_logs
   where context = 'probe' and message = 'forged error detail';
  if n <> 0 then
    raise exception 'PROBE FAIL: forged error log row persisted';
  end if;

  insert into probe_results values ('client_error_logs: own insert only, append-only', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 10. Announcements: management broadcast reaches every active member once,
--     a fan cannot send one
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  uid_m uuid := '99999999-9999-4999-8999-999999999999';
  v_n integer;
  n int;
  blocked boolean := false;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);

  select public.send_announcement('Probe announcement title', 'Probe announcement body',
                                  '/dashboard') into v_n;
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);

  if v_n < 2 then
    raise exception 'PROBE FAIL: announcement reached only % members', v_n;
  end if;

  select count(*) into n from public.notifications
   where user_id = uid_a and title = 'Probe announcement title';
  if n <> 1 then
    raise exception 'PROBE FAIL: fan received % announcement rows (expected 1)', n;
  end if;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  begin
    perform public.send_announcement('Fan should not send', 'nope', null);
  exception
    when others then
      if sqlerrm like '%only management%' then
        blocked := true;
      else
        raise;
      end if;
  end;
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);

  if not blocked then
    raise exception 'PROBE FAIL: a fan was allowed to send an announcement';
  end if;

  insert into probe_results values ('announcements: management broadcast, fan blocked', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 11. Reminders: the same reminder never notifies or queues email twice
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  appt_id uuid;
  n int;
  e int;
begin
  insert into public.appointments (user_id, title, starts_at, ends_at, status, timezone)
  values (uid_a, 'Probe appointment', now() + interval '24 hours',
          now() + interval '25 hours', 'scheduled', 'UTC')
  returning id into appt_id;

  perform public.run_reminders();

  select count(*) into n from public.notifications
   where user_id = uid_a and title = 'Your appointment is coming up';
  if n <> 1 then
    raise exception 'PROBE FAIL: first reminder run produced % fan notifications (expected 1)', n;
  end if;

  select count(*) into e from public.email_logs
   where dedupe_key = 'appt-rem:' || appt_id;
  if e <> 1 then
    raise exception 'PROBE FAIL: first reminder run queued % emails (expected 1)', e;
  end if;

  perform public.run_reminders();

  select count(*) into n from public.notifications
   where user_id = uid_a and title = 'Your appointment is coming up';
  select count(*) + n into n from public.email_logs where dedupe_key = 'appt-rem:' || appt_id;
  if n <> 2 then
    raise exception 'PROBE FAIL: second reminder run duplicated work (% rows)', n;
  end if;

  insert into probe_results values ('reminders: idempotent across runs', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 12. Realtime publication: every table the UI subscribes to is published
-- ------------------------------------------------------------
do $$
declare
  expected text[] := array[
    'request_messages','management_conversations','documents',
    'experience_schedules','management_notes','tasks',
    'appointments','experience_payments','experience_proposals',
    'management_messages','membership_cards','membership_offers',
    'membership_payments','memberships','notifications',
    'request_events','requests'
  ];
  n int;
begin
  select count(*) into n
    from pg_publication_tables
   where pubname = 'supabase_realtime'
     and schemaname = 'public'
     and tablename = any (expected);
  if n <> array_length(expected, 1) then
    raise exception 'PROBE FAIL: % of % published tables present in supabase_realtime',
      n, array_length(expected, 1);
  end if;
  insert into probe_results values ('realtime publication covers all subscribed tables', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 13. Background jobs: reminders and email queue are scheduled on pg_cron
-- ------------------------------------------------------------
do $$
declare
  n int;
begin
  select count(*) into n from cron.job
   where jobname in ('gma-reminders', 'gma-email-queue') and active;
  if n <> 2 then
    raise exception 'PROBE FAIL: % of 2 cron jobs active', n;
  end if;
  insert into probe_results values ('cron jobs: reminders + email queue active', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 14. Trigger coverage: rate + notify triggers from migration 11 exist
-- ------------------------------------------------------------
do $$
declare
  expected text[] := array[
    'trg_rate_messages','trg_rate_request_messages','trg_rate_requests',
    'trg_rate_documents','trg_notify_message','trg_notify_request_message',
    'trg_notify_document','trg_notify_membership_offer','trg_notify_offer_accepted',
    'trg_apply_membership_payment','trg_apply_experience_payment',
    'trg_apply_proposal_response','trg_notify_membership_activated',
    'trg_notify_schedule_created','trg_notify_schedule_cancelled',
    'trg_notify_request_status'
  ];
  n int;
begin
  select count(*) into n from pg_trigger
   where not tgisinternal and tgname = any (expected);
  if n <> array_length(expected, 1) then
    raise exception 'PROBE FAIL: % of % rate/notify triggers present',
      n, array_length(expected, 1);
  end if;
  insert into probe_results values ('triggers: rate + notify coverage present', 'PASS');
end $$;

-- ------------------------------------------------------------
-- 15. One active conversation per member: stale tabs cannot duplicate
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  first_id uuid;
begin
  insert into public.management_conversations (user_id, subject, status)
  values (uid_a, 'Probe conversation', 'open')
  returning id into first_id;

  begin
    insert into public.management_conversations (user_id, subject, status)
    values (uid_a, 'Second active probe conversation', 'open');
    raise exception 'PROBE FAIL: a second active conversation was accepted';
  exception
    when unique_violation then null;
  end;

  update public.management_conversations
     set status = 'closed' where id = first_id;

  insert into public.management_conversations (user_id, subject, status)
  values (uid_a, 'Follow-up probe conversation', 'open');

  insert into probe_results values ('one active conversation per member: duplicate refused', 'PASS');
end $$;

-- ------------------------------------------------------------
-- Result
-- ------------------------------------------------------------
select name, result from probe_results order by name;

rollback;
