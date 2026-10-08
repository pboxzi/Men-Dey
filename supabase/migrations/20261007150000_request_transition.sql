-- Management lifecycle transitions were two statements: update requests (the
-- SECURITY DEFINER timeline trigger writes the event) followed by a direct
-- request_events insert carrying the member-facing note — but authenticated has
-- no INSERT grant on request_events, so approve / confirm / decline / complete
-- failed with "permission denied for table request_events". One definer
-- function moves the status and attaches the note to the event the trigger
-- just wrote (or appends a fresh event when the status did not change, e.g. a
-- revised proposal), so no grants are loosened and no timeline duplicates.

create or replace function public.transition_request(
  p_request_id uuid,
  p_next       text,
  p_note       text default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_old  text;
  v_event text;
begin
  if not (select public.is_management()) then
    raise exception 'only management can move requests through the lifecycle';
  end if;
  if p_next not in (
    'in_review','information_requested','proposal','payment_required',
    'confirmed','approved','scheduled','completed','declined','cancelled'
  ) then
    raise exception 'invalid request status';
  end if;

  select status into v_old
    from public.requests
   where id = p_request_id;
  if not found then
    raise exception 'request not found';
  end if;

  update public.requests
     set status = p_next,
         resolved_at = case when p_next = 'completed' then now() else resolved_at end,
         updated_at = now()
   where id = p_request_id;

  if p_note is not null and p_note <> '' then
    v_event := case p_next
      when 'in_review'             then 'review_started'
      when 'information_requested' then 'information_requested'
      when 'proposal'              then 'proposal_created'
      when 'payment_required'      then 'proposal_accepted'
      else p_next
    end;
    if v_old is distinct from p_next then
      update public.request_events
         set note = p_note
       where id = (
         select e.id
           from public.request_events e
          where e.request_id = p_request_id
            and e.event_type = v_event
          order by e.created_at desc
          limit 1
       );
    else
      insert into public.request_events (request_id, actor_id, event_type, note)
      values (p_request_id, (select auth.uid()), v_event, p_note);
    end if;
  end if;
end;
$$;

revoke execute on function public.transition_request(uuid, text, text) from public, anon;
grant execute on function public.transition_request(uuid, text, text) to authenticated, service_role;
