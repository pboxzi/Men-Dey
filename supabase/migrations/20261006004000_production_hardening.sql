-- Production hardening: request status machine, money guards, function surface.
--
-- 1. Client-driven request status changes must follow the lifecycle.
--    submitted -> in_review -> proposal -> payment_required -> confirmed
--              -> scheduled -> completed, with information_requested,
--              approved, declined and cancelled branching off.
--    Server-side actors (service role, cron, migrations) run without a JWT
--    and stay unrestricted so operations tooling keeps working.
--
-- 2. Money columns reject negative amounts at the database.
--
-- 3. Functions a browser client may execute are narrowed to the frontend
--    RPC allowlist plus the helpers the RLS policies rely on.

-- ------------------------------------------------------------
-- 1. Status machine
-- ------------------------------------------------------------
create or replace function public.protect_request_status()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  allowed jsonb := jsonb_build_object(
    'submitted',           jsonb_build_array('in_review','information_requested','proposal','declined','cancelled'),
    'in_review',           jsonb_build_array('information_requested','proposal','payment_required','declined','cancelled'),
    'information_requested', jsonb_build_array('in_review','proposal','declined','cancelled'),
    'proposal',            jsonb_build_array('payment_required','declined','cancelled'),
    'payment_required',    jsonb_build_array('confirmed','approved','declined','cancelled'),
    'confirmed',           jsonb_build_array('approved','scheduled','completed','declined','cancelled'),
    'approved',            jsonb_build_array('scheduled','completed','declined','cancelled'),
    'scheduled',           jsonb_build_array('completed','declined','cancelled'),
    'completed',           jsonb_build_array(),
    'declined',            jsonb_build_array(),
    'cancelled',           jsonb_build_array()
  );
begin
  if new.status is distinct from old.status then
    if (select auth.uid()) is not null then
      if not public.is_management() then
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
      if not (allowed ? old.status) or not (allowed -> old.status ? new.status) then
        raise exception 'invalid request status transition: % -> %', old.status, new.status;
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

-- ------------------------------------------------------------
-- 2. Money guards
-- ------------------------------------------------------------
alter table public.membership_tiers
  drop constraint if exists membership_tiers_price_non_negative;
alter table public.membership_tiers
  add constraint membership_tiers_price_non_negative check (price_cents >= 0);

alter table public.membership_offers
  drop constraint if exists membership_offers_price_non_negative;
alter table public.membership_offers
  add constraint membership_offers_price_non_negative check (price_cents >= 0);

alter table public.membership_payments
  drop constraint if exists membership_payments_amount_non_negative;
alter table public.membership_payments
  add constraint membership_payments_amount_non_negative check (amount_cents >= 0);

alter table public.experience_payments
  drop constraint if exists experience_payments_amount_non_negative;
alter table public.experience_payments
  add constraint experience_payments_amount_non_negative check (amount_cents >= 0);

alter table public.experience_proposals
  drop constraint if exists experience_proposals_amount_non_negative;
alter table public.experience_proposals
  add constraint experience_proposals_amount_non_negative check (amount_cents >= 0);

-- ------------------------------------------------------------
-- 3. Executable function surface
-- ------------------------------------------------------------
-- Event trigger helper: never callable from a request.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Admin RPC: authenticated only, internally gated by is_admin().
revoke execute on function public.admin_set_user_role(uuid, text) from public, anon;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
