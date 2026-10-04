-- ============================================================
-- Gillian Anderson Management · Foundation 7
-- Onboarding completion for both auth modes:
--   * autoconfirm projects (mailer_autoconfirm = true): the address is
--     confirmed at insert, so onboarding must complete in handle_new_user
--     (profile active, applicant status 'new').
--   * confirmation-link projects: unchanged path — handle_email_confirmed
--     completes onboarding when the link is opened.
-- ============================================================

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
  v_confirmed    boolean := new.email_confirmed_at is not null;
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

  v_contact := nullif(v_meta ->> 'preferred_contact_method', '');
  if v_contact is not null and v_contact not in ('email','phone','sms','none') then
    raise exception 'invalid preferred contact method';
  end if;

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
    case when v_confirmed then 'active' else 'pending' end,
    case when v_confirmed then new.email_confirmed_at end
  );

  insert into public.acknowledgements (user_id, acknowledgement_version, accepted_at, user_agent)
  values (new.id, v_ack_version, v_ack_at, v_user_agent)
  on conflict (user_id, acknowledgement_version) do nothing;

  insert into public.applicant_profiles (
    user_id, status,
    reason_for_joining, platform_motivation, connection_interest,
    experience_interests, contact_email_ok, contact_phone_ok,
    contact_whatsapp_ok, whatsapp_number, application_completed_at,
    submitted_at
  )
  values (
    new.id,
    case when v_confirmed then 'new' else 'draft' end,
    left(nullif(v_meta ->> 'reason_for_joining', ''), 2000),
    left(nullif(v_meta ->> 'platform_motivation', ''), 2000),
    left(nullif(v_meta ->> 'connection_interest', ''), 2000),
    v_interests,
    coalesce(nullif(v_meta ->> 'contact_email_ok', '')::boolean, true),
    coalesce(nullif(v_meta ->> 'contact_phone_ok', '')::boolean, false),
    coalesce(nullif(v_meta ->> 'contact_whatsapp_ok', '')::boolean, false),
    left(nullif(v_meta ->> 'whatsapp_number', ''), 40),
    now(),
    case when v_confirmed then now() end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Verification
select 'handle_new_user' as check,
       (select prosecdef from pg_proc where proname = 'handle_new_user')::text as detail;
