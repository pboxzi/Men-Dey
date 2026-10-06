-- ============================================================
-- Gillian Anderson Management - platform security audit
-- ============================================================
-- Structural audit: RLS coverage, permissive policy detection, executable
-- function allowlist, view safety, money checks, status machine guard,
-- storage privacy, client-writable audit surfaces.
--
-- Run: supabase db query --linked --file supabase/tests/security_audit.sql

begin;

create temporary table audit_results (name text primary key, status text not null, detail text not null);

-- 1. Every public base table has RLS enabled
insert into audit_results
select 'RLS enabled on every public table',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       coalesce(string_agg(c.relname, ', ' order by c.relname), 'no exceptions')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- 2. Every public base table either has a policy or grants clients nothing
insert into audit_results
select 'policy exists (or no client grants) on every public table',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       coalesce(string_agg(t.relname, ', ' order by t.relname), 'no exceptions')
from pg_class t
join pg_namespace n on n.oid = t.relnamespace
left join pg_policies p on p.schemaname = 'public' and p.tablename = t.relname
where n.nspname = 'public' and t.relkind = 'r'
  and p.policyname is null
  and (has_table_privilege('anon', t.oid, 'SELECT')
       or has_table_privilege('authenticated', t.oid, 'SELECT')
       or has_table_privilege('anon', t.oid, 'INSERT')
       or has_table_privilege('authenticated', t.oid, 'INSERT')
       or has_table_privilege('anon', t.oid, 'UPDATE')
       or has_table_privilege('authenticated', t.oid, 'UPDATE')
       or has_table_privilege('anon', t.oid, 'DELETE')
       or has_table_privilege('authenticated', t.oid, 'DELETE'));

-- 3. No USING (true) / WITH CHECK (true) policies
insert into audit_results
select 'no unrestricted USING/WITH CHECK (true) policy',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       coalesce(string_agg(schemaname || '.' || tablename || ':' || policyname, ', '), 'no exceptions')
from pg_policies
where schemaname = 'public'
  and (qual = 'true' or coalesce(with_check, 'false') = 'true');

-- 4. Callable functions are limited to the frontend RPC allowlist and the
--    helpers referenced by RLS policies (trigger/event trigger bodies excluded:
--    PostgreSQL refuses to invoke them directly)
insert into audit_results
select 'function EXECUTE limited to the frontend allowlist',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       coalesce(string_agg(p.proname, ', ' order by p.proname), 'no exceptions')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
  and p.prorettype not in ('pg_catalog.trigger'::regtype, 'pg_catalog.event_trigger'::regtype)
  and (has_function_privilege('anon', p.oid, 'EXECUTE')
       or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  and p.proname not in (
    'activate_membership', 'reissue_membership_card', 'schedule_experience',
    'send_announcement', 'admin_set_user_role',
    'is_admin', 'is_management', 'is_self', 'has_permission'
  );

-- 5. Views do not bypass RLS (security_invoker must be on)
insert into audit_results
select 'views run with invoker RLS',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       coalesce(string_agg(c.relname, ', '), 'no views')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
  and not (coalesce(c.reloptions, array[]::text[]) @> array['security_invoker=true']);

-- 6. Money columns carry a non-negative check
insert into audit_results
select 'money columns reject negative amounts',
       case when missing.ordinality = 0 then 'PASS' else 'FAIL' end,
       coalesce(missing.names, 'all checked')
from (
  select count(*) as ordinality,
         string_agg(m.col, ', ' order by m.col) as names
  from (values
        ('membership_offers', 'price_cents'),
        ('membership_tiers', 'price_cents'),
        ('membership_payments', 'amount_cents'),
        ('experience_payments', 'amount_cents'),
        ('experience_proposals', 'amount_cents')
      ) as m(tbl, col)
  where not exists (
    select 1
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    where rel.relname = m.tbl
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%' || m.col || ' %>=%'
  )
) missing;

-- 7. Request status machine guard is attached and firing
insert into audit_results
select 'request status transitions guarded server-side',
       case when count(*) = 1 then 'PASS' else 'FAIL' end,
       coalesce(max(tgname), 'guard trigger missing')
from pg_trigger
where not tgisinternal
  and tgrelid = 'public.requests'::regclass
  and tgname = 'trg_protect_request_status';

-- 8. Private storage: non-public buckets must not be world readable
insert into audit_results
select 'documents bucket is private',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       coalesce(string_agg(name, ', '), 'no exceptions')
from storage.buckets
where name = 'documents' and public;

-- 9. Sensitive tables: anon/authenticated hold no write access to audit surfaces
insert into audit_results
select 'audit surfaces are not client-writable',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       coalesce(string_agg(g.grantee || ' ' || g.privilege_type || ' on ' || g.table_name, ', '), 'no exceptions')
from information_schema.role_table_grants g
where g.grantee in ('anon', 'authenticated')
  and g.table_name in ('audit_logs', 'email_logs', 'rate_limits')
  and g.privilege_type in ('INSERT', 'UPDATE', 'DELETE');

-- 10. Client error log: authenticated may append, nobody may edit or remove
insert into audit_results
select 'client_error_logs append-only for clients',
       case
         when exists (
           select 1 from information_schema.role_table_grants
           where grantee = 'authenticated' and table_name = 'client_error_logs'
             and privilege_type = 'INSERT'
         )
         and not exists (
           select 1 from information_schema.role_table_grants
           where grantee in ('anon', 'authenticated') and table_name = 'client_error_logs'
             and privilege_type in ('UPDATE', 'DELETE')
         )
       then 'PASS' else 'FAIL'
       end,
       'authenticated INSERT only';

-- 11. Runtime: management follows the lifecycle, arbitrary jumps are refused
do $$
declare
  fan_id  uuid := 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  mgr_id  uuid := '99999999-9999-4999-8999-999999999999';
  rid     uuid;
  jumped  text;
  fan_blocked text;
  ack     jsonb;
  meta    jsonb := '{"provider":"email","providers":["email"]}';
begin
  ack := jsonb_build_object(
    'ack_version', '1',
    'ack_at', to_char((now() at time zone 'utc') + interval '1 second', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'user_agent', 'audit'
  );

  insert into auth.users (id, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, aud, role,
                          created_at, updated_at)
  values
    (fan_id, 'security-audit-fan@example.test', 'x', now(), meta, ack, 'authenticated', 'authenticated', now(), now()),
    (mgr_id, 'security-audit-mgr@example.test', 'x', now(), meta, ack, 'authenticated', 'authenticated', now(), now());

  update public.profiles set role = 'management', status = 'active' where id = mgr_id;
  update public.profiles set status = 'active' where id = fan_id;

  insert into public.requests (user_id, type, title, description, participants,
                               contact_method, preferred_date)
  values (fan_id, 'personal_experience', 'Audit request',
          'Status machine audit.', 'just me', 'email', '2026-12-01')
  returning id into rid;

  -- legal management transition: submitted -> in_review
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', mgr_id, 'role', 'authenticated')::text, true);
  update public.requests set status = 'in_review' where id = rid;

  -- illegal jump: in_review -> completed must be refused
  begin
    update public.requests set status = 'completed' where id = rid;
    jumped := 'accepted';
  exception when others then
    jumped := sqlerrm;
  end;

  -- the fan still cannot move a request that is under review
  perform set_config('request.jwt.claims',
    json_build_object('sub', fan_id, 'role', 'authenticated')::text, true);
  begin
    update public.requests set status = 'cancelled' where id = rid;
    fan_blocked := 'accepted';
  exception when others then
    fan_blocked := sqlerrm;
  end;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);

  if jumped is null or jumped = 'accepted' then
    raise exception 'PROBE FAIL: illegal status transition was accepted (%)', jumped;
  end if;
  if jumped not like '%invalid request status transition%' then
    raise exception 'PROBE FAIL: unexpected guard message (%)', jumped;
  end if;
  if fan_blocked is null or fan_blocked = 'accepted' then
    raise exception 'PROBE FAIL: fan changed a request status (%)', fan_blocked;
  end if;
  if exists (select 1 from public.requests where id = rid and status <> 'in_review') then
    raise exception 'PROBE FAIL: request status changed unexpectedly';
  end if;

  insert into audit_results values (
    'status machine: legal move allowed, jump refused, fan blocked',
    'PASS',
    'submitted -> in_review accepted; in_review -> completed refused; fan write refused'
  );
end $$;

-- Result
select name, status, detail from audit_results order by status, name;

rollback;
