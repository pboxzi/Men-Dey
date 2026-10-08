-- Payment reporting: the member can report an off-platform payment as sent.
-- The row moves pending -> processing (still "open" for every activation/confirmation
-- guard), management receives an in-app notification, and only management with
-- payments.manage can verify 'paid'. The member can never mark a payment paid.

alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (type in (
    'new_message','request_update','information_required','membership_offer',
    'membership_accepted','payment_requested','payment_received','payment_reported',
    'membership_activated','experience_proposal','experience_confirmed',
    'experience_scheduled','experience_cancelled','document_uploaded',
    'management_announcement','system',
    'info','request','membership','experience','account'));

create or replace function public.report_payment_sent(
  p_payment_id uuid,
  p_table      text default 'membership_payments'
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_status   text;
  v_owner    uuid;
  v_amount   integer;
  v_currency text;
  v_label    text;
  v_staff    uuid;
begin
  if p_table not in ('membership_payments', 'experience_payments') then
    raise exception 'unknown payment table';
  end if;

  if p_table = 'membership_payments' then
    select status, user_id, amount_cents, currency
      into v_status, v_owner, v_amount, v_currency
      from public.membership_payments
     where id = p_payment_id;
    v_label := 'Membership payment';
  else
    select status, user_id, amount_cents, currency
      into v_status, v_owner, v_amount, v_currency
      from public.experience_payments
     where id = p_payment_id;
    v_label := 'Experience payment';
  end if;

  if not found then
    raise exception 'payment not found';
  end if;
  if v_owner is distinct from (select auth.uid()) then
    raise exception 'this payment does not belong to you';
  end if;
  if v_status <> 'pending' then
    raise exception 'this payment has already been reported';
  end if;

  if p_table = 'membership_payments' then
    update public.membership_payments
       set status = 'processing', updated_at = now()
     where id = p_payment_id;
  else
    update public.experience_payments
       set status = 'processing', updated_at = now()
     where id = p_payment_id;
  end if;

  for v_staff in
    select p.id
      from public.profiles p
     where p.role in ('management', 'admin')
       and p.status = 'active'
  loop
    perform public.notify_user(
      v_staff,
      'payment_reported',
      'Member reported a payment sent',
      v_label || ' of ' || v_currency || ' ' || round(v_amount / 100.0, 2)
        || ' was reported as sent. Verify it on the payments page.',
      '/management/payments',
      'payment-report:' || p_payment_id::text || ':' || v_staff::text
    );
  end loop;
end;
$$;

revoke execute on function public.report_payment_sent(uuid, text) from public, anon;
grant execute on function public.report_payment_sent(uuid, text) to authenticated, service_role;
