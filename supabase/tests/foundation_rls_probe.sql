-- ============================================================
-- Gillian Anderson Management · Foundation security probe
-- ============================================================
-- Transactional (BEGIN … ROLLBACK): creates probe accounts, exercises the
-- security boundary as anon / two users / management / admin, records PASS
-- rows, then rolls everything back. Fails loudly with 'PROBE FAIL: …'.
--
-- Run: supabase db query --linked --file supabase/tests/foundation_rls_probe.sql

begin;

create temporary table probe_results (name text primary key, result text not null);

-- ------------------------------------------------------------
-- Setup (trusted path, role = postgres): four probe accounts
-- ------------------------------------------------------------
do $$
declare
  uid_a uuid := '11111111-1111-4111-8111-111111111111';
  uid_b uuid := '22222222-2222-4222-8222-222222222222';
  uid_m uuid := '33333333-3333-4333-8333-333333333333';
  uid_d uuid := '44444444-4444-4444-8444-444444444444';
  ack   jsonb;
  meta  jsonb := '{"provider":"email","providers":["email"]}';
begin
  -- Acceptance time must be after the published_at of version 1.
  ack := jsonb_build_object(
    'ack_version', '1',
    'ack_at', to_char((now() at time zone 'utc') + interval '1 second', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'user_agent', 'probe'
  );
  -- Positive: signup WITH acknowledgement succeeds and creates
  -- profile + acknowledgement + applicant rows via handle_new_user().
  insert into auth.users (id, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, aud, role,
                          created_at, updated_at)
  values
    (uid_a, 'probe-a@example.test', 'x', now(), meta, ack, 'authenticated', 'authenticated', now(), now()),
    (uid_b, 'probe-b@example.test', 'x', now(), meta, ack, 'authenticated', 'authenticated', now(), now()),
    (uid_m, 'probe-m@example.test', 'x', now(), meta, ack, 'authenticated', 'authenticated', now(), now()),
    (uid_d, 'probe-d@example.test', 'x', now(), meta, ack, 'authenticated', 'authenticated', now(), now());

  if (select count(*) from public.profiles where id in (uid_a, uid_b, uid_m, uid_d)) <> 4 then
    raise exception 'PROBE FAIL: handle_new_user did not create all profiles';
  end if;
  if (select count(*) from public.acknowledgements where user_id in (uid_a, uid_b, uid_m, uid_d)) <> 4 then
    raise exception 'PROBE FAIL: acknowledgements were not recorded on signup';
  end if;
  if (select count(*) from public.applicant_profiles where user_id in (uid_a, uid_b, uid_m, uid_d)) <> 4 then
    raise exception 'PROBE FAIL: applicant_profiles were not created on signup';
  end if;
  insert into probe_results values ('signup with acknowledgement', 'PASS');

  -- Negative: signup WITHOUT acknowledgement must be rejected.
  begin
    insert into auth.users (id, email, encrypted_password, raw_app_meta_data,
                            raw_user_meta_data, aud, role, created_at, updated_at)
    values ('55555555-5555-4555-8555-555555555555', 'probe-noack@example.test', 'x',
            meta, '{"name":"no ack"}', 'authenticated', 'authenticated', now(), now());
    raise exception 'PROBE FAIL: account created without acknowledgement';
  exception
    when raise_exception then
      if sqlerrm like 'PROBE FAIL%' then raise; end if;
      if sqlerrm not like '%acknowledgement required%' then
        raise exception 'PROBE FAIL: unexpected error on missing acknowledgement: %', sqlerrm;
      end if;
  end;
  insert into probe_results values ('signup blocked without acknowledgement', 'PASS');

  -- Negative: a *stale/unpublished* acknowledgement version must be rejected.
  begin
    insert into auth.users (id, email, encrypted_password, raw_app_meta_data,
                            raw_user_meta_data, aud, role, created_at, updated_at)
    values ('66666666-6666-4666-8666-666666666666', 'probe-badack@example.test', 'x',
            meta, '{"ack_version":"99","ack_at":"2026-10-04T12:00:00.000Z"}',
            'authenticated', 'authenticated', now(), now());
    raise exception 'PROBE FAIL: account created with unpublished ack version';
  exception
    when raise_exception then
      if sqlerrm like 'PROBE FAIL%' then raise; end if;
      if sqlerrm not like '%not valid or not published%' then
        raise exception 'PROBE FAIL: unexpected error on bad acknowledgement: %', sqlerrm;
      end if;
  end;
  insert into probe_results values ('signup blocked with invalid acknowledgement', 'PASS');

  -- Assign roles through the trusted path (profiles.role writes are guarded).
  update public.profiles set role = 'management', status = 'active' where id = uid_m;
  update public.profiles set role = 'admin',      status = 'active' where id = uid_d;

  -- Seed rows used by the isolation checks below (trusted path).
  insert into public.management_conversations (id, user_id, subject)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', uid_a, 'Probe conversation');
  insert into public.management_messages (conversation_id, sender_id, body, is_internal)
  values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', uid_m, 'internal note', true),
         ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', uid_m, 'visible reply', false);
  insert into public.audit_logs (actor_id, action, entity)
  values (uid_d, 'probe.created', 'probe');
  insert into public.acknowledgement_versions (version, title, content, is_active)
  values (99, 'Unpublished draft', 'draft', false)
  on conflict (version) do nothing;
  insert into storage.objects (bucket_id, name)
  values ('documents', uid_a::text || '/a.txt'),
         ('documents', uid_b::text || '/b.txt');
end $$;

-- ------------------------------------------------------------
-- anon: no access to private data
-- ------------------------------------------------------------
do $$
declare n int;
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '', true);

  begin
    select count(*) into n from public.profiles;
    raise exception 'PROBE FAIL: anon could read profiles';
  exception when insufficient_privilege then null;
  end;
  perform set_config('role', 'anon', true);

  begin
    select count(*) into n from public.acknowledgement_versions;
    if n <> 1 then
      perform set_config('role', 'postgres', true);
      raise exception 'PROBE FAIL: anon sees % ack versions (expected only the active one)', n;
    end if;
  exception when insufficient_privilege then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: anon cannot read the published acknowledgement (%)', sqlerrm;
  end;

  begin
    select count(*) into n from storage.objects;
    if n <> 0 then
      perform set_config('role', 'postgres', true);
      raise exception 'PROBE FAIL: anon sees % storage objects', n;
    end if;
  exception when insufficient_privilege then null;
  end;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  insert into probe_results values ('anon denied on private data', 'PASS');
end $$;

-- ------------------------------------------------------------
-- user isolation: A and B cannot see each other
-- ------------------------------------------------------------
do $$
declare n int; uid_a text := '11111111-1111-4111-8111-111111111111'; uid_b text := '22222222-2222-4222-8222-222222222222';
begin
  -- A: own profile only
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.profiles;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A sees % profiles (expected 1)', n;
  end if;

  -- A cannot read B's profile row
  select count(*) into n from public.profiles where id = uid_b::uuid;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A can read another user''s profile';
  end if;

  -- A cannot grant themselves another role (column-level grant)
  begin
    update public.profiles set role = 'admin' where id = uid_a::uuid;
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A could change own role';
  exception when insufficient_privilege then null;
  end;
  perform set_config('role', 'authenticated', true);

  -- A cannot write audit logs
  begin
    insert into public.audit_logs (action, entity) values ('probe', 'probe');
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A could insert an audit log';
  exception when insufficient_privilege then null;
  end;
  perform set_config('role', 'authenticated', true);

  -- A cannot read audit logs (admin only -> 0 rows, no error)
  select count(*) into n from public.audit_logs;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A can read % audit logs', n;
  end if;

  -- A cannot see management notes
  select count(*) into n from public.management_notes;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A can read % management notes', n;
  end if;

  -- A cannot insert a management note
  begin
    insert into public.management_notes (author_id, body) values (uid_a::uuid, 'sneaky');
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A could insert a management note';
  exception when insufficient_privilege then null;
  end;
  perform set_config('role', 'authenticated', true);

  -- A cannot see anyone else's notifications (own may exist: the seeded
  -- management reply legitimately notifies A through the engine)
  select count(*) into n from public.notifications where user_id <> uid_a::uuid;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A sees % notifications belonging to other users', n;
  end if;

  -- A cannot see internal conversation messages
  select count(*) into n from public.management_messages;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A sees % conversation messages (expected 1 public)', n;
  end if;

  -- A sees only own storage objects
  select count(*) into n from storage.objects;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A sees % storage objects (expected own folder only)', n;
  end if;

  -- A cannot update notification titles (read_at only)
  perform set_config('role', 'postgres', true);
  insert into public.notifications (user_id, title)
  values (uid_a::uuid, 'probe notification');
  perform set_config('role', 'authenticated', true);
  begin
    update public.notifications set title = 'changed' where user_id = uid_a::uuid;
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A could edit a notification title';
  exception when insufficient_privilege then null;
  end;
  perform set_config('role', 'authenticated', true);
  update public.notifications set read_at = now() where user_id = uid_a::uuid;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  insert into probe_results values ('user isolation (profiles, notes, notifications, storage, audit)', 'PASS');
end $$;

-- ------------------------------------------------------------
-- requests: isolation + status protection
-- ------------------------------------------------------------
do $$
declare
  n int; rid uuid;
  uid_a text := '11111111-1111-4111-8111-111111111111';
  uid_b text := '22222222-2222-4222-8222-222222222222';
  uid_m text := '33333333-3333-4333-8333-333333333333';
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  insert into public.requests (user_id, type, title, description)
  values (uid_a::uuid, 'other', 'A request', 'from A')
  returning id into rid;

  -- A sees own request only
  select count(*) into n from public.requests;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A sees % requests (expected 1)', n;
  end if;

  -- A cannot change status (server-side guard)
  begin
    update public.requests set status = 'approved' where id = rid;
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A changed a request status';
  exception when raise_exception then
    if sqlerrm like 'PROBE FAIL%' then raise; end if;
    if sqlerrm not like '%only management can change request status%' then
      perform set_config('role', 'postgres', true);
      raise exception 'PROBE FAIL: unexpected status-change error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  -- B sees nothing of A's
  perform set_config('request.jwt.claims', json_build_object('sub', uid_b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.requests;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user B sees % requests (expected 0)', n;
  end if;

  -- Management sees everything and can change status
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  select count(*) into n from public.requests;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: management sees % requests (expected 1)', n;
  end if;
  update public.requests set status = 'in_review' where id = rid;
  if (select status from public.requests where id = rid) <> 'in_review' then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: management could not change request status';
  end if;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  insert into probe_results values ('requests: isolation + status guard', 'PASS');
end $$;

-- ------------------------------------------------------------
-- applicants / membership applications: workflow fields guarded
-- ------------------------------------------------------------
do $$
declare uid_a text := '11111111-1111-4111-8111-111111111111'; uid_m text := '33333333-3333-4333-8333-333333333333';
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);

  begin
    update public.applicant_profiles set status = 'approved' where user_id = uid_a::uuid;
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A approved their own applicant profile';
  exception when raise_exception then
    if sqlerrm like 'PROBE FAIL%' then raise; end if;
    if sqlerrm not like '%only management can change status%' then
      perform set_config('role', 'postgres', true);
      raise exception 'PROBE FAIL: unexpected applicant status error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  begin
    update public.applicant_profiles set headline = 'Probe: own applicant fields' where user_id = uid_a::uuid;
  exception when others then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A cannot update own applicant profile (%)', sqlerrm;
  end;

  -- Status is submitted by the platform at signup ('new'); users cannot move it themselves.
  begin
    update public.applicant_profiles set status = 'submitted' where user_id = uid_a::uuid;
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: user A changed their own applicant status';
  exception when raise_exception then
    if sqlerrm like 'PROBE FAIL%' then raise; end if;
    if sqlerrm not like '%only management can change status%' then
      perform set_config('role', 'postgres', true);
      raise exception 'PROBE FAIL: unexpected applicant status error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  update public.applicant_profiles set status = 'in_review' where user_id = uid_a::uuid;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  insert into probe_results values ('applicants: workflow fields management-only', 'PASS');
end $$;

-- ------------------------------------------------------------
-- role escalation: admin RPC + self-promotion impossible
-- ------------------------------------------------------------
do $$
declare
  uid_a text := '11111111-1111-4111-8111-111111111111';
  uid_b text := '22222222-2222-4222-8222-222222222222';
  uid_d text := '44444444-4444-4444-8444-444444444444';
  r text;
begin
  -- A (plain user) tries to promote B
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  begin
    perform public.admin_set_user_role(uid_b::uuid, 'admin');
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: non-admin could call admin_set_user_role';
  exception when raise_exception then
    if sqlerrm like 'PROBE FAIL%' then raise; end if;
    if sqlerrm not like '%not authorized%' then
      perform set_config('role', 'postgres', true);
      raise exception 'PROBE FAIL: unexpected RPC error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  -- Admin promotes B → B gains management
  perform set_config('request.jwt.claims', json_build_object('sub', uid_d, 'role', 'authenticated')::text, true);
  perform public.admin_set_user_role(uid_b::uuid, 'management');
  perform set_config('request.jwt.claims', json_build_object('sub', uid_b, 'role', 'authenticated')::text, true);
  if not public.is_management() then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: promoted user is not management';
  end if;

  -- Admin cannot demote themselves
  perform set_config('request.jwt.claims', json_build_object('sub', uid_d, 'role', 'authenticated')::text, true);
  begin
    perform public.admin_set_user_role(uid_d::uuid, 'user');
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: admin could remove own admin role';
  exception when raise_exception then
    if sqlerrm like 'PROBE FAIL%' then raise; end if;
    if sqlerrm not like '%cannot remove your own administrator%' then
      perform set_config('role', 'postgres', true);
      raise exception 'PROBE FAIL: unexpected self-demote error: %', sqlerrm;
    end if;
  end;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  insert into probe_results values ('role escalation blocked; admin RPC works', 'PASS');
end $$;

-- ------------------------------------------------------------
-- admin: audit log readable, management excluded
-- ------------------------------------------------------------
do $$
declare
  n int;
  uid_m text := '33333333-3333-4333-8333-333333333333';
  uid_d text := '44444444-4444-4444-8444-444444444444';
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  select count(*) into n from public.audit_logs;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: management can read % audit logs (admin only)', n;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', uid_d, 'role', 'authenticated')::text, true);
  select count(*) into n from public.audit_logs;
  -- lifecycle triggers may have appended audit rows while this probe ran,
  -- so admin must see at least the seeded row (management must see none).
  if n < 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'PROBE FAIL: admin sees % audit logs (expected >= 1)', n;
  end if;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  insert into probe_results values ('audit log: admin-only', 'PASS');
end $$;

-- ------------------------------------------------------------
-- static policy audit: no USING (true) anywhere in public or storage
-- ------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from pg_policies
   where schemaname in ('public', 'storage')
     and (qual = 'true' or with_check = 'true');
  if n <> 0 then
    raise exception 'PROBE FAIL: % policies use USING/WITH CHECK (true)', n;
  end if;

  select count(*) into n from pg_class c
   join pg_namespace ns on ns.oid = c.relnamespace
  where ns.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  if n <> 0 then
    raise exception 'PROBE FAIL: % public tables without RLS', n;
  end if;

  insert into probe_results values ('no USING (true) policies; RLS on all tables', 'PASS');
end $$;

-- ------------------------------------------------------------
-- Result
-- ------------------------------------------------------------
select name, result from probe_results order by name;

rollback;
