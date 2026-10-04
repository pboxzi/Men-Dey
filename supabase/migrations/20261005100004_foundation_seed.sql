-- ============================================================
-- Gillian Anderson Management · Foundation 5/5
-- Baseline seed: acknowledgement document + account backfill
-- ============================================================
-- Only real, required data is created:
--   * the platform acknowledgement (version 1) that new applicants must accept
--   * profile rows for the 7 existing auth accounts (their rows were removed
--     with the legacy schema; no acknowledgement is fabricated for them)
--   * administrator role for the platform owner account
-- No memberships, payments, requests, experiences or CMS content are invented.

-- ------------------------------------------------------------
-- 1. Acknowledgement version 1
-- ------------------------------------------------------------
insert into public.acknowledgement_versions (version, title, content, is_active, published_at)
values (
  1,
  'Platform Acknowledgement',
  $ack$
Please read this acknowledgement carefully before creating an account.

1. Private and gated platform
Gillian Anderson Management is a private platform. Creating an account does not
grant access to Gillian Anderson, nor does it guarantee membership, a response
to any request, or participation in any experience.

2. Management is always the bridge
All communication, requests, membership decisions and experiences are managed
by the management team. Nothing on this platform happens automatically between
you and Gillian Anderson.

3. Membership requires approval
Membership applications are reviewed by management. Approval is at management's
sole discretion and may be declined without obligation to provide reasons.

4. Experiences are approved individually
Any experience is proposed, scheduled and confirmed by management. Submitting a
request does not create an entitlement, booking or commitment.

5. Your information
Information you provide is used to evaluate and manage your requests,
membership and experiences. Sensitive documents are stored privately and are
only visible to you and to management.

6. Conduct
This platform is for professional, managed personal and business engagement.
It is not a social network, fan community or public messaging service.

By continuing you explicitly acknowledge that you have read and understood
this notice.
$ack$,
  true,
  now()
)
on conflict (version) do nothing;

-- ------------------------------------------------------------
-- 2. Profile backfill for existing auth accounts
-- ------------------------------------------------------------
insert into public.profiles (id, email, full_name, status, email_verified_at, created_at)
select u.id,
       u.email,
       left(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), 200),
       case when u.email_confirmed_at is not null then 'active' else 'pending' end,
       u.email_confirmed_at,
       coalesce(u.created_at, now())
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 3. Platform owner → administrator
-- ------------------------------------------------------------
update public.profiles
   set role = 'admin',
       status = 'active'
 where lower(email) = 'pboxzi001@gmail.com'
   and role <> 'admin';

-- ------------------------------------------------------------
-- Verification (one result set)
-- ------------------------------------------------------------
select 'ack_versions' as check,
       (select count(*)::text from public.acknowledgement_versions) as detail
union all
select 'profiles', (select count(*)::text from public.profiles)
union all
select 'admins', (select string_agg(coalesce(email, id::text), ',') from public.profiles where role = 'admin')
union all
select 'tables_with_rls',
       (select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity)
union all
select 'public_tables_total',
       (select count(*)::text from pg_tables where schemaname = 'public');
