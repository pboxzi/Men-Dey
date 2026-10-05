-- ============================================================
-- Gillian Anderson Management · Membership + experience lifecycle probe
-- ============================================================
-- Transactional (BEGIN … ROLLBACK): drives the full lifecycle as
-- anon / user / management and fails loudly with 'LIFECYCLE FAIL: …'.
--
-- Rules proven here (the ones that must never regress):
--   * accepting an offer creates a PENDING membership + PENDING payment
--   * a paid payment moves it to VERIFICATION — never to ACTIVE
--   * only activate_membership() activates and issues the card
--   * users cannot create or edit membership cards
--   * proposal accept -> payment_required + pending experience payment
--   * confirmation is blocked while the payment is unpaid
--   * schedules are management-only; the user sees the appointment
--   * only management can schedule / complete an experience
--
-- Run: supabase db query --linked --file supabase/tests/lifecycle_probe.sql

begin;

create temporary table lc_results (name text primary key, result text not null);

-- ------------------------------------------------------------
-- Setup (trusted path): user + management accounts
-- ------------------------------------------------------------
do $$
declare
  uid_u uuid := '90000000-0000-4000-8000-000000000001';
  uid_m uuid := '90000000-0000-4000-8000-000000000002';
  ack   jsonb;
  meta  jsonb := '{"provider":"email","providers":["email"]}';
begin
  ack := jsonb_build_object(
    'ack_version', '1',
    'ack_at', to_char((now() at time zone 'utc') + interval '1 second', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'user_agent', 'lifecycle probe'
  );
  insert into auth.users (id, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, aud, role,
                          created_at, updated_at)
  values
    (uid_u, 'lc-user@example.test', 'x', now(), meta, ack, 'authenticated', 'authenticated', now(), now()),
    (uid_m, 'lc-mgmt@example.test', 'x', now(), meta, ack, 'authenticated', 'authenticated', now(), now());

  if (select count(*) from public.profiles where id in (uid_u, uid_m)) <> 2 then
    raise exception 'LIFECYCLE FAIL: profiles were not created';
  end if;

  update public.profiles set role = 'management', status = 'active' where id = uid_m;
  insert into lc_results values ('setup: user + management accounts', 'PASS');
end $$;

-- ------------------------------------------------------------
-- Phase 1: management sends an offer, user responds
-- ------------------------------------------------------------
do $$
declare
  uid_u  text := '90000000-0000-4000-8000-000000000001';
  uid_m  text := '90000000-0000-4000-8000-000000000002';
  n      int;
  tier   uuid;
  offer  uuid;
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);

  insert into public.membership_tiers (key, name, price_cents, "interval", benefits, status)
  values ('platinum-circle', 'Platinum Circle', 10000, 'monthly',
          array['Priority scheduling','Private events'], 'active')
  returning id into tier;

  insert into public.membership_offers (user_id, tier_id, status, message, benefits, terms, expires_at)
  values (uid_u::uuid, tier, 'draft',
          'Management would like to offer you the Platinum Circle membership.',
          array['Priority scheduling','Private events'],
          'Monthly membership. Cancel any time through management.',
          now() + interval '7 days')
  returning id into offer;

  -- draft offers are invisible to the user
  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  select count(*) into n from public.membership_offers;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user sees % draft offers', n;
  end if;

  perform set_config('role', 'postgres', true);

  insert into lc_results values ('offer: draft hidden from user', 'PASS');
end $$;

-- ------------------------------------------------------------
-- Phase 2: management sends it -> notification -> user views + accepts
-- ------------------------------------------------------------
do $$
declare
  uid_u  text := '90000000-0000-4000-8000-000000000001';
  uid_m  text := '90000000-0000-4000-8000-000000000002';
  n      int;
  offer  uuid;
  memb   uuid;
begin
  select id into offer from public.membership_offers limit 1;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  update public.membership_offers set status = 'sent' where id = offer;

  -- the user was notified
  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  select count(*) into n from public.notifications
   where title = 'Management has sent you a membership offer' and user_id = uid_u::uuid;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: offer notification missing (%)', n;
  end if;

  -- user sees the sent offer
  select count(*) into n from public.membership_offers where id = offer;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user cannot see the sent offer';
  end if;

  -- user cannot edit offer details
  begin
    update public.membership_offers set price_cents = 1 where id = offer;
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user changed offer price';
  exception when raise_exception then
    if sqlerrm like 'LIFECYCLE FAIL%' then raise; end if;
    if sqlerrm not like '%only management can change offer details%' then
      perform set_config('role', 'postgres', true);
      raise exception 'LIFECYCLE FAIL: unexpected offer-detail error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  -- user cannot move an offer into arbitrary states
  begin
    update public.membership_offers set status = 'cancelled' where id = offer;
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user cancelled a sent offer';
  exception when raise_exception then
    if sqlerrm like 'LIFECYCLE FAIL%' then raise; end if;
    if sqlerrm not like '%this offer cannot be moved to%' then
      perform set_config('role', 'postgres', true);
      raise exception 'LIFECYCLE FAIL: unexpected offer-status error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  -- user marks it viewed, then accepts
  update public.membership_offers set status = 'viewed' where id = offer;

  -- user accepts
  update public.membership_offers set status = 'accepted' where id = offer;
  perform set_config('role', 'postgres', true);

  select id into memb from public.memberships where offer_id = offer;
  if memb is null then
    raise exception 'LIFECYCLE FAIL: accepting an offer did not create a membership';
  end if;
  if (select status from public.memberships where id = memb) <> 'pending' then
    raise exception 'LIFECYCLE FAIL: membership should be pending, is %',
      (select status from public.memberships where id = memb);
  end if;
  if (select viewed_at is null from public.membership_offers where id = offer) then
    raise exception 'LIFECYCLE FAIL: viewed_at was not recorded';
  end if;
  if (select responded_at is null from public.membership_offers where id = offer) then
    raise exception 'LIFECYCLE FAIL: responded_at was not recorded';
  end if;
  if not exists (
    select 1 from public.membership_payments
     where membership_id = memb and user_id = uid_u::uuid
       and amount_cents = 10000 and status = 'pending'
  ) then
    raise exception 'LIFECYCLE FAIL: pending membership payment missing';
  end if;

  insert into lc_results values ('offer: send notifies, details + status guarded, view + accept create pending membership + payment', 'PASS');
end $$;

-- ------------------------------------------------------------
-- Phase 3: membership cannot be self-activated; payment never auto-activates
-- ------------------------------------------------------------
do $$
declare
  uid_u  text := '90000000-0000-4000-8000-000000000001';
  uid_m  text := '90000000-0000-4000-8000-000000000002';
  memb   uuid;
  pay    uuid;
  n      int;
  v_status text;
begin
  select id into memb from public.memberships limit 1;
  select id into pay  from public.membership_payments where membership_id = memb;

  -- user cannot flip their own membership to active (RLS: management only)
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  update public.memberships set status = 'active' where id = memb;
  perform set_config('role', 'postgres', true);
  if (select status from public.memberships where id = memb) <> 'pending' then
    raise exception 'LIFECYCLE FAIL: user changed own membership status';
  end if;

  -- user cannot activate through the RPC either
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  begin
    perform public.activate_membership(memb);
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user activated their own membership';
  exception when raise_exception then
    if sqlerrm like 'LIFECYCLE FAIL%' then raise; end if;
    if sqlerrm not like '%only management can activate memberships%' then
      perform set_config('role', 'postgres', true);
      raise exception 'LIFECYCLE FAIL: unexpected activate error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  -- user cannot create or edit a card
  begin
    insert into public.membership_cards (membership_id, card_serial)
    values (memb, 'GA-FAKE-00001');
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user inserted a membership card';
  exception when insufficient_privilege then
    perform set_config('role', 'authenticated', true);
  end;
  begin
    update public.membership_cards set card_serial = 'GA-FAKE-00002';
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user edited a membership card';
  exception when insufficient_privilege then
    perform set_config('role', 'authenticated', true);
  end;

  -- user sees no card while the membership is not active
  select count(*) into n from public.membership_cards;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: card exists before activation';
  end if;
  perform set_config('role', 'postgres', true);

  -- management records the payment -> VERIFICATION, never ACTIVE
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  update public.membership_payments set status = 'paid', reference = 'BANK-REF-1' where id = pay;
  perform set_config('role', 'postgres', true);
  v_status := (select m.status from public.memberships m where m.id = memb);
  if v_status <> 'verification' then
    raise exception 'LIFECYCLE FAIL: paid payment should move to verification, got %', v_status;
  end if;
  if (select paid_at is null from public.membership_payments where id = pay) then
    raise exception 'LIFECYCLE FAIL: paid_at not recorded';
  end if;

  -- activation still blocked while any payment is pending? (this one is paid now)
  -- management activates -> active + number + card
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  perform public.activate_membership(memb);
  perform set_config('role', 'postgres', true);

  if (select status from public.memberships where id = memb) <> 'active' then
    raise exception 'LIFECYCLE FAIL: membership not active after activation';
  end if;
  if (select membership_number !~ '^GA-[0-9]{6}$' from public.memberships where id = memb) then
    raise exception 'LIFECYCLE FAIL: membership number format wrong: %',
      (select membership_number from public.memberships where id = memb);
  end if;
  if (select activation_date is null or expiration_date is null from public.memberships where id = memb) then
    raise exception 'LIFECYCLE FAIL: activation/expiration dates missing';
  end if;
  if (select card_serial !~ '^GA-PLATINUM-CIRCLE-[0-9A-F]{5}$'
        from public.membership_cards where membership_id = memb) then
    raise exception 'LIFECYCLE FAIL: card serial format wrong: %',
      (select card_serial from public.membership_cards where membership_id = memb);
  end if;
  if not exists (
    select 1 from public.audit_logs where action = 'membership.activated' and entity_id = memb::text
  ) then
    raise exception 'LIFECYCLE FAIL: activation audit missing';
  end if;

  -- user sees the card and the paid payment
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  select count(*) into n from public.membership_cards;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user sees % cards (expected 1)', n;
  end if;
  select count(*) into n from public.membership_payments;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user sees % membership payments', n;
  end if;
  select count(*) into n from public.notifications where title = 'Your membership is active';
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: activation notification missing';
  end if;
  perform set_config('role', 'postgres', true);

  insert into lc_results values ('membership: never auto-active; activation issues card + number', 'PASS');
end $$;

-- ------------------------------------------------------------
-- Phase 4: card reissue + no second membership while active
-- ------------------------------------------------------------
do $$
declare
  uid_u  text := '90000000-0000-4000-8000-000000000001';
  uid_m  text := '90000000-0000-4000-8000-000000000002';
  memb   uuid;
  old_serial text;
  new_serial text;
  n      int;
begin
  select id into memb from public.memberships limit 1;
  select card_serial into old_serial from public.membership_cards where membership_id = memb;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  new_serial := public.reissue_membership_card(memb);

  if new_serial = old_serial then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: reissue kept the same serial';
  end if;

  -- a second offer cannot create a second membership for an active member
  declare
    tier uuid;
    offer uuid;
  begin
    select id into tier from public.membership_tiers limit 1;
    insert into public.membership_offers (user_id, tier_id, status, message)
    values (uid_u::uuid, tier, 'sent', 'Second offer')
    returning id into offer;
    perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
    begin
      update public.membership_offers set status = 'accepted' where id = offer;
      perform set_config('role', 'postgres', true);
      raise exception 'LIFECYCLE FAIL: second membership created for an active member';
    exception when raise_exception then
      if sqlerrm like 'LIFECYCLE FAIL%' then raise; end if;
      if sqlerrm not like '%already has a pending or active membership%' then
        perform set_config('role', 'postgres', true);
        raise exception 'LIFECYCLE FAIL: unexpected second-offer error: %', sqlerrm;
      end if;
    end;
  end;
  perform set_config('role', 'postgres', true);

  insert into lc_results values ('membership: reissue rotates serial; one membership per user', 'PASS');
end $$;

-- ------------------------------------------------------------
-- Phase 5: experience request + requirements
-- ------------------------------------------------------------
do $$
declare
  uid_u  text := '90000000-0000-4000-8000-000000000001';
  uid_m  text := '90000000-0000-4000-8000-000000000002';
  n      int;
  exp    uuid;
  req    uuid;
  req2   uuid;
  rq     uuid;
  requirement uuid;
begin
  -- management publishes a catalog experience
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  insert into public.experiences (slug, title, description, location, price_cents, currency, status, type, starts_at, ends_at)
  values ('london-meet-greet', 'Meet & Greet in London', 'A private meet and greet.',
          'London', 5000, 'USD', 'published', 'meet_greet',
          now() + interval '10 days', now() + interval '10 days' + interval '2 hours')
  returning id into exp;

  -- user requests it (timeline starts at submitted)
  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  insert into public.requests (user_id, type, title, description, experience_id, participants, contact_method)
  values (uid_u::uuid, 'meet_greet', 'Meet & Greet request', 'I would love to attend.', exp, '1', 'email')
  returning id into req;

  if (select count(*) from public.request_events where request_id = req and event_type = 'submitted') <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: submitted event missing';
  end if;

  -- user cannot rewrite request details
  begin
    update public.requests set title = 'hijacked' where id = req;
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user rewrote request details';
  exception when raise_exception then
    if sqlerrm like 'LIFECYCLE FAIL%' then raise; end if;
    if sqlerrm not like '%only management can change request details%' then
      perform set_config('role', 'postgres', true);
      raise exception 'LIFECYCLE FAIL: unexpected content error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  -- user cannot self-approve, but may withdraw their own submitted request
  begin
    update public.requests set status = 'approved' where id = req;
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user approved own request';
  exception when raise_exception then
    if sqlerrm like 'LIFECYCLE FAIL%' then raise; end if;
    if sqlerrm not like '%only management can change request status%' then
      perform set_config('role', 'postgres', true);
      raise exception 'LIFECYCLE FAIL: unexpected status error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  insert into public.requests (user_id, type, title, description)
  values (uid_u::uuid, 'other', 'Scratch request', 'will withdraw')
  returning id into req2;
  update public.requests set status = 'cancelled' where id = req2;
  perform set_config('role', 'postgres', true);
  if (select resolved_at is null from public.requests where id = req2) then
    raise exception 'LIFECYCLE FAIL: cancelled request has no resolved_at';
  end if;

  -- management picks it up: assignment + review produce two events
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  update public.requests set assigned_to = uid_m::uuid, status = 'in_review' where id = req;
  perform set_config('role', 'postgres', true);
  if (select count(*) from public.request_events
       where request_id = req and event_type in ('management_received','review_started')) <> 2 then
    raise exception 'LIFECYCLE FAIL: management_received/review_started events missing';
  end if;

  -- management posts a requirement; user may respond, not redefine it
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  insert into public.experience_requirements (request_id, label, description, category, is_required)
  values (req, 'Proof of membership', 'Your current membership tier.', 'membership_tier', true)
  returning id into requirement;

  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  select count(*) into n from public.experience_requirements where request_id = req;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user cannot read requirements (%)', n;
  end if;
  update public.experience_requirements
     set response = 'Platinum Circle member', responded_at = null
   where id = requirement;
  perform set_config('role', 'postgres', true);
  if (select responded_at is null from public.experience_requirements where id = requirement) then
    raise exception 'LIFECYCLE FAIL: requirement responded_at not recorded';
  end if;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  begin
    update public.experience_requirements set label = 'hijacked' where id = requirement;
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user redefined a requirement';
  exception when raise_exception then
    if sqlerrm like 'LIFECYCLE FAIL%' then raise; end if;
    if sqlerrm not like '%only management can change requirements%' then
      perform set_config('role', 'postgres', true);
      raise exception 'LIFECYCLE FAIL: unexpected requirement error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'postgres', true);

  select id into rq from public.requests where id = req;
  if rq is null then
    raise exception 'LIFECYCLE FAIL: request vanished';
  end if;
  insert into lc_results values ('experience: request guarded, timeline real, requirements two-way', 'PASS');
end $$;

-- ------------------------------------------------------------
-- Phase 6: proposal -> accept -> payment -> confirm (guarded)
-- ------------------------------------------------------------
do $$
declare
  uid_u  text := '90000000-0000-4000-8000-000000000001';
  uid_m  text := '90000000-0000-4000-8000-000000000002';
  req    uuid;
  prop   uuid;
  pay    uuid;
  n      int;
begin
  select id into req from public.requests where title = 'Meet & Greet request';

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  insert into public.experience_proposals (request_id, version, summary, terms, amount_cents, currency, status,
                                           proposed_date, proposed_time, location, duration_minutes, participants)
  values (req, 1, 'Private meet & Greet, 45 minutes, backstage.',
          'Arrive 15 minutes early. No photography during the first 10 minutes.',
          5000, 'USD', 'draft',
          (now() + interval '10 days')::date, '14:00', 'London', 45, '1 guest')
  returning id into prop;

  update public.experience_proposals set status = 'sent' where id = prop;
  perform set_config('role', 'postgres', true);
  if (select status from public.requests where id = req) <> 'proposal' then
    raise exception 'LIFECYCLE FAIL: sending a proposal should move the request to proposal (got %)',
      (select status from public.requests where id = req);
  end if;
  if (select sent_at is null from public.experience_proposals where id = prop) then
    raise exception 'LIFECYCLE FAIL: sent_at not recorded';
  end if;
  if (select count(*) from public.request_events where request_id = req and event_type = 'proposal_created') <> 1 then
    raise exception 'LIFECYCLE FAIL: proposal_created event missing';
  end if;

  -- user sees it, cannot tamper, then accepts
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  select count(*) into n from public.experience_proposals where request_id = req;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user cannot read the proposal (%)', n;
  end if;
  begin
    update public.experience_proposals set amount_cents = 1 where id = prop;
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user rewrote the proposal price';
  exception when raise_exception then
    if sqlerrm like 'LIFECYCLE FAIL%' then raise; end if;
    if sqlerrm not like '%only management can change proposal details%' then
      perform set_config('role', 'postgres', true);
      raise exception 'LIFECYCLE FAIL: unexpected proposal-detail error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  update public.experience_proposals set status = 'viewed' where id = prop;
  update public.experience_proposals set status = 'accepted' where id = prop;
  perform set_config('role', 'postgres', true);

  if (select status from public.requests where id = req) <> 'payment_required' then
    raise exception 'LIFECYCLE FAIL: accept should move request to payment_required (got %)',
      (select status from public.requests where id = req);
  end if;
  if not exists (
    select 1 from public.experience_payments
     where request_id = req and proposal_id = prop and amount_cents = 5000 and status = 'pending'
  ) then
    raise exception 'LIFECYCLE FAIL: pending experience payment missing';
  end if;
  if (select count(*) from public.request_events where request_id = req and event_type = 'proposal_accepted') <> 1 then
    raise exception 'LIFECYCLE FAIL: proposal_accepted event missing';
  end if;

  -- user cannot confirm their own request
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  begin
    update public.requests set status = 'confirmed' where id = req;
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user confirmed own request';
  exception when raise_exception then
    if sqlerrm like 'LIFECYCLE FAIL%' then raise; end if;
    if sqlerrm not like '%only management can change request status%' then
      perform set_config('role', 'postgres', true);
      raise exception 'LIFECYCLE FAIL: unexpected confirm error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  -- management cannot confirm while the payment is unpaid
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  begin
    update public.requests set status = 'confirmed' where id = req;
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: confirmed with an unpaid experience payment';
  exception when raise_exception then
    if sqlerrm like 'LIFECYCLE FAIL%' then raise; end if;
    if sqlerrm not like '%experience payment must be paid before confirmation%' then
      perform set_config('role', 'postgres', true);
      raise exception 'LIFECYCLE FAIL: unexpected payment-guard error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  -- management records the payment, then confirms
  select id into pay from public.experience_payments where request_id = req;
  update public.experience_payments set status = 'paid', reference = 'BANK-REF-2' where id = pay;
  update public.requests set status = 'confirmed' where id = req;
  perform set_config('role', 'postgres', true);

  if (select status from public.requests where id = req) <> 'confirmed' then
    raise exception 'LIFECYCLE FAIL: request not confirmed after payment';
  end if;
  if (select paid_at is null from public.experience_payments where id = pay) then
    raise exception 'LIFECYCLE FAIL: experience paid_at not recorded';
  end if;
  if (select count(*) from public.request_events where request_id = req and event_type = 'confirmed') <> 1 then
    raise exception 'LIFECYCLE FAIL: confirmed event missing';
  end if;

  insert into lc_results values ('experience: proposal accept drives payment; confirm blocked until paid', 'PASS');
end $$;

-- ------------------------------------------------------------
-- Phase 7: scheduling (management-only) + completion
-- ------------------------------------------------------------
do $$
declare
  uid_u  text := '90000000-0000-4000-8000-000000000001';
  uid_m  text := '90000000-0000-4000-8000-000000000002';
  req    uuid;
  n      int;
  link   text;
  sched  jsonb;
begin
  select id into req from public.requests where title = 'Meet & Greet request';

  -- user cannot schedule
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  begin
    perform public.schedule_experience(req, 'Meet & Greet', now() + interval '3 days',
                                       now() + interval '3 days' + interval '1 hour');
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user scheduled an experience';
  exception when raise_exception then
    if sqlerrm like 'LIFECYCLE FAIL%' then raise; end if;
    if sqlerrm not like '%only management can schedule experiences%' then
      perform set_config('role', 'postgres', true);
      raise exception 'LIFECYCLE FAIL: unexpected schedule error: %', sqlerrm;
    end if;
  end;
  perform set_config('role', 'authenticated', true);

  -- user cannot create appointments directly
  begin
    insert into public.appointments (user_id, title, starts_at, ends_at, status)
    values (uid_u::uuid, 'Self-booked', now() + interval '1 day', now() + interval '1 day' + interval '1 hour', 'confirmed');
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user created an appointment';
  exception when insufficient_privilege then
    perform set_config('role', 'authenticated', true);
  end;

  -- management schedules (atomic: appointment + schedule + status + notify)
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  sched := public.schedule_experience(
    req, 'Meet & Greet', now() + interval '3 days', now() + interval '3 days' + interval '1 hour',
    'Europe/London', 'Private residence, London', 'https://meet.example.test/gillian-london',
    'Arrive 15 minutes early. Bring photo identification.'
  );
  perform set_config('role', 'postgres', true);

  if (select status from public.requests where id = req) <> 'scheduled' then
    raise exception 'LIFECYCLE FAIL: request not scheduled (got %)',
      (select status from public.requests where id = req);
  end if;
  if (sched->>'appointment_id') is null then
    raise exception 'LIFECYCLE FAIL: schedule_experience returned no appointment';
  end if;
  if (select count(*) from public.request_events where request_id = req and event_type = 'scheduled') <> 1 then
    raise exception 'LIFECYCLE FAIL: scheduled event missing';
  end if;

  -- user sees the appointment (with the meeting details), never the schedule row
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid_u, 'role', 'authenticated')::text, true);
  select count(*) into n from public.appointments where request_id = req;
  if n <> 1 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user sees % appointments (expected 1)', n;
  end if;
  select virtual_link into link from public.appointments where request_id = req;
  if link is null or link <> 'https://meet.example.test/gillian-london' then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: appointment meeting link missing';
  end if;
  select count(*) into n from public.experience_schedules;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user can read % schedule rows (expected 0)', n;
  end if;
  select count(*) into n from public.availability_blocks;
  if n <> 0 then
    perform set_config('role', 'postgres', true);
    raise exception 'LIFECYCLE FAIL: user can read % availability blocks', n;
  end if;

  -- management completes the experience
  perform set_config('request.jwt.claims', json_build_object('sub', uid_m, 'role', 'authenticated')::text, true);
  update public.requests set status = 'completed' where id = req;
  perform set_config('role', 'postgres', true);

  if (select resolved_at is null from public.requests where id = req) then
    raise exception 'LIFECYCLE FAIL: completed request has no resolved_at';
  end if;
  if (select count(*) from public.request_events where request_id = req and event_type = 'completed') <> 1 then
    raise exception 'LIFECYCLE FAIL: completed event missing';
  end if;

  -- payment provider settings exist and are public (never card data)
  if not exists (select 1 from public.site_settings where key = 'payment_settings' and is_public) then
    raise exception 'LIFECYCLE FAIL: payment_settings missing';
  end if;

  insert into lc_results values ('experience: schedule management-only, appointment user-visible, completes', 'PASS');
end $$;

-- ------------------------------------------------------------
-- Result
-- ------------------------------------------------------------
select name, result from lc_results order by name;

rollback;
