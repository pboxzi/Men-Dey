-- The management console embeds the member (user:profiles(...)) through owned
-- rows, but those columns referenced auth.users only, so PostgREST could not
-- resolve memberships/offers to profiles at all, and where a staff reference
-- existed (assigned_to, created_by, reviewed_by) the embed silently returned
-- the staff member instead of the member. Add real foreign keys to profiles so
-- every embed resolves to the member; guard against owners without a profile.

do $$
declare
  v_table text;
  v_missing integer;
begin
  foreach v_table in array array[
    'requests',
    'memberships',
    'membership_offers',
    'management_conversations',
    'appointments',
    'membership_applications',
    'applicant_profiles'
  ] loop
    execute format(
      'select count(*) from public.%I t where t.user_id is not null and not exists (select 1 from public.profiles p where p.id = t.user_id)',
      v_table
    ) into v_missing;
    if v_missing > 0 then
      raise exception 'cannot link %.user_id to profiles: % row(s) have no profile', v_table, v_missing;
    end if;
  end loop;
end $$;

alter table public.requests
  add constraint requests_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.memberships
  add constraint memberships_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.membership_offers
  add constraint membership_offers_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.management_conversations
  add constraint management_conversations_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.appointments
  add constraint appointments_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.membership_applications
  add constraint membership_applications_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.applicant_profiles
  add constraint applicant_profiles_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
