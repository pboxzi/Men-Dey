-- ============================================================
-- Gillian Anderson Management · Warmer acknowledgement copy
-- The eight required topics stay intact; the language now reads
-- like a welcome from the office rather than a wall of rules.
-- Version 1 is edited in place while nobody has accepted it;
-- otherwise a new published version supersedes it (same rule as
-- Foundation 6, so already-stored acknowledgements stay valid).
-- ============================================================

do $$
declare
  v_has_acks boolean;
  v_content  text;
  v_title    text;
  v_next     integer;
begin
  v_title := 'How this space works';

  v_content := $ack$
Thank you for being here — we are genuinely glad you found us. Please read this
before creating your account: it explains how this space works, and how we look
after you.

1. A personal, carefully managed space
Gillian Anderson Management is a personal platform, looked after by a small
management team. Creating an account opens the door and begins your
application. It does not by itself grant access to Gillian Anderson, and it
does not guarantee membership, a reply to every request, or a place in any
experience — those things are arranged personally, one by one.

2. Management is always the bridge
Every message, request, membership decision and experience passes through the
management team. Nothing happens automatically between you and Gillian, and
that is deliberate: it keeps things respectful, considered and safe for
everyone, including her.

3. Your privacy, protected
What you share is used only to understand and manage your requests, membership
and experiences. Your details, documents and conversations stay private and
are visible only to you and to management. Nothing is published, and nothing
you write is used for public fan or social features.

4. Membership by application and review
Membership starts with an application and a review by management. Approval is
at management's discretion and may occasionally be declined — always kindly,
and without obligation to give reasons. Membership is never purchased or
switched on automatically when you create an account, and benefits begin only
with an offer you choose to accept through management.

5. Experiences, one at a time
Experiences are proposed, reviewed, scheduled and confirmed individually by
management. Showing interest is a wonderful first step — but it is not a
booking, reservation or commitment of any kind until management confirms it.

6. Gillian's availability
Gillian's availability can never be promised. Nothing here should be read as a
guarantee of timing, response time or outcome. Dates, participation and terms
exist only once management has confirmed them in writing.

7. Kind, considered communication
All correspondence flows through the management team, and response times vary.
We ask for professional, courteous communication in return — this is a managed
office rather than a social network, fan community or public feed, and that is
what keeps it special.

8. Before you continue
By continuing you confirm that you have read, understood and accepted this
acknowledgement in full, of your own accord, before creating your account. A
record of the version you accepted is stored with your account. Thank you,
truly, for taking the time.
$ack$;

  select exists (select 1 from public.acknowledgements) into v_has_acks;
  select coalesce(max(version), 0) + 1 into v_next
    from public.acknowledgement_versions;

  if not v_has_acks then
    update public.acknowledgement_versions
       set content = v_content,
           title = v_title,
           updated_at = now()
     where is_active;
  else
    update public.acknowledgement_versions set is_active = false where is_active;
    insert into public.acknowledgement_versions (version, title, content, is_active, published_at)
    values (v_next, v_title, v_content, true, now())
    on conflict (version) do update
      set content = excluded.content,
          title = excluded.title,
          is_active = true,
          published_at = now(),
          updated_at = now();
  end if;
end $$;

-- ------------------------------------------------------------
-- Verification
-- ------------------------------------------------------------
select 'active_ack' as check,
       (select count(*)::text from public.acknowledgement_versions
         where is_active and published_at is not null) as detail
union all
select 'warm_copy',
       (select count(*)::text from public.acknowledgement_versions
         where is_active and content like '%8. Before you continue%');
