-- The management console embeds the member (user:profiles(...)) through owned
-- rows, but those columns referenced auth.users only, so PostgREST could not
-- resolve memberships/offers to profiles at all, and where a staff reference
-- existed (assigned_to, created_by, reviewed_by) the embed silently returned
-- the staff member instead of the member. Repoint every member foreign key at
-- profiles — cascade behaviour is unchanged because profiles.id itself
-- cascades from auth.users — and guard against owners without a profile.

do $$
declare
  v_table    text;
  v_missing  integer;
  v_col      smallint;
  v_has_path boolean;
  v_fk       record;
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

  foreach v_table in array array[
    'requests',
    'memberships',
    'membership_offers',
    'management_conversations',
    'appointments',
    'membership_applications',
    'applicant_profiles'
  ] loop
    select a.attnum into v_col
      from pg_attribute a
     where a.attrelid = format('public.%I', v_table)::regclass
       and a.attname = 'user_id'
       and not a.attisdropped;
    if v_col is null then
      raise exception '% has no user_id column', v_table;
    end if;

    select exists (
      select 1
        from pg_constraint c
        join pg_class rt on rt.oid = c.confrelid
        join pg_namespace rn on rn.oid = rt.relnamespace
       where c.contype = 'f'
         and c.conrelid = format('public.%I', v_table)::regclass
         and c.conkey = array[v_col]
         and rn.nspname = 'public'
         and rt.relname = 'profiles'
    ) into v_has_path;
    if v_has_path then
      continue;
    end if;

    for v_fk in
      select c.conname
        from pg_constraint c
       where c.contype = 'f'
         and c.conrelid = format('public.%I', v_table)::regclass
         and c.conkey = array[v_col]
    loop
      execute format('alter table public.%I drop constraint %I', v_table, v_fk.conname);
    end loop;

    execute format(
      'alter table public.%I add constraint %I foreign key (user_id) references public.profiles (id) on delete cascade',
      v_table,
      v_table || '_user_id_fkey'
    );
  end loop;
end $$;
