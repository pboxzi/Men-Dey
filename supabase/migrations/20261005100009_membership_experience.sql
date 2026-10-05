-- ============================================================
-- Gillian Anderson Management · Membership & experience lifecycle
-- ============================================================
-- Core rule: account creation does not equal membership. Management
-- decides offers; users accept; payments are recorded (never card data);
-- management confirms and activates; the card is issued server-side.
--
-- Experience lifecycle runs on `requests` (the single intake that already
-- carries the real timeline). The legacy parallel table experience_requests
-- is dropped; proposals/requirements/payments/schedules now attach to it.
--
--   submitted -> in_review -> proposal -> payment_required
--             -> confirmed -> scheduled -> completed
--
-- Payment never auto-activates a membership and never auto-completes an
-- experience: both require an explicit management action.

-- ============================================================
-- 1. requests: experience link + lifecycle statuses
-- ============================================================
alter table public.requests
  add column experience_id uuid references public.experiences (id) on delete set null;
create index requests_experience_idx on public.requests (experience_id);

alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests add constraint requests_status_check check (status in (
  'submitted','in_review','information_requested','proposal','payment_required',
  'confirmed','approved','scheduled','completed','declined','cancelled'));

-- request detail columns are immutable for users; experience_id joins them
create or replace function public.protect_request_content()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.is_management() then
    return new;
  end if;
  if row(
    new.title, new.type, new.priority, new.description,
    new.preferred_date, new.preferred_time, new.location,
    new.participants, new.contact_method, new.additional_requirements,
    new.experience_id, new.created_at, new.submitted_at
  ) is distinct from row(
    old.title, old.type, old.priority, old.description,
    old.preferred_date, old.preferred_time, old.location,
    old.participants, old.contact_method, old.additional_requirements,
    old.experience_id, old.created_at, old.submitted_at
  ) then
    raise exception 'only management can change request details';
  end if;
  return new;
end;
$$;

-- Status machine.
--   users (own request only): withdraw, respond to a proposal
--   management / service role: everything
--   an experience may not be confirmed while its payment is unpaid
create or replace function public.protect_request_status()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if (select auth.uid()) is not null and not public.is_management() then
      if not (
        old.user_id = (select auth.uid())
        and (
          (old.status = 'submitted'       and new.status = 'cancelled')
       or (old.status = 'proposal'        and new.status in ('payment_required','cancelled'))
       or (old.status = 'payment_required' and new.status = 'cancelled')
        )
      ) then
        raise exception 'only management can change request status';
      end if;
    end if;
    if new.status = 'confirmed' and old.status = 'payment_required' then
      if exists (
        select 1 from public.experience_payments p
        where p.request_id = new.id and p.status in ('pending','processing')
      ) then
        raise exception 'experience payment must be paid before confirmation';
      end if;
    end if;
    if new.status in ('approved','declined','completed','cancelled')
       and new.resolved_at is null then
      new.resolved_at := now();
    end if;
  end if;
  return new;
end;
$$;

-- timeline event vocabulary grows with the lifecycle
alter table public.request_events drop constraint if exists request_events_event_type_check;
alter table public.request_events add constraint request_events_event_type_check check (event_type in (
  'submitted','management_received','review_started','information_requested',
  'proposal_created','proposal_accepted','confirmed','approved','scheduled',
  'completed','declined','cancelled'));

create or replace function public.record_request_events()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare evt text;
begin
  if tg_op = 'INSERT' then
    insert into public.request_events (request_id, actor_id, event_type)
    values (new.id, (select auth.uid()), 'submitted');
    return new;
  end if;

  if new.assigned_to is not null and old.assigned_to is null then
    insert into public.request_events (request_id, actor_id, event_type)
    values (new.id, (select auth.uid()), 'management_received');
  end if;

  if new.status is distinct from old.status then
    evt := case new.status
      when 'in_review'             then 'review_started'
      when 'information_requested' then 'information_requested'
      when 'proposal'              then 'proposal_created'
      when 'payment_required'      then 'proposal_accepted'
      when 'confirmed'             then 'confirmed'
      when 'approved'              then 'approved'
      when 'scheduled'             then 'scheduled'
      when 'completed'             then 'completed'
      when 'declined'              then 'declined'
      when 'cancelled'             then 'cancelled'
    end;
    if evt is not null then
      insert into public.request_events (request_id, actor_id, event_type)
      values (new.id, (select auth.uid()), evt);
    end if;
  end if;
  return new;
end;
$$;

-- ============================================================
-- 2. shared helper: preference-aware user notifications
-- ============================================================
drop function if exists public.notify_user(uuid, text, text, text, text);
create function public.notify_user(
  p_user_id uuid, p_kind text, p_title text, p_body text, p_link text
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare v_ok boolean;
begin
  select case p_kind
           when 'membership' then p.notify_membership
           when 'experience' then p.notify_experiences
           when 'request'    then p.notify_requests
           else true
         end
    into v_ok
    from public.profiles p
   where p.id = p_user_id;
  if v_ok is not true then
    return;
  end if;
  insert into public.notifications (user_id, title, body, type, link)
  values (
    p_user_id, p_title, p_body,
    case p_kind when 'membership' then 'membership'
                when 'experience' then 'experience'
                when 'request'    then 'request'
                else 'info' end,
    p_link
  );
end;
$$;
-- internal only: lifecycle triggers call this as definer, users never do
revoke execute on function public.notify_user(uuid, text, text, text, text)
  from public, anon, authenticated, service_role;

-- ============================================================
-- 3. membership tiers: CMS-configurable with a real status
-- ============================================================
alter table public.membership_tiers
  add column status text not null default 'active'
    check (status in ('active','draft','archived'));

drop policy if exists "membership tiers read" on public.membership_tiers;
alter table public.membership_tiers drop column is_active;
create index membership_tiers_status_idx on public.membership_tiers (status, sort_order);
create policy "membership tiers read" on public.membership_tiers
  for select to anon, authenticated
  using (status = 'active' or (select public.is_management()));

drop policy if exists "membership tiers insert" on public.membership_tiers;
create policy "membership tiers insert" on public.membership_tiers
  for insert to authenticated with check ((select public.is_management()));
drop policy if exists "membership tiers update" on public.membership_tiers;
create policy "membership tiers update" on public.membership_tiers
  for update to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));
drop policy if exists "membership tiers delete" on public.membership_tiers;
create policy "membership tiers delete" on public.membership_tiers
  for delete to authenticated using ((select public.is_admin()));

-- ============================================================
-- 4. membership payments: provider-agnostic records, never card data
--    (schema first: the offer-acceptance trigger inserts these)
-- ============================================================
alter table public.membership_payments
  add column user_id uuid references auth.users (id) on delete cascade,
  add column notes text;
alter table public.membership_payments rename column provider_ref to reference;

alter table public.membership_payments drop constraint if exists membership_payments_status_check;
alter table public.membership_payments add constraint membership_payments_status_check check (status in
  ('pending','processing','paid','failed','refunded','cancelled'));

-- ============================================================
-- 5. membership offers: personalized, direct to a user
-- ============================================================
alter table public.membership_offers
  add column user_id uuid references auth.users (id) on delete cascade,
  add column price_cents integer check (price_cents is null or price_cents >= 0),
  add column currency text not null default 'USD',
  add column message text,
  add column benefits text[] not null default '{}',
  add column terms text,
  add column viewed_at timestamptz;
alter table public.membership_offers alter column application_id drop not null;
update public.membership_offers m
   set user_id = a.user_id
  from public.membership_applications a
 where m.application_id = a.id and m.user_id is null;
alter table public.membership_offers alter column user_id set not null;

alter table public.membership_offers drop constraint if exists membership_offers_status_check;
alter table public.membership_offers add constraint membership_offers_status_check check (status in (
  'draft','sent','viewed','accepted','declined','expired','cancelled'));
alter table public.membership_offers alter column status set default 'draft';
create index membership_offers_user_idx on public.membership_offers (user_id, status);

-- users may respond to their own non-draft offer; nothing else about it moves
drop trigger if exists trg_protect_membership_offer on public.membership_offers;
drop function if exists public.protect_membership_offer();
create function public.protect_membership_offer()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid());
begin
  if caller is null or public.is_management() then
    if new.status = 'sent' and old.status = 'draft' then
      new.offered_at := now();
    end if;
    if new.status in ('accepted','declined') and old.status not in ('accepted','declined') then
      new.responded_at := now();
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not (
      old.status in ('sent','viewed')
      and new.status in ('viewed','accepted','declined')
    ) then
      raise exception 'this offer cannot be moved to %', new.status;
    end if;
    if new.status = 'accepted'
       and new.expires_at is not null
       and new.expires_at < now() then
      raise exception 'this offer has expired';
    end if;
    if new.status = 'viewed' then
      new.viewed_at := coalesce(new.viewed_at, now());
    else
      new.responded_at := now();
    end if;
  end if;

  if (to_jsonb(new) - 'status' - 'viewed_at' - 'responded_at' - 'updated_at')
     is distinct from (to_jsonb(old) - 'status' - 'viewed_at' - 'responded_at' - 'updated_at') then
    raise exception 'only management can change offer details';
  end if;
  return new;
end;
$$;
create trigger trg_protect_membership_offer
  before update on public.membership_offers
  for each row execute function public.protect_membership_offer();

-- accepting an offer creates the pending membership (and its payment request)
drop trigger if exists trg_apply_offer_acceptance on public.membership_offers;
drop function if exists public.apply_offer_acceptance();
create function public.apply_offer_acceptance()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_membership uuid;
  v_amount     integer;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    if exists (select 1 from public.memberships m where m.offer_id = new.id) then
      return new;
    end if;
    if exists (
      select 1 from public.memberships m
      where m.user_id = new.user_id and m.status in ('pending','verification','active')
    ) then
      raise exception 'this user already has a pending or active membership';
    end if;

    insert into public.memberships (user_id, tier_id, offer_id, status)
    values (new.user_id, new.tier_id, new.id, 'pending')
    returning id into v_membership;

    select coalesce(new.price_cents, t.price_cents) into v_amount
      from public.membership_tiers t where t.id = new.tier_id;
    if coalesce(v_amount, 0) > 0 then
      insert into public.membership_payments (membership_id, user_id, amount_cents, currency, status)
      values (v_membership, new.user_id, v_amount, new.currency, 'pending');
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_apply_offer_acceptance
  after update on public.membership_offers
  for each row execute function public.apply_offer_acceptance();

drop trigger if exists trg_notify_membership_offer on public.membership_offers;
drop function if exists public.notify_membership_offer();
create function public.notify_membership_offer()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status = 'sent' and old.status = 'draft' then
    perform public.notify_user(
      new.user_id, 'membership',
      'Management has sent you a membership offer',
      'Review the offer, its benefits and terms. You can accept or decline it yourself.',
      '/dashboard/membership/offers'
    );
  end if;
  return new;
end;
$$;
create trigger trg_notify_membership_offer
  after update of status on public.membership_offers
  for each row execute function public.notify_membership_offer();

-- RLS: management everything; users read and respond to their own offers
drop policy if exists "membership offers read" on public.membership_offers;
create policy "membership offers read" on public.membership_offers
  for select to authenticated
  using (
    (select public.is_management())
    or (user_id = (select auth.uid()) and status <> 'draft')
  );
drop policy if exists "membership offers write" on public.membership_offers;
create policy "membership offers write" on public.membership_offers
  for insert to authenticated with check ((select public.is_management()));
drop policy if exists "membership offers update" on public.membership_offers;
create policy "membership offers update" on public.membership_offers
  for update to authenticated
  using ((select public.is_management()) or user_id = (select auth.uid()))
  with check ((select public.is_management()) or user_id = (select auth.uid()));
drop policy if exists "membership offers delete" on public.membership_offers;
create policy "membership offers delete" on public.membership_offers
  for delete to authenticated using ((select public.is_management()));

-- ============================================================
-- 6. memberships: activation + expiration dates, payment verification
-- ============================================================
alter table public.memberships rename column started_at to activation_date;
alter table public.memberships rename column expires_at to expiration_date;

alter table public.memberships drop constraint if exists memberships_status_check;
alter table public.memberships add constraint memberships_status_check check (status in
  ('pending','verification','active','paused','cancelled','expired'));

drop sequence if exists public.membership_number_seq;
create sequence public.membership_number_seq start 1;

-- ============================================================
-- 7. membership payment triggers: fill, verify (never auto-active)
-- ============================================================
drop trigger if exists trg_fill_membership_payment_user on public.membership_payments;
drop function if exists public.fill_membership_payment_user();
create function public.fill_membership_payment_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_owner uuid;
begin
  if new.user_id is null then
    select m.user_id into v_owner from public.memberships m where m.id = new.membership_id;
    new.user_id := v_owner;
  end if;
  if new.user_id is null then
    raise exception 'membership payment requires a user';
  end if;
  if new.status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  return new;
end;
$$;
create trigger trg_fill_membership_payment_user
  before insert on public.membership_payments
  for each row execute function public.fill_membership_payment_user();

-- payment confirmed -> membership awaits management verification (never auto-active)
drop trigger if exists trg_apply_membership_payment on public.membership_payments;
drop function if exists public.apply_membership_payment();
create function public.apply_membership_payment()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  if new.status = 'paid' and old.status is distinct from 'paid' then
    update public.memberships m
       set status = 'verification'
     where m.id = new.membership_id and m.status = 'pending';
    perform public.notify_user(
      new.user_id, 'membership',
      'Payment received',
      'Management is verifying your payment. Your membership will be activated after confirmation.',
      '/dashboard/membership'
    );
  end if;
  return new;
end;
$$;
create trigger trg_apply_membership_payment
  before update of status on public.membership_payments
  for each row execute function public.apply_membership_payment();

drop trigger if exists trg_protect_membership_payment on public.membership_payments;
create trigger trg_protect_membership_payment
  before update on public.membership_payments
  for each row execute function public.protect_management_columns(
    'membership_id','user_id','amount_cents','currency','provider','reference','notes');

-- ============================================================
-- 8. membership cards + activation (server-issued, management-gated)
-- ============================================================
create table public.membership_cards (
  id            uuid primary key default gen_random_uuid(),
  membership_id uuid not null unique references public.memberships (id) on delete cascade,
  card_serial   text not null unique,
  issued_at     timestamptz not null default now(),
  revoked_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.membership_cards enable row level security;
create trigger trg_membership_cards_updated_at
  before update on public.membership_cards
  for each row execute function public.set_updated_at();

revoke insert, update, delete on table public.membership_cards from anon, authenticated;

drop policy if exists "membership cards read" on public.membership_cards;
create policy "membership cards read" on public.membership_cards
  for select to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.memberships m
      where m.id = membership_id and m.user_id = (select auth.uid())
    )
  );

drop function if exists public.activate_membership(uuid);
create function public.activate_membership(p_membership_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_row       record;
  v_number    text;
  v_serial    text;
  v_expires   timestamptz;
  v_tier_key  text;
  v_ok        boolean := false;
begin
  if (select auth.role()) = 'anon' then
    raise exception 'only management can activate memberships';
  end if;
  if (select auth.uid()) is not null and not public.is_management() then
    raise exception 'only management can activate memberships';
  end if;

  select m.id, m.status, m.user_id, t.key as tier_key, t."interval" as tier_interval
    into v_row
    from public.memberships m
    join public.membership_tiers t on t.id = m.tier_id
   where m.id = p_membership_id
   for update;
  if not found then
    raise exception 'membership not found';
  end if;
  if v_row.status = 'active' then
    raise exception 'membership is already active';
  end if;
  if v_row.status not in ('pending','verification') then
    raise exception 'membership cannot be activated while %', v_row.status;
  end if;
  if exists (
    select 1 from public.membership_payments p
    where p.membership_id = p_membership_id and p.status in ('pending','processing')
  ) then
    raise exception 'payment must be confirmed before activation';
  end if;

  v_tier_key := upper(regexp_replace(v_row.tier_key, '[^a-zA-Z0-9]+', '-', 'g'));
  v_expires := case v_row.tier_interval
                 when 'monthly'  then now() + interval '1 month'
                 when 'annual'   then now() + interval '1 year'
                 else null
               end;
  v_number := 'GA-' || lpad(nextval('public.membership_number_seq')::text, 6, '0');

  update public.memberships
     set status = 'active',
         activation_date = now(),
         expiration_date = v_expires,
         membership_number = v_number
   where id = p_membership_id;

  for i in 1..16 loop
    v_serial := 'GA-' || v_tier_key || '-' ||
                upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    if not exists (select 1 from public.membership_cards c where c.card_serial = v_serial) then
      v_ok := true;
      exit;
    end if;
  end loop;
  if not v_ok then
    raise exception 'could not generate a unique card serial';
  end if;

  insert into public.membership_cards (membership_id, card_serial)
  values (p_membership_id, v_serial)
  on conflict (membership_id) do update
    set card_serial = excluded.card_serial,
        issued_at = now(),
        revoked_at = null;

  insert into public.audit_logs (actor_id, action, entity, entity_id, metadata)
  values ((select auth.uid()), 'membership.activated', 'membership', p_membership_id::text,
          jsonb_build_object('membership_number', v_number, 'card_serial', v_serial));

  perform public.notify_user(
    v_row.user_id, 'membership',
    'Your membership is active',
    'Your membership card has been issued and is ready to view.',
    '/dashboard/membership/card'
  );

  return jsonb_build_object(
    'membership_id', p_membership_id,
    'membership_number', v_number,
    'card_serial', v_serial,
    'expiration_date', v_expires
  );
end;
$$;
revoke execute on function public.activate_membership(uuid) from public, anon;
grant execute on function public.activate_membership(uuid) to authenticated, service_role;

drop function if exists public.reissue_membership_card(uuid);
create function public.reissue_membership_card(p_membership_id uuid)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_tier_key text;
  v_serial   text;
  v_ok       boolean := false;
  v_status   text;
begin
  if (select auth.role()) = 'anon' then
    raise exception 'only management can reissue cards';
  end if;
  if (select auth.uid()) is not null and not public.is_management() then
    raise exception 'only management can reissue cards';
  end if;

  select t.key, m.status into v_tier_key, v_status
    from public.memberships m
    join public.membership_tiers t on t.id = m.tier_id
   where m.id = p_membership_id
   for update;
  if not found then
    raise exception 'membership not found';
  end if;
  if v_status <> 'active' then
    raise exception 'cards can only be issued for active memberships';
  end if;
  if not exists (select 1 from public.membership_cards c where c.membership_id = p_membership_id) then
    raise exception 'no card on file for this membership';
  end if;

  v_tier_key := upper(regexp_replace(v_tier_key, '[^a-zA-Z0-9]+', '-', 'g'));
  for i in 1..16 loop
    v_serial := 'GA-' || v_tier_key || '-' ||
                upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    if not exists (select 1 from public.membership_cards c where c.card_serial = v_serial) then
      v_ok := true;
      exit;
    end if;
  end loop;
  if not v_ok then
    raise exception 'could not generate a unique card serial';
  end if;

  update public.membership_cards
     set card_serial = v_serial, issued_at = now(), revoked_at = null
   where membership_id = p_membership_id;

  insert into public.audit_logs (actor_id, action, entity, entity_id, metadata)
  values ((select auth.uid()), 'membership_card.reissued', 'membership', p_membership_id::text,
          jsonb_build_object('card_serial', v_serial));

  return v_serial;
end;
$$;
revoke execute on function public.reissue_membership_card(uuid) from public, anon;
grant execute on function public.reissue_membership_card(uuid) to authenticated, service_role;

-- ============================================================
-- 9. experiences catalog: type + membership tier requirement
-- ============================================================
alter table public.experiences
  add column type text not null default 'other',
  add column required_tier_id uuid references public.membership_tiers (id) on delete set null;
alter table public.experiences drop constraint if exists experiences_type_check;
alter table public.experiences add constraint experiences_type_check check (type in (
  'personal_experience','video_communication','voice_message','text_message',
  'virtual_meeting','meet_greet','business_professional','special_occasion','other'));

-- ============================================================
-- 10. re-point proposals / requirements / payments / schedules to requests
--     (policies that referenced experience_requests must go first,
--      then FKs, then the legacy intake table)
-- ============================================================
drop trigger if exists trg_protect_exp_requirements on public.experience_requirements;
drop policy if exists "experience requirements read" on public.experience_requirements;
drop policy if exists "experience requirements write" on public.experience_requirements;
drop policy if exists "experience requirements update" on public.experience_requirements;
drop policy if exists "experience proposals read" on public.experience_proposals;
drop policy if exists "experience proposals write" on public.experience_proposals;
drop policy if exists "experience schedules read" on public.experience_schedules;
drop policy if exists "experience schedules write" on public.experience_schedules;
drop policy if exists "experience payments read" on public.experience_payments;
drop policy if exists "experience payments write" on public.experience_payments;

do $$
declare c record;
begin
  for c in
    select con.conname, con.conrelid
      from pg_constraint con
      join pg_attribute a
        on a.attrelid = con.conrelid and a.attnum = any (con.conkey)
     where con.contype = 'f'
       and con.confrelid = 'public.experience_requests'::regclass
  loop
    execute format('alter table %s drop constraint %I', c.conrelid::regclass::text, c.conname);
  end loop;
end $$;

alter table public.experience_requirements rename column experience_request_id to request_id;
alter table public.experience_proposals  rename column experience_request_id to request_id;
alter table public.experience_payments   rename column experience_request_id to request_id;
alter table public.experience_schedules  rename column experience_request_id to request_id;

alter table public.experience_requirements
  add constraint experience_requirements_request_fkey
  foreign key (request_id) references public.requests (id) on delete cascade;
alter table public.experience_proposals
  add constraint experience_proposals_request_fkey
  foreign key (request_id) references public.requests (id) on delete cascade;
alter table public.experience_payments
  add constraint experience_payments_request_fkey
  foreign key (request_id) references public.requests (id) on delete cascade;
alter table public.experience_schedules
  add constraint experience_schedules_request_fkey
  foreign key (request_id) references public.requests (id) on delete cascade;

-- legacy parallel intake removed: `requests` is the single experience pipeline
drop table if exists public.experience_requests;

-- experience payments schema (before the proposal trigger that inserts them)
alter table public.experience_payments
  add column user_id uuid references auth.users (id) on delete cascade,
  add column notes text;
alter table public.experience_payments rename column provider_ref to reference;
alter table public.experience_payments alter column request_id set not null;

alter table public.experience_payments drop constraint if exists experience_payments_status_check;
alter table public.experience_payments add constraint experience_payments_status_check check (status in
  ('pending','processing','paid','failed','refunded','cancelled'));

-- ============================================================
-- 11. requirements: management writes, users respond
-- ============================================================
alter table public.experience_requirements
  add column category text not null default 'other'
    check (category in (
      'membership_tier','availability','location','age','documents','dress',
      'arrival_instructions','participants','payment','special_conditions','other'));

drop function if exists public.protect_experience_requirement();
create function public.protect_experience_requirement()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid());
begin
  if caller is null or public.is_management() then
    if new.response is distinct from old.response
       and new.responded_at is null then
      new.responded_at := now();
    end if;
    return new;
  end if;
  if (to_jsonb(new) - 'response' - 'responded_at' - 'updated_at')
     is distinct from (to_jsonb(old) - 'response' - 'responded_at' - 'updated_at') then
    raise exception 'only management can change requirements';
  end if;
  if new.response is distinct from old.response and new.response is not null then
    new.responded_at := now();
  end if;
  return new;
end;
$$;
create trigger trg_protect_exp_requirements
  before update on public.experience_requirements
  for each row execute function public.protect_experience_requirement();

create policy "experience requirements read" on public.experience_requirements
  for select to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.requests r
      where r.id = request_id and r.user_id = (select auth.uid())
    )
  );
create policy "experience requirements insert" on public.experience_requirements
  for insert to authenticated with check ((select public.is_management()));
create policy "experience requirements update" on public.experience_requirements
  for update to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.requests r
      where r.id = request_id and r.user_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_management())
    or exists (
      select 1 from public.requests r
      where r.id = request_id and r.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- 12. proposals: management drafts and sends, users respond
-- ============================================================
alter table public.experience_proposals
  add column proposed_date date,
  add column proposed_time text,
  add column location text,
  add column duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  add column participants text,
  add column notes text,
  add column viewed_at timestamptz,
  add column expires_at timestamptz;
alter table public.experience_proposals drop constraint if exists experience_proposals_status_check;
alter table public.experience_proposals add constraint experience_proposals_status_check check (status in (
  'draft','sent','viewed','accepted','declined','expired','cancelled'));

drop function if exists public.protect_experience_proposal();
create function public.protect_experience_proposal()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid());
begin
  if caller is null or public.is_management() then
    if new.status = 'sent' and old.status = 'draft' then
      new.sent_at := coalesce(new.sent_at, now());
    end if;
    if new.status = 'viewed' and old.status in ('sent','viewed') then
      new.viewed_at := coalesce(new.viewed_at, now());
    end if;
    if new.status in ('accepted','declined') and old.status not in ('accepted','declined') then
      new.responded_at := now();
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not (
      old.status in ('sent','viewed')
      and new.status in ('viewed','accepted','declined')
    ) then
      raise exception 'this proposal cannot be moved to %', new.status;
    end if;
    if new.status = 'accepted'
       and new.expires_at is not null
       and new.expires_at < now() then
      raise exception 'this proposal has expired';
    end if;
    if new.status = 'viewed' then
      new.viewed_at := coalesce(new.viewed_at, now());
    else
      new.responded_at := now();
    end if;
  end if;

  if (to_jsonb(new) - 'status' - 'viewed_at' - 'responded_at' - 'sent_at' - 'updated_at')
     is distinct from (to_jsonb(old) - 'status' - 'viewed_at' - 'responded_at' - 'sent_at' - 'updated_at') then
    raise exception 'only management can change proposal details';
  end if;
  return new;
end;
$$;
create trigger trg_protect_exp_proposal
  before update on public.experience_proposals
  for each row execute function public.protect_experience_proposal();

-- proposal lifecycle drives the request + its payment, atomically
drop function if exists public.apply_proposal_response();
create function public.apply_proposal_response()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_request record;
begin
  select id, user_id, status into v_request
    from public.requests where id = new.request_id;

  if new.status = 'sent' and old.status = 'draft' then
    update public.requests
       set status = 'proposal'
     where id = new.request_id
       and status in ('submitted','in_review','information_requested');
    perform public.notify_user(
      v_request.user_id, 'experience',
      'Management sent you a proposal',
      'Review the dates, requirements and price, then accept or decline.',
      '/dashboard/experiences/' || new.request_id
    );
  end if;

  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    update public.requests
       set status = 'payment_required'
     where id = new.request_id and status = 'proposal';
    if new.amount_cents is not null and new.amount_cents > 0
       and not exists (
         select 1 from public.experience_payments p where p.proposal_id = new.id
       ) then
      insert into public.experience_payments (request_id, proposal_id, user_id, amount_cents, currency, status)
      values (new.request_id, new.id, v_request.user_id, new.amount_cents, new.currency, 'pending');
      perform public.notify_user(
        v_request.user_id, 'experience',
        'Payment required for your experience',
        'Management will confirm the payment method. Your experience is confirmed after payment is verified.',
        '/dashboard/experiences/' || new.request_id
      );
    end if;
  end if;

  if new.status = 'declined' and old.status is distinct from 'declined' then
    update public.requests
       set status = 'cancelled'
     where id = new.request_id and status = 'proposal';
  end if;
  return new;
end;
$$;
create trigger trg_apply_proposal_response
  after update of status on public.experience_proposals
  for each row execute function public.apply_proposal_response();

create policy "experience proposals read" on public.experience_proposals
  for select to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.requests r
      where r.id = request_id and r.user_id = (select auth.uid())
    )
  );
create policy "experience proposals insert" on public.experience_proposals
  for insert to authenticated with check ((select public.is_management()));
create policy "experience proposals update" on public.experience_proposals
  for update to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.requests r
      where r.id = request_id and r.user_id = (select auth.uid())
    )
  )
  with check (
    (select public.is_management())
    or exists (
      select 1 from public.requests r
      where r.id = request_id and r.user_id = (select auth.uid())
    )
  );
create policy "experience proposals delete" on public.experience_proposals
  for delete to authenticated using ((select public.is_management()));

-- ============================================================
-- 13. experience payment triggers: fill, record, guard
-- ============================================================
drop trigger if exists trg_fill_experience_payment_user on public.experience_payments;
drop function if exists public.fill_experience_payment_user();
create function public.fill_experience_payment_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare v_owner uuid;
begin
  if new.user_id is null then
    select r.user_id into v_owner from public.requests r where r.id = new.request_id;
    new.user_id := v_owner;
  end if;
  if new.user_id is null then
    raise exception 'experience payment requires a user';
  end if;
  if new.status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  return new;
end;
$$;
create trigger trg_fill_experience_payment_user
  before insert on public.experience_payments
  for each row execute function public.fill_experience_payment_user();

drop trigger if exists trg_apply_experience_payment on public.experience_payments;
drop trigger if exists trg_notify_experience_payment on public.experience_payments;
drop function if exists public.apply_experience_payment();
drop function if exists public.notify_experience_payment();
create function public.apply_experience_payment()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  if new.status = 'paid' and old.status is distinct from 'paid' then
    perform public.notify_user(
      new.user_id, 'experience',
      'Payment received',
      'Management is verifying your payment and will confirm your experience next.',
      '/dashboard/experiences/' || new.request_id
    );
  end if;
  return new;
end;
$$;
create trigger trg_apply_experience_payment
  before update of status on public.experience_payments
  for each row execute function public.apply_experience_payment();

drop trigger if exists trg_protect_experience_payment on public.experience_payments;
create trigger trg_protect_experience_payment
  before update on public.experience_payments
  for each row execute function public.protect_management_columns(
    'request_id','proposal_id','user_id','amount_cents','currency','provider','reference','notes');

create policy "experience payments read" on public.experience_payments
  for select to authenticated
  using (
    (select public.is_management())
    or exists (
      select 1 from public.requests r
      where r.id = request_id and r.user_id = (select auth.uid())
    )
  );
create policy "experience payments insert" on public.experience_payments
  for insert to authenticated with check ((select public.is_management()));
create policy "experience payments update" on public.experience_payments
  for update to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));

-- ============================================================
-- 14. schedules: management-only (internal notes, links)
-- ============================================================
alter table public.experience_schedules
  add column timezone text not null default 'UTC',
  add column virtual_link text,
  add column meeting_instructions text,
  add column internal_notes text;

create policy "experience schedules read" on public.experience_schedules
  for select to authenticated using ((select public.is_management()));
create policy "experience schedules write" on public.experience_schedules
  for all to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));

-- ============================================================
-- 15. appointments: user-visible confirmed bookings
-- ============================================================
alter table public.appointments
  add column request_id uuid references public.requests (id) on delete set null,
  add column timezone text not null default 'UTC',
  add column virtual_link text,
  add column meeting_instructions text;
create index appointments_request_idx on public.appointments (request_id);

drop policy if exists "appointments insert" on public.appointments;
create policy "appointments insert" on public.appointments
  for insert to authenticated with check ((select public.is_management()));
drop policy if exists "appointments update" on public.appointments;
create policy "appointments update" on public.appointments
  for update to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));

drop trigger if exists trg_protect_appointment on public.appointments;
create trigger trg_protect_appointment
  before update on public.appointments
  for each row execute function public.protect_management_columns(
    'request_id','timezone','virtual_link','meeting_instructions','user_id','created_by');

-- ============================================================
-- 16. availability blocks: management planning only
-- ============================================================
create table public.availability_blocks (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  kind       text not null default 'blocked' check (kind in ('blocked','available')),
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  timezone   text not null default 'UTC',
  note       text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
alter table public.availability_blocks enable row level security;
create index availability_blocks_range_idx on public.availability_blocks (starts_at, ends_at);
create trigger trg_availability_blocks_updated_at
  before update on public.availability_blocks
  for each row execute function public.set_updated_at();
revoke insert, update, delete on table public.availability_blocks from anon;

-- no user policies at all: management only
drop policy if exists "availability blocks all" on public.availability_blocks;
create policy "availability blocks all" on public.availability_blocks
  for all to authenticated
  using ((select public.is_management())) with check ((select public.is_management()));

-- ============================================================
-- 17. schedule_experience: atomic booking (appointment + schedule + status)
-- ============================================================
drop function if exists public.schedule_experience(uuid, text, timestamptz, timestamptz, text, text, text, text);
create function public.schedule_experience(
  p_request_id           uuid,
  p_title                text,
  p_starts_at            timestamptz,
  p_ends_at              timestamptz,
  p_timezone             text default 'UTC',
  p_location             text default null,
  p_virtual_link         text default null,
  p_meeting_instructions text default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_request     record;
  v_appointment uuid;
begin
  if (select auth.role()) = 'anon' then
    raise exception 'only management can schedule experiences';
  end if;
  if (select auth.uid()) is not null and not public.is_management() then
    raise exception 'only management can schedule experiences';
  end if;
  if p_ends_at <= p_starts_at then
    raise exception 'schedule end must be after start';
  end if;

  select id, user_id, status, experience_id into v_request
    from public.requests
   where id = p_request_id
   for update;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status <> 'confirmed' then
    raise exception 'experience must be confirmed before scheduling';
  end if;

  insert into public.appointments (
    user_id, title, location, starts_at, ends_at, status,
    created_by, request_id, timezone, virtual_link, meeting_instructions
  ) values (
    v_request.user_id, p_title, p_location, p_starts_at, p_ends_at, 'confirmed',
    (select auth.uid()), p_request_id, coalesce(p_timezone, 'UTC'),
    p_virtual_link, p_meeting_instructions
  )
  returning id into v_appointment;

  insert into public.experience_schedules (
    experience_id, request_id, title, location, starts_at, ends_at,
    status, timezone, virtual_link, meeting_instructions
  ) values (
    v_request.experience_id, p_request_id, p_title, p_location,
    p_starts_at, p_ends_at,
    'scheduled', coalesce(p_timezone, 'UTC'), p_virtual_link, p_meeting_instructions
  );

  update public.requests set status = 'scheduled' where id = p_request_id;

  insert into public.audit_logs (actor_id, action, entity, entity_id, metadata)
  values ((select auth.uid()), 'experience.scheduled', 'request', p_request_id::text,
          jsonb_build_object('appointment_id', v_appointment, 'starts_at', p_starts_at));

  perform public.notify_user(
    v_request.user_id, 'experience',
    'Your experience is scheduled',
    'The date, time and meeting details are now visible in your experiences.',
    '/dashboard/experiences/' || p_request_id
  );

  return jsonb_build_object('appointment_id', v_appointment, 'request_id', p_request_id);
end;
$$;
revoke execute on function public.schedule_experience(uuid, text, timestamptz, timestamptz, text, text, text, text)
  from public, anon;
grant execute on function public.schedule_experience(uuid, text, timestamptz, timestamptz, text, text, text, text)
  to authenticated, service_role;

-- ============================================================
-- 18. user-visible notifications on the request lifecycle
-- ============================================================
drop trigger if exists trg_notify_request_status on public.requests;
drop function if exists public.notify_request_status();
create function public.notify_request_status()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'confirmed' then
      perform public.notify_user(
        new.user_id, 'experience', 'Your experience is confirmed',
        'Management has confirmed your experience. Scheduling details will follow.',
        '/dashboard/experiences/' || new.id);
    elsif new.status = 'declined' and old.status not in ('declined','cancelled') then
      perform public.notify_user(
        new.user_id, 'experience', 'Management could not proceed',
        'Management has declined this request. You are welcome to send a new one.',
        '/dashboard/experiences/' || new.id);
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_notify_request_status
  after update of status on public.requests
  for each row execute function public.notify_request_status();

-- ============================================================
-- 19. payment provider configuration (abstracted, CMS-configurable)
-- ============================================================
insert into public.site_settings (key, value, is_public)
values (
  'payment_settings',
  '{
    "provider": "manual",
    "label": "Managed payment",
    "instructions": "Management will confirm the accepted payment method for your membership or experience. Never send card numbers, CVVs or passwords through this platform."
  }'::jsonb,
  true
)
on conflict (key) do nothing;

-- ============================================================
-- 20. realtime for lifecycle changes users watch
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'membership_offers','memberships','membership_cards','membership_payments',
    'experience_proposals','experience_payments','appointments'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ============================================================
-- 21. verification (fails the migration loudly if incomplete)
-- ============================================================
do $$
declare ok int; t text;
begin
  if exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = 'experience_requests'
  ) then
    raise exception 'legacy experience_requests should be dropped';
  end if;

  select count(*) into ok from information_schema.columns
   where table_schema = 'public' and table_name = 'membership_offers'
     and column_name in ('user_id','price_cents','currency','message','benefits','terms','viewed_at');
  if ok <> 7 then raise exception 'membership offer columns: expected 7, got %', ok; end if;
  if (select is_nullable from information_schema.columns
       where table_schema='public' and table_name='membership_offers' and column_name='user_id') <> 'NO'
  then raise exception 'membership_offers.user_id must be NOT NULL'; end if;

  select count(*) into ok from information_schema.columns
   where table_schema = 'public' and table_name = 'membership_cards';
  if ok <> 7 then raise exception 'membership_cards columns: expected 7, got %', ok; end if;
  if has_column_privilege('authenticated', 'public.membership_cards', 'card_serial', 'INSERT') then
    raise exception 'authenticated must not insert membership cards';
  end if;
  if has_column_privilege('authenticated', 'public.membership_cards', 'card_serial', 'UPDATE') then
    raise exception 'authenticated must not update membership cards';
  end if;

  if (select relrowsecurity from pg_class where oid = 'public.availability_blocks'::regclass) is not true then
    raise exception 'availability_blocks RLS not enabled';
  end if;
  if exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'availability_blocks'
       and qual not like '%is_management%'
  ) then raise exception 'availability_blocks must be management-only'; end if;

  foreach t in array array['requests_status_check','request_events_event_type_check',
                           'experience_proposals_status_check','membership_payments_status_check',
                           'experience_payments_status_check','memberships_status_check',
                           'membership_offers_status_check'] loop
    if not exists (select 1 from pg_constraint where conname = t) then
      raise exception 'constraint % missing', t;
    end if;
  end loop;

  if not exists (
    select 1 from pg_constraint where conname = 'requests_status_check'
      and pg_get_constraintdef(oid) like '%payment_required%'
  ) then raise exception 'requests status check missing payment_required'; end if;
  if not exists (
    select 1 from pg_constraint where conname = 'requests_status_check'
      and pg_get_constraintdef(oid) like '%confirmed%'
  ) then raise exception 'requests status check missing confirmed'; end if;
  if not exists (
    select 1 from pg_constraint where conname = 'request_events_event_type_check'
      and pg_get_constraintdef(oid) like '%proposal_accepted%'
  ) then raise exception 'request events check missing proposal_accepted'; end if;

  foreach t in array array['activate_membership','reissue_membership_card','schedule_experience','notify_user'] loop
    if not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = t
    ) then
      raise exception 'function % missing', t;
    end if;
  end loop;

  if has_function_privilege('anon', 'public.activate_membership(uuid)', 'EXECUTE') then
    raise exception 'anon must not execute activate_membership';
  end if;
  if not has_function_privilege('authenticated', 'public.activate_membership(uuid)', 'EXECUTE') then
    raise exception 'authenticated must be able to execute activate_membership';
  end if;
  if has_function_privilege('authenticated', 'public.notify_user(uuid,text,text,text,text)', 'EXECUTE') then
    raise exception 'notify_user must stay internal';
  end if;

  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='experience_schedules'
      and cmd = 'SELECT' and qual not like '%is_management%'
  ) then raise exception 'experience schedules must not be user-readable'; end if;

  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='memberships' and column_name='activation_date'
  ) then raise exception 'memberships.activation_date missing'; end if;
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='memberships' and column_name='expiration_date'
  ) then raise exception 'memberships.expiration_date missing'; end if;
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='experience_proposals' and column_name='viewed_at'
  ) then raise exception 'experience_proposals.viewed_at missing'; end if;
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='requests' and column_name='experience_id'
  ) then raise exception 'requests.experience_id missing'; end if;
  if exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='membership_tiers' and column_name='is_active'
  ) then raise exception 'membership_tiers.is_active should be gone'; end if;
  if not exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='membership_tiers' and column_name='status'
  ) then raise exception 'membership_tiers.status missing'; end if;

  raise notice 'membership + experience lifecycle migration complete';
end $$;
