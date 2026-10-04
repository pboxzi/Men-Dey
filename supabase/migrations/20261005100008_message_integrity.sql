-- ============================================================
-- Gillian Anderson Management — message integrity & request immutability
-- ============================================================
-- Found by the live user-experience smoke test:
--   * management_messages still carried the public schema's default
--     table-level UPDATE grant, which made the read_at column grant
--     meaningless — an authenticated user could rewrite message bodies.
--   * the messages insert policy did not stop a user from sending a
--     message flagged is_internal (it would reach management as a staff
--     note the user could never see themselves).
--   * requests were only partly immutable for non-management users.
--   * management_conversations.assigned_to had no management-only guard.

-- ------------------------------------------------------------
-- 1. messages: revoke everything, re-grant read_at only
--    (the "conversation messages mark read" policy still scopes rows
--    to the user's own conversation)
-- ------------------------------------------------------------
revoke update, delete on table public.management_messages from anon, authenticated;
grant update (read_at) on table public.management_messages to authenticated;

-- ------------------------------------------------------------
-- 2. messages insert: users can never flag a message internal
-- ------------------------------------------------------------
drop policy if exists "conversation messages insert" on public.management_messages;
create policy "conversation messages insert" on public.management_messages
  for insert to authenticated
  with check (
    (select public.is_management())
    or (
      sender_id = (select auth.uid())
      and is_internal is false
      and exists (
        select 1 from public.management_conversations c
        where c.id = conversation_id and c.user_id = (select auth.uid())
      )
    )
  );

-- ------------------------------------------------------------
-- 3. requests: every column except status is immutable for users
--    (status transitions remain governed by protect_request_status;
--    null auth.uid() = trusted service role / SQL, same convention)
-- ------------------------------------------------------------
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
    new.created_at, new.submitted_at
  ) is distinct from row(
    old.title, old.type, old.priority, old.description,
    old.preferred_date, old.preferred_time, old.location,
    old.participants, old.contact_method, old.additional_requirements,
    old.created_at, old.submitted_at
  ) then
    raise exception 'only management can change request details';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_request_content on public.requests;
create trigger trg_protect_request_content
  before update on public.requests
  for each row execute function public.protect_request_content();

-- ------------------------------------------------------------
-- 4. conversations: assigned_to is management's, like on requests
-- ------------------------------------------------------------
drop trigger if exists trg_protect_conversation_assignee on public.management_conversations;
create trigger trg_protect_conversation_assignee
  before update on public.management_conversations
  for each row execute function public.protect_management_columns('assigned_to');

-- ------------------------------------------------------------
-- 5. verification (fails the migration if anything is off)
-- ------------------------------------------------------------
do $$
begin
  if has_column_privilege('authenticated', 'public.management_messages', 'body', 'UPDATE') then
    raise exception 'management_messages.body is still updatable';
  end if;
  if has_column_privilege('authenticated', 'public.management_messages', 'attachments', 'UPDATE') then
    raise exception 'management_messages.attachments is still updatable';
  end if;
  if not has_column_privilege('authenticated', 'public.management_messages', 'read_at', 'UPDATE') then
    raise exception 'read_at update grant missing';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.requests'::regclass
      and tgname = 'trg_protect_request_content'
      and not tgisinternal
  ) then
    raise exception 'trg_protect_request_content missing';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.management_conversations'::regclass
      and tgname = 'trg_protect_conversation_assignee'
      and not tgisinternal
  ) then
    raise exception 'trg_protect_conversation_assignee missing';
  end if;
end $$;
