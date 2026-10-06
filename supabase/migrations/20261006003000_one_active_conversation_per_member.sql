-- One active conversation per member.
--
-- "Talk to management" used to trust client-side state before inserting, so a
-- stale tab could create a second open thread for the same fan. Close the
-- older duplicates (history is kept, never deleted) and enforce a single
-- active conversation per member in the database, where it cannot be raced.

with ranked as (
  select id,
         row_number() over (
           partition by user_id
           order by updated_at desc, created_at desc, id desc
         ) as rn
  from public.management_conversations
  where status <> 'closed'
)
update public.management_conversations c
set status = 'closed',
    updated_at = greatest(c.updated_at, now())
from ranked r
where c.id = r.id
  and r.rn > 1;

create unique index if not exists management_conversations_one_active_per_member
  on public.management_conversations (user_id)
  where status <> 'closed';
