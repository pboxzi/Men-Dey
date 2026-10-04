-- ============================================================
-- Gillian Anderson Management · Foundation 3/5
-- RLS policies + least-privilege grants for every table
-- ============================================================
-- Rules enforced here (the database is the security boundary):
--   * Users only ever see their own rows.
--   * Management sees what management operations require.
--   * Admins manage the whole system.
--   * Management notes, audit logs and payment records are never user-readable.
--   * No USING (true) on private data anywhere.
--   * Role/status escalations happen only through SECURITY DEFINER functions.

-- ------------------------------------------------------------
-- Generic guard: non-management callers cannot change chosen columns
-- (applied where users may update their own row but not its workflow state)
-- ------------------------------------------------------------
create or replace function public.protect_management_columns()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  col   text;
  caller uuid := (select auth.uid());
begin
  if caller is null then
    return new;                       -- trusted server-side path
  end if;
  if public.is_management() then
    return new;
  end if;
  foreach col in array tg_argv loop
    if (to_jsonb(new) ->> col) is distinct from (to_jsonb(old) ->> col) then
      -- Users may still submit their own work and withdraw/cancel it:
      --   draft -> submitted      (submit an application)
      --   submitted -> withdrawn  (withdraw an application)
      --   submitted -> cancelled  (cancel a request)
      if col = 'status'
         and (
           ((to_jsonb(old) ->> col) = 'draft'      and (to_jsonb(new) ->> col) = 'submitted')
        or ((to_jsonb(old) ->> col) = 'submitted'  and (to_jsonb(new) ->> col) in ('withdrawn','cancelled'))
         ) then
        continue;
      end if;
      raise exception 'only management can change %', col;
    end if;
  end loop;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
revoke all on table public.profiles from anon;
revoke update on table public.profiles from authenticated;
grant update (full_name, phone, country, city, address, date_of_birth,
              occupation, company, website, preferred_contact_method, profile_photo)
  on table public.profiles to authenticated;

drop policy if exists "profiles select" on public.profiles;
create policy "profiles select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_management()));

drop policy if exists "profiles insert" on public.profiles;
create policy "profiles insert" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()) and role = 'user' and status = 'pending');

drop policy if exists "profiles update" on public.profiles;
create policy "profiles update" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_management()))
  with check (id = (select auth.uid()) or (select public.is_management()));

drop policy if exists "profiles delete" on public.profiles;
create policy "profiles delete" on public.profiles for delete to authenticated
  using ((select public.is_admin()));

-- ------------------------------------------------------------
-- staff_roles / staff_profiles
-- ------------------------------------------------------------
drop policy if exists "staff_roles read" on public.staff_roles;
create policy "staff_roles read" on public.staff_roles for select to authenticated
  using ((select public.is_management()));
drop policy if exists "staff_roles write" on public.staff_roles;
create policy "staff_roles write" on public.staff_roles for insert to authenticated
  with check ((select public.is_admin()));
drop policy if exists "staff_roles update" on public.staff_roles;
create policy "staff_roles update" on public.staff_roles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "staff_roles delete" on public.staff_roles;
create policy "staff_roles delete" on public.staff_roles for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists "staff_profiles read" on public.staff_profiles;
create policy "staff_profiles read" on public.staff_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "staff_profiles write" on public.staff_profiles;
create policy "staff_profiles write" on public.staff_profiles for insert to authenticated
  with check ((select public.is_admin()));
drop policy if exists "staff_profiles update" on public.staff_profiles;
create policy "staff_profiles update" on public.staff_profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "staff_profiles delete" on public.staff_profiles;
create policy "staff_profiles delete" on public.staff_profiles for delete to authenticated
  using ((select public.is_admin()));

-- ------------------------------------------------------------
-- acknowledgement
-- ------------------------------------------------------------
drop policy if exists "ack versions read" on public.acknowledgement_versions;
create policy "ack versions read" on public.acknowledgement_versions
  for select to anon, authenticated
  using (is_active or (select public.is_management()));

drop policy if exists "ack versions write" on public.acknowledgement_versions;
create policy "ack versions write" on public.acknowledgement_versions
  for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "ack versions update" on public.acknowledgement_versions;
create policy "ack versions update" on public.acknowledgement_versions
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "ack versions delete" on public.acknowledgement_versions;
create policy "ack versions delete" on public.acknowledgement_versions
  for delete to authenticated using ((select public.is_admin()));

-- acknowledgements are evidence: append-only for clients
revoke update, delete on table public.acknowledgements from anon, authenticated;

drop policy if exists "acknowledgements read" on public.acknowledgements;
create policy "acknowledgements read" on public.acknowledgements
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "acknowledgements insert" on public.acknowledgements;
create policy "acknowledgements insert" on public.acknowledgements
  for insert to authenticated with check (user_id = (select auth.uid()));

-- account_agreements: evidence, append-only
revoke update, delete on table public.account_agreements from anon, authenticated;

drop policy if exists "account agreements read" on public.account_agreements;
create policy "account agreements read" on public.account_agreements
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "account agreements insert" on public.account_agreements;
create policy "account agreements insert" on public.account_agreements
  for insert to authenticated with check (user_id = (select auth.uid()));

-- ------------------------------------------------------------
-- applicant_profiles
-- ------------------------------------------------------------
drop trigger if exists trg_protect_applicant on public.applicant_profiles;
create trigger trg_protect_applicant
  before update on public.applicant_profiles
  for each row execute function public.protect_management_columns(
    'status','reviewed_by','reviewed_at','review_notes');

drop policy if exists "applicants read" on public.applicant_profiles;
create policy "applicants read" on public.applicant_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "applicants insert" on public.applicant_profiles;
create policy "applicants insert" on public.applicant_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'draft');
drop policy if exists "applicants update" on public.applicant_profiles;
create policy "applicants update" on public.applicant_profiles for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()))
  with check (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "applicants delete" on public.applicant_profiles;
create policy "applicants delete" on public.applicant_profiles for delete to authenticated
  using ((select public.is_admin()));

-- ------------------------------------------------------------
-- management communication
-- ------------------------------------------------------------
drop policy if exists "conversations read" on public.management_conversations;
create policy "conversations read" on public.management_conversations
  for select to authenticated
  using ((select public.is_management()) or user_id = (select auth.uid()));
drop policy if exists "conversations insert" on public.management_conversations;
create policy "conversations insert" on public.management_conversations
  for insert to authenticated
  with check ((select public.is_management()) or user_id = (select auth.uid()));
drop policy if exists "conversations update" on public.management_conversations;
create policy "conversations update" on public.management_conversations
  for update to authenticated
  using ((select public.is_management()) or user_id = (select auth.uid()))
  with check ((select public.is_management()) or user_id = (select auth.uid()));
drop policy if exists "conversations delete" on public.management_conversations;
create policy "conversations delete" on public.management_conversations
  for delete to authenticated using ((select public.is_management()));

-- messages: append-only; internal messages never reach users
drop policy if exists "conversation messages read" on public.management_messages;
create policy "conversation messages read" on public.management_messages
  for select to authenticated
  using (
    (select public.is_management())
    or (
      not is_internal
      and exists (
        select 1 from public.management_conversations c
        where c.id = conversation_id and c.user_id = (select auth.uid())
      )
    )
  );
drop policy if exists "conversation messages insert" on public.management_messages;
create policy "conversation messages insert" on public.management_messages
  for insert to authenticated
  with check (
    (
      (select public.is_management())
      or (
        sender_id = (select auth.uid())
        and exists (
          select 1 from public.management_conversations c
          where c.id = conversation_id and c.user_id = (select auth.uid())
        )
      )
    )
  );

-- management notes: management-only, never visible to users
drop policy if exists "management notes all" on public.management_notes;
create policy "management notes all" on public.management_notes
  for all to authenticated
  using ((select public.is_management()))
  with check ((select public.is_management()));

-- ------------------------------------------------------------
-- requests
-- ------------------------------------------------------------
drop policy if exists "requests read" on public.requests;
create policy "requests read" on public.requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "requests insert" on public.requests;
create policy "requests insert" on public.requests for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "requests update" on public.requests;
create policy "requests update" on public.requests for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()))
  with check (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "requests delete" on public.requests;
create policy "requests delete" on public.requests for delete to authenticated
  using ((select public.is_management()));

drop policy if exists "request messages read" on public.request_messages;
create policy "request messages read" on public.request_messages
  for select to authenticated
  using (
    (select public.is_management())
    or (
      not is_internal
      and exists (
        select 1 from public.requests r
        where r.id = request_id and r.user_id = (select auth.uid())
      )
    )
  );
drop policy if exists "request messages insert" on public.request_messages;
create policy "request messages insert" on public.request_messages
  for insert to authenticated
  with check (
    (select public.is_management())
    or (
      sender_id = (select auth.uid())
      and exists (
        select 1 from public.requests r
        where r.id = request_id and r.user_id = (select auth.uid())
      )
    )
  );

-- ------------------------------------------------------------
-- membership
-- ------------------------------------------------------------
drop policy if exists "membership tiers read" on public.membership_tiers;
create policy "membership tiers read" on public.membership_tiers
  for select to anon, authenticated
  using (is_active or (select public.is_management()));
drop policy if exists "membership tiers insert" on public.membership_tiers;
create policy "membership tiers insert" on public.membership_tiers
  for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "membership tiers update" on public.membership_tiers;
create policy "membership tiers update" on public.membership_tiers
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "membership tiers delete" on public.membership_tiers;
create policy "membership tiers delete" on public.membership_tiers
  for delete to authenticated using ((select public.is_admin()));

drop trigger if exists trg_protect_membership_app on public.membership_applications;
create trigger trg_protect_membership_app
  before update on public.membership_applications
  for each row execute function public.protect_management_columns(
    'status','reviewed_by','reviewed_at','review_notes');

drop policy if exists "membership apps read" on public.membership_applications;
create policy "membership apps read" on public.membership_applications
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "membership apps insert" on public.membership_applications;
create policy "membership apps insert" on public.membership_applications
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'submitted');
drop policy if exists "membership apps update" on public.membership_applications;
create policy "membership apps update" on public.membership_applications
  for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()))
  with check (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "membership apps delete" on public.membership_applications;
create policy "membership apps delete" on public.membership_applications
  for delete to authenticated using ((select public.is_admin()));

drop policy if exists "membership offers read" on public.membership_offers;
create policy "membership offers read" on public.membership_offers
  for select to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.membership_applications a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
  );
drop policy if exists "membership offers write" on public.membership_offers;
create policy "membership offers write" on public.membership_offers
  for insert to authenticated with check ((select public.is_management()));
drop policy if exists "membership offers update" on public.membership_offers;
create policy "membership offers update" on public.membership_offers
  for update to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));
drop policy if exists "membership offers delete" on public.membership_offers;
create policy "membership offers delete" on public.membership_offers
  for delete to authenticated using ((select public.is_management()));

drop policy if exists "memberships read" on public.memberships;
create policy "memberships read" on public.memberships for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "memberships write" on public.memberships;
create policy "memberships write" on public.memberships for insert to authenticated
  with check ((select public.is_management()));
drop policy if exists "memberships update" on public.memberships;
create policy "memberships update" on public.memberships for update to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));
drop policy if exists "memberships delete" on public.memberships;
create policy "memberships delete" on public.memberships for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists "membership payments read" on public.membership_payments;
create policy "membership payments read" on public.membership_payments
  for select to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.memberships m
      where m.id = membership_id and m.user_id = (select auth.uid())
    )
  );
drop policy if exists "membership payments write" on public.membership_payments;
create policy "membership payments write" on public.membership_payments
  for insert to authenticated with check ((select public.is_management()));
drop policy if exists "membership payments update" on public.membership_payments;
create policy "membership payments update" on public.membership_payments
  for update to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));

-- ------------------------------------------------------------
-- experiences
-- ------------------------------------------------------------
drop policy if exists "experiences read" on public.experiences;
create policy "experiences read" on public.experiences
  for select to anon, authenticated
  using (status = 'published' or (select public.is_management()));
drop policy if exists "experiences insert" on public.experiences;
create policy "experiences insert" on public.experiences for insert to authenticated
  with check ((select public.is_management()));
drop policy if exists "experiences update" on public.experiences;
create policy "experiences update" on public.experiences for update to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));
drop policy if exists "experiences delete" on public.experiences;
create policy "experiences delete" on public.experiences for delete to authenticated
  using ((select public.is_admin()));

drop trigger if exists trg_protect_exp_request on public.experience_requests;
create trigger trg_protect_exp_request
  before update on public.experience_requests
  for each row execute function public.protect_management_columns('status','assigned_to');

drop policy if exists "experience requests read" on public.experience_requests;
create policy "experience requests read" on public.experience_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "experience requests insert" on public.experience_requests;
create policy "experience requests insert" on public.experience_requests
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "experience requests update" on public.experience_requests;
create policy "experience requests update" on public.experience_requests
  for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()))
  with check (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "experience requests delete" on public.experience_requests;
create policy "experience requests delete" on public.experience_requests
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_management()));

drop trigger if exists trg_protect_exp_requirements on public.experience_requirements;
create trigger trg_protect_exp_requirements
  before update on public.experience_requirements
  for each row execute function public.protect_management_columns(
    'label','description','is_required','experience_request_id');

drop policy if exists "experience requirements read" on public.experience_requirements;
create policy "experience requirements read" on public.experience_requirements
  for select to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.experience_requests r
      where r.id = experience_request_id and r.user_id = (select auth.uid())
    )
  );
drop policy if exists "experience requirements write" on public.experience_requirements;
create policy "experience requirements write" on public.experience_requirements
  for insert to authenticated with check ((select public.is_management()));
drop policy if exists "experience requirements update" on public.experience_requirements;
create policy "experience requirements update" on public.experience_requirements
  for update to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.experience_requests r
      where r.id = experience_request_id and r.user_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_management())
    or exists (
      select 1 from public.experience_requests r
      where r.id = experience_request_id and r.user_id = (select auth.uid())
    )
  );

drop policy if exists "experience proposals read" on public.experience_proposals;
create policy "experience proposals read" on public.experience_proposals
  for select to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.experience_requests r
      where r.id = experience_request_id and r.user_id = (select auth.uid())
    )
  );
drop policy if exists "experience proposals write" on public.experience_proposals;
create policy "experience proposals write" on public.experience_proposals
  for all to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));

drop policy if exists "experience schedules read" on public.experience_schedules;
create policy "experience schedules read" on public.experience_schedules
  for select to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.experience_requests r
      where r.id = experience_request_id and r.user_id = (select auth.uid())
    )
  );
drop policy if exists "experience schedules write" on public.experience_schedules;
create policy "experience schedules write" on public.experience_schedules
  for all to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));

drop policy if exists "experience payments read" on public.experience_payments;
create policy "experience payments read" on public.experience_payments
  for select to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.experience_requests r
      where r.id = experience_request_id and r.user_id = (select auth.uid())
    )
  );
drop policy if exists "experience payments write" on public.experience_payments;
create policy "experience payments write" on public.experience_payments
  for all to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));

-- ------------------------------------------------------------
-- appointments
-- ------------------------------------------------------------
drop policy if exists "appointments read" on public.appointments;
create policy "appointments read" on public.appointments
  for select to authenticated
  using ((select public.is_management()) or user_id = (select auth.uid()));
drop policy if exists "appointments insert" on public.appointments;
create policy "appointments insert" on public.appointments
  for insert to authenticated
  with check ((select public.is_management()) or user_id = (select auth.uid()));
drop policy if exists "appointments update" on public.appointments;
create policy "appointments update" on public.appointments
  for update to authenticated
  using ((select public.is_management()) or user_id = (select auth.uid()))
  with check ((select public.is_management()) or user_id = (select auth.uid()));
drop policy if exists "appointments delete" on public.appointments;
create policy "appointments delete" on public.appointments
  for delete to authenticated using ((select public.is_management()));

-- ------------------------------------------------------------
-- documents / notifications / tasks / audit
-- ------------------------------------------------------------
drop policy if exists "documents read" on public.documents;
create policy "documents read" on public.documents for select to authenticated
  using (
    (select public.is_management())
    or owner_user_id = (select auth.uid())
    or (visibility = 'shared' and (select auth.uid()) is not null)
  );
drop policy if exists "documents insert" on public.documents;
create policy "documents insert" on public.documents for insert to authenticated
  with check ((select public.is_management()) or owner_user_id = (select auth.uid()));
drop policy if exists "documents update" on public.documents;
create policy "documents update" on public.documents for update to authenticated
  using ((select public.is_management()) or owner_user_id = (select auth.uid()))
  with check ((select public.is_management()) or owner_user_id = (select auth.uid()));
drop policy if exists "documents delete" on public.documents;
create policy "documents delete" on public.documents for delete to authenticated
  using ((select public.is_management()) or owner_user_id = (select auth.uid()));

-- notifications: users manage only their own read state (column-limited)
revoke update on table public.notifications from anon, authenticated;
grant update (read_at) on table public.notifications to authenticated;

drop policy if exists "notifications read" on public.notifications;
create policy "notifications read" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "notifications insert" on public.notifications;
create policy "notifications insert" on public.notifications for insert to authenticated
  with check (user_id = (select auth.uid()) or (select public.is_management()));
drop policy if exists "notifications update" on public.notifications;
create policy "notifications update" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "notifications delete" on public.notifications;
create policy "notifications delete" on public.notifications for delete to authenticated
  using ((select public.is_management()) or user_id = (select auth.uid()));

-- tasks: internal work queue, management only
drop policy if exists "tasks all" on public.tasks;
create policy "tasks all" on public.tasks for all to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));

-- audit_logs: admin read, no client writes at all
revoke insert, update, delete on table public.audit_logs from anon, authenticated;
grant select on table public.audit_logs to authenticated;

drop policy if exists "audit logs read" on public.audit_logs;
create policy "audit logs read" on public.audit_logs for select to authenticated
  using ((select public.is_admin()));

-- ------------------------------------------------------------
-- settings / CMS / media
-- ------------------------------------------------------------
drop policy if exists "site settings read" on public.site_settings;
create policy "site settings read" on public.site_settings
  for select to anon, authenticated
  using (is_public or (select public.is_management()));
drop policy if exists "site settings write" on public.site_settings;
create policy "site settings write" on public.site_settings
  for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "site settings update" on public.site_settings;
create policy "site settings update" on public.site_settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "site settings delete" on public.site_settings;
create policy "site settings delete" on public.site_settings
  for delete to authenticated using ((select public.is_admin()));

drop policy if exists "cms pages read" on public.cms_pages;
create policy "cms pages read" on public.cms_pages
  for select to anon, authenticated
  using (status = 'published' or (select public.is_management()));
drop policy if exists "cms pages write" on public.cms_pages;
create policy "cms pages write" on public.cms_pages for all to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));

drop policy if exists "cms sections read" on public.cms_sections;
create policy "cms sections read" on public.cms_sections
  for select to anon, authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.cms_pages p
      where p.id = page_id and p.status = 'published'
    )
  );
drop policy if exists "cms sections write" on public.cms_sections;
create policy "cms sections write" on public.cms_sections for all to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));

drop policy if exists "media assets read" on public.media_assets;
create policy "media assets read" on public.media_assets
  for select to anon, authenticated
  using (
    (select public.is_management())
    or visibility = 'public'
    or (visibility = 'shared' and (select auth.uid()) is not null)
  );
drop policy if exists "media assets write" on public.media_assets;
create policy "media assets write" on public.media_assets for all to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));
