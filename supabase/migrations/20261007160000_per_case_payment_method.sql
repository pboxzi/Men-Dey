-- Manual payments are arranged per case: each proposal and membership offer now
-- carries the method and instructions the admin chose when sending it, so the
-- member sees the exact details for their own payment instead of one global
-- text. Empty values fall back to the account default in site_settings.

alter table public.experience_proposals
  add column if not exists payment_provider text,
  add column if not exists payment_instructions text;

alter table public.experience_proposals drop constraint if exists experience_proposals_payment_provider_check;
alter table public.experience_proposals
  add constraint experience_proposals_payment_provider_check
  check (payment_provider is null or payment_provider in ('manual', 'bank_transfer', 'stripe', 'paypal'));

alter table public.membership_offers
  add column if not exists payment_provider text,
  add column if not exists payment_instructions text;

alter table public.membership_offers drop constraint if exists membership_offers_payment_provider_check;
alter table public.membership_offers
  add constraint membership_offers_payment_provider_check
  check (payment_provider is null or payment_provider in ('manual', 'bank_transfer', 'stripe', 'paypal'));
