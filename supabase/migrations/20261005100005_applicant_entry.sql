-- ============================================================
-- Gillian Anderson Management · Foundation 6
-- Applicant entry: multi-step application data, acknowledgement
-- document (8 required topics), enriched signup trigger,
-- verification completes the application (status -> 'new')
-- ============================================================

-- ------------------------------------------------------------
-- 1. applicant_profiles: application answers collected before account creation
--    (persisted server-side by handle_new_user from signup metadata)
-- ------------------------------------------------------------
alter table public.applicant_profiles
  add column reason_for_joining     text,
  add column platform_motivation    text,
  add column connection_interest    text,
  add column experience_interests   text[] not null default '{}',
  add column contact_email_ok       boolean not null default true,
  add column contact_phone_ok       boolean not null default false,
  add column contact_whatsapp_ok    boolean not null default false,
  add column whatsapp_number        text,
  add column application_completed_at timestamptz;

alter table public.applicant_profiles drop constraint if exists applicant_profiles_status_check;
alter table public.applicant_profiles
  add constraint applicant_profiles_status_check
  check (status in ('new','draft','submitted','in_review','approved','rejected'));

alter table public.applicant_profiles drop constraint if exists applicant_profiles_experience_interests_check;
alter table public.applicant_profiles
  add constraint applicant_profiles_experience_interests_check
  check (experience_interests <@ array[
    'personal_experience','video_communication','voice_message','text_communication',
    'virtual_meeting','meet_greet','business_request','special_occasion','other'
  ]::text[]);

-- ------------------------------------------------------------
-- 2. Acknowledgement document — must cover all required topics.
--    (Version 1 has not been accepted by anyone yet, so it is updated in
--     place; if that ever changes, a new published version is created.)
-- ------------------------------------------------------------
do $$
declare
  v_has_acks boolean;
  v_content  text;
begin
  v_content := $ack$
Please read this acknowledgement carefully before creating an account.

1. Platform purpose
Gillian Anderson Management is a private, gated platform for managed personal
and professional engagement. Creating an account does not grant access to
Gillian Anderson, nor does it guarantee membership, a response to any request,
or participation in any experience.

2. Management-first process
Management is always the bridge. All communication, requests, membership
decisions and experiences are handled by the management team. Nothing on this
platform happens automatically between you and Gillian Anderson.

3. Privacy expectations
Information you provide is used to evaluate and manage your requests,
membership and experiences. Your personal details, documents and conversations
are stored privately and are visible only to you and to management. Your
information is not shared publicly and is not used for public fan or social
features.

4. Membership explanation
Membership requires an application and review by management. Approval is at
management's sole discretion and may be declined without obligation to provide
reasons. Membership is never purchased or activated automatically during
account creation, and no membership benefits begin without an explicit offer
accepted through management.

5. Experience approval explanation
Experiences are proposed, reviewed, scheduled and confirmed individually by
management. Submitting an interest or request does not create an entitlement,
booking, reservation or commitment of any kind.

6. Availability disclaimer
Gillian Anderson's availability is never guaranteed. Nothing presented on this
platform should be read as a promise of availability, timing, response time
or outcome. Dates, participation and terms exist only once confirmed in
writing by management.

7. Communication expectations
All correspondence flows through the management team. Response times vary and
are not guaranteed. Professional, respectful communication is expected;
the platform is not a social network, fan community, direct messaging service
or public feed.

8. Terms acknowledgement
By continuing you confirm that you have read, understood and accepted this
acknowledgement in full, voluntarily, before creating your account. A record
of the version you accepted is stored with your account.
$ack$;

  select exists (select 1 from public.acknowledgements) into v_has_acks;

  if not v_has_acks then
    update public.acknowledgement_versions
       set content = v_content,
           title = 'Platform Acknowledgement',
           updated_at = now()
     where version = 1;
  else
    update public.acknowledgement_versions set is_active = false where version = 1;
    insert into public.acknowledgement_versions (version, title, content, is_active, published_at)
    values (2, 'Platform Acknowledgement', v_content, true, now())
    on conflict (version) do update
      set content = excluded.content,
          title = excluded.title,
          is_active = true,
          published_at = now(),
          updated_at = now();
  end if;
end $$;

-- ------------------------------------------------------------
-- 3. handle_new_user: also persists the completed application
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_ack_version integer;
  v_ack_at      timestamptz;
  v_user_agent   text;
  v_ack_exists   boolean;
  v_meta         jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_contact      text;
  v_interests    text[] := '{}';
  v_el           text;
begin
  v_ack_version := nullif(v_meta ->> 'ack_version', '')::integer;
  v_ack_at      := nullif(v_meta ->> 'ack_at', '')::timestamptz;
  v_user_agent  := left(v_meta ->> 'user_agent', 500);

  if v_ack_version is null or v_ack_at is null then
    raise exception 'acknowledgement required before account creation'
      using errcode = 'P0001';
  end if;

  select exists (
    select 1 from public.acknowledgement_versions av
    where av.version = v_ack_version
      and av.is_active
      and av.published_at is not null
      and av.published_at <= v_ack_at
  ) into v_ack_exists;

  if not v_ack_exists then
    raise exception 'acknowledgement version is not valid or not published'
      using errcode = 'P0001';
  end if;

  -- preferred contact method must be one of the allowed values
  v_contact := nullif(v_meta ->> 'preferred_contact_method', '');
  if v_contact is not null and v_contact not in ('email','phone','sms','none') then
    raise exception 'invalid preferred contact method';
  end if;

  -- experience interests must be known categories
  if v_meta ? 'experience_interests' then
    if jsonb_typeof(v_meta -> 'experience_interests') <> 'array' then
      raise exception 'invalid experience interests';
    end if;
    for v_el in select value #>> '{}' from jsonb_array_elements(v_meta -> 'experience_interests')
    loop
      if v_el not in (
        'personal_experience','video_communication','voice_message','text_communication',
        'virtual_meeting','meet_greet','business_request','special_occasion','other'
      ) then
        raise exception 'invalid experience interest';
      end if;
      v_interests := v_interests || left(v_el, 60);
    end loop;
  end if;

  insert into public.profiles (
    id, email, full_name, phone, country, city, occupation, company,
    preferred_contact_method, status, email_verified_at
  )
  values (
    new.id,
    new.email,
    left(coalesce(v_meta ->> 'full_name', ''), 200),
    left(nullif(v_meta ->> 'phone', ''), 40),
    left(nullif(v_meta ->> 'country', ''), 100),
    left(nullif(v_meta ->> 'city', ''), 100),
    left(nullif(v_meta ->> 'occupation', ''), 200),
    left(nullif(v_meta ->> 'company', ''), 200),
    v_contact,
    'pending',
    case when new.email_confirmed_at is not null then new.email_confirmed_at end
  );

  insert into public.acknowledgements (user_id, acknowledgement_version, accepted_at, user_agent)
  values (new.id, v_ack_version, v_ack_at, v_user_agent)
  on conflict (user_id, acknowledgement_version) do nothing;

  -- The application travels with the account and is stored server-side.
  insert into public.applicant_profiles (
    user_id, status,
    reason_for_joining, platform_motivation, connection_interest,
    experience_interests, contact_email_ok, contact_phone_ok,
    contact_whatsapp_ok, whatsapp_number, application_completed_at
  )
  values (
    new.id,
    'draft',
    left(nullif(v_meta ->> 'reason_for_joining', ''), 2000),
    left(nullif(v_meta ->> 'platform_motivation', ''), 2000),
    left(nullif(v_meta ->> 'connection_interest', ''), 2000),
    v_interests,
    coalesce(nullif(v_meta ->> 'contact_email_ok', '')::boolean, true),
    coalesce(nullif(v_meta ->> 'contact_phone_ok', '')::boolean, false),
    coalesce(nullif(v_meta ->> 'contact_whatsapp_ok', '')::boolean, false),
    left(nullif(v_meta ->> 'whatsapp_number', ''), 40),
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 4. handle_email_confirmed: verification completes onboarding —
--    account active, application enters review as status 'new'
-- ------------------------------------------------------------
create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and (old.email_confirmed_at is null or old.email_confirmed_at is distinct from new.email_confirmed_at) then
    update public.profiles
       set email = new.email,
           email_verified_at = new.email_confirmed_at,
           status = case when status = 'pending' then 'active' else status end
     where id = new.id;

    update public.applicant_profiles
       set status = 'new',
           submitted_at = coalesce(submitted_at, now()),
           updated_at = now()
     where user_id = new.id and status = 'draft';
  elsif new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Verification
-- ------------------------------------------------------------
select 'applicant_columns' as check,
       (select string_agg(column_name, ',' order by column_name)
          from information_schema.columns
         where table_schema = 'public' and table_name = 'applicant_profiles'
           and column_name in ('reason_for_joining','platform_motivation','connection_interest',
                               'experience_interests','contact_email_ok','contact_phone_ok',
                               'contact_whatsapp_ok','whatsapp_number','application_completed_at')) as detail
union all
select 'ack_topics',
       (select count(*)::text from public.acknowledgement_versions
         where version = 1 and content like '%8. Terms acknowledgement%')
union all
select 'applicant_statuses',
       (select pg_get_constraintdef(oid) from pg_constraint
         where conname = 'applicant_profiles_status_check');
