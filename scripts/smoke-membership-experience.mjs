// Live smoke test for the membership + experience lifecycle (real Supabase).
//
// Core rule under test: account ≠ membership, and nothing activates or
// confirms itself. Management creates offers, the member accepts, the payment
// is recorded (never auto-active), management verifies and activates through
// the server-issued card RPC. Experiences run on `requests`: proposal →
// payment required → confirmed → scheduled → completed, with every guard
// verified from both sides (member and management).
//
// Cleanup removes both users and every row created here; no emails are sent.

import {createClient} from '@supabase/supabase-js';
import {readFileSync} from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const url = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

const admin = createClient(url, serviceKey, {auth: {persistSession: false}});
const checks = [];
const ok = (name, pass, detail = '') => {
  checks.push({name, pass});
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`);
};

const stamp = Date.now();
const ackAt = new Date(Date.now() - 60_000).toISOString();
const tierKey = `SMOKE${stamp}`.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 12);

let memberUser = null;
let managerUser = null;
let tierId = null;
let draftTierId = null;
let offerId = null;
let membershipId = null;
let membershipPaymentId = null;
let requestId = null;
let proposalId = null;
let experiencePaymentId = null;
let appointmentId = null;
let blockId = null;
let member = null;
let manager = null;

try {
  // ---------- Setup: a member and a management account ----------
  const memberRes = await admin.auth.admin.createUser({
    email: `smoke.lc.member.${stamp}@cmagency.me`,
    password: `Smoke-LC-member-${stamp}-pw`,
    email_confirm: true,
    user_metadata: {
      full_name: 'Smoke Lifecycle Member',
      ack_version: '1',
      ack_at: ackAt,
      preferred_contact_method: 'email',
    },
  });
  if (memberRes.error) throw new Error(`create member: ${memberRes.error.name} ${memberRes.error.status} ${memberRes.error.message}`);
  memberUser = memberRes.data.user.id;

  const managerRes = await admin.auth.admin.createUser({
    email: `smoke.lc.manager.${stamp}@cmagency.me`,
    password: `Smoke-LC-manager-${stamp}-pw`,
    email_confirm: true,
    user_metadata: {
      full_name: 'Smoke Lifecycle Management',
      ack_version: '1',
      ack_at: ackAt,
      preferred_contact_method: 'email',
    },
  });
  if (managerRes.error) throw new Error(`create manager: ${managerRes.error.name} ${managerRes.error.status} ${managerRes.error.message}`);
  managerUser = managerRes.data.user.id;

  const roleSet = await admin
    .from('profiles')
    .update({role: 'management'})
    .eq('id', managerUser);
  ok('management role assigned', !roleSet.error, roleSet.error?.message);

  member = createClient(url, anonKey, {auth: {persistSession: false}});
  manager = createClient(url, anonKey, {auth: {persistSession: false}});
  const memberSignIn = await member.auth.signInWithPassword({
    email: `smoke.lc.member.${stamp}@cmagency.me`,
    password: `Smoke-LC-member-${stamp}-pw`,
  });
  const managerSignIn = await manager.auth.signInWithPassword({
    email: `smoke.lc.manager.${stamp}@cmagency.me`,
    password: `Smoke-LC-manager-${stamp}-pw`,
  });
  ok(
    'member and management both sign in',
    !memberSignIn.error && !managerSignIn.error,
    [memberSignIn.error, managerSignIn.error].filter(Boolean).map((e) => e.message).join('; '),
  );

  // ---------- Setup: two tiers (one active, one draft) ----------
  const tierRes = await admin
    .from('membership_tiers')
    .insert({
      key: tierKey,
      name: 'Smoke Inner Circle',
      description: 'Created by the lifecycle smoke.',
      price_cents: 50000,
      currency: 'USD',
      interval: 'annual',
      benefits: ['Direct coordination with management'],
      sort_order: 900,
      status: 'active',
    })
    .select('id')
    .single();
  if (tierRes.error) throw new Error(`tier insert: ${tierRes.error.message}`);
  tierId = tierRes.data.id;

  const draftTierRes = await admin
    .from('membership_tiers')
    .insert({
      key: `${tierKey}D`,
      name: 'Smoke Draft Tier',
      price_cents: 10000,
      interval: 'monthly',
      sort_order: 901,
      status: 'draft',
    })
    .select('id')
    .single();
  draftTierId = draftTierRes.data?.id ?? null;
  ok('tiers created (active + draft)', !tierRes.error && !draftTierRes.error, draftTierRes.error?.message);

  // ---------- Tier visibility ----------
  const userTiers = await member.from('membership_tiers').select('id, status');
  ok(
    'member sees the active tier',
    !userTiers.error && (userTiers.data ?? []).some((t) => t.id === tierId),
    userTiers.error?.message,
  );
  ok(
    'member never sees the draft tier',
    !userTiers.error && !(userTiers.data ?? []).some((t) => t.id === draftTierId),
  );

  // ---------- Offer: management creates and sends; member accepts ----------
  const userOfferInsert = await member
    .from('membership_offers')
    .insert({user_id: memberUser, tier_id: tierId, status: 'sent'});
  ok('member offer insert is rejected by RLS', Boolean(userOfferInsert.error), userOfferInsert.error?.message);

  const draftOffer = await manager
    .from('membership_offers')
    .insert({user_id: memberUser, tier_id: tierId, message: 'An invitation.', status: 'draft'})
    .select('id, status')
    .single();
  offerId = draftOffer.data?.id ?? null;
  const draftsVisible = await member.from('membership_offers').select('id').eq('id', offerId);
  ok(
    'a draft offer is invisible to the member',
    !draftOffer.error && (draftsVisible.data ?? []).length === 0,
    draftOffer.error?.message,
  );

  const sendOffer = await manager
    .from('membership_offers')
    .update({status: 'sent'})
    .eq('id', offerId);
  const sentVisible = await member.from('membership_offers').select('*').eq('id', offerId);
  ok(
    'management sends the offer and the member now sees it',
    !sendOffer.error && (sentVisible.data ?? []).length === 1,
    sendOffer.error?.message,
  );

  const acceptOffer = await member
    .from('membership_offers')
    .update({status: 'accepted'})
    .eq('id', offerId)
    .select('status')
    .single();
  ok('the member accepts the offer', !acceptOffer.error && acceptOffer.data?.status === 'accepted', acceptOffer.error?.message);

  const membershipRead = await member.from('memberships').select('*').eq('offer_id', offerId).maybeSingle();
  membershipId = membershipRead.data?.id ?? null;
  const offerPayment = await member
    .from('membership_payments')
    .select('*')
    .eq('membership_id', membershipId)
    .maybeSingle();
  membershipPaymentId = offerPayment.data?.id ?? null;
  ok(
    'acceptance creates a pending membership — never active',
    !membershipRead.error && membershipRead.data?.status === 'pending' && membershipRead.data?.membership_number == null,
    membershipRead.error?.message,
  );
  ok(
    'acceptance creates the pending payment request',
    !offerPayment.error && offerPayment.data?.status === 'pending' && offerPayment.data?.amount_cents === 50000,
    offerPayment.error?.message,
  );

  // ---------- The member can never activate or self-verify ----------
  const userActivate = await member.rpc('activate_membership', {p_membership_id: membershipId});
  ok(
    'member cannot activate their own membership',
    Boolean(userActivate.error) && /only management/i.test(userActivate.error.message),
    userActivate.error?.message,
  );

  const userMembershipWrite = await member
    .from('memberships')
    .update({status: 'active'})
    .eq('id', membershipId)
    .select('id, status');
  const membershipUnchanged = await member.from('memberships').select('status').eq('id', membershipId).maybeSingle();
  ok(
    'member cannot write their membership row',
    !userMembershipWrite.error &&
      (userMembershipWrite.data ?? []).length === 0 &&
      membershipUnchanged.data?.status === 'pending',
    userMembershipWrite.error?.message ?? `status=${membershipUnchanged.data?.status}`,
  );

  const userPaymentWrite = await member
    .from('membership_payments')
    .update({status: 'paid'})
    .eq('id', membershipPaymentId)
    .select('id, status');
  const paymentUnchanged = await member
    .from('membership_payments')
    .select('status')
    .eq('id', membershipPaymentId)
    .maybeSingle();
  ok(
    'member cannot mark their own payment paid',
    !userPaymentWrite.error &&
      (userPaymentWrite.data ?? []).length === 0 &&
      paymentUnchanged.data?.status === 'pending',
    userPaymentWrite.error?.message ?? `status=${paymentUnchanged.data?.status}`,
  );

  const earlyActivate = await manager.rpc('activate_membership', {p_membership_id: membershipId});
  ok(
    'activation is blocked while the payment is open',
    Boolean(earlyActivate.error) && /payment must be confirmed/i.test(earlyActivate.error.message),
    earlyActivate.error?.message,
  );

  // ---------- Management verifies the payment (still not active) ----------
  const markPaid = await manager
    .from('membership_payments')
    .update({status: 'paid'})
    .eq('id', membershipPaymentId);
  const afterPaid = await member.from('memberships').select('*').eq('id', membershipId).maybeSingle();
  ok(
    'paid is NOT active: the membership waits in verification',
    !markPaid.error && afterPaid.data?.status === 'verification',
    `${markPaid.error?.message ?? ''} status=${afterPaid.data?.status}`,
  );

  // ---------- Management activates; the card is issued server-side ----------
  const activate = await manager.rpc('activate_membership', {p_membership_id: membershipId});
  const activeRead = await member.from('memberships').select('*').eq('id', membershipId).maybeSingle();
  ok(
    'management activates the membership with the server RPC',
    !activate.error && activeRead.data?.status === 'active',
    activate.error?.message,
  );
  ok(
    'membership number follows the GA-###### format',
    /^GA-\d{6}$/.test(String(activeRead.data?.membership_number ?? '')),
    String(activeRead.data?.membership_number ?? ''),
  );
  ok(
    'activation records activation and expiration dates',
    Boolean(activeRead.data?.activation_date) && Boolean(activeRead.data?.expiration_date),
  );

  const cardRead = await member.from('membership_cards').select('*').eq('membership_id', membershipId).maybeSingle();
  const serialPattern = new RegExp(`^GA-${tierKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-[0-9A-F]{5}$`);
  ok(
    'the membership card is issued server-side with the right serial format',
    !cardRead.error && serialPattern.test(String(cardRead.data?.card_serial ?? '')),
    String(cardRead.data?.card_serial ?? ''),
  );

  const cardInsert = await member
    .from('membership_cards')
    .insert({membership_id: membershipId, card_serial: 'GA-FORGED-00001'});
  ok('the member cannot create a card themselves', Boolean(cardInsert.error), cardInsert.error?.message);

  const firstSerial = String(cardRead.data?.card_serial ?? '');
  const reissue = await manager.rpc('reissue_membership_card', {p_membership_id: membershipId});
  const reissuedRead = await member.from('membership_cards').select('*').eq('membership_id', membershipId).maybeSingle();
  ok(
    'management reissues the card with a new serial',
    !reissue.error && serialPattern.test(String(reissue.data ?? '')) && reissue.data !== firstSerial,
    reissue.error?.message ?? String(reissue.data),
  );
  ok('the member sees the reissued card', reissuedRead.data?.card_serial === reissue.data);

  const twiceActivate = await manager.rpc('activate_membership', {p_membership_id: membershipId});
  ok(
    'an active membership cannot be activated twice',
    Boolean(twiceActivate.error) && /already active/i.test(twiceActivate.error.message),
    twiceActivate.error?.message,
  );

  // ---------- Experience: intake on `requests` ----------
  const requestInsert = await member
    .from('requests')
    .insert({
      user_id: memberUser,
      type: 'personal_experience',
      title: 'A private afternoon tea',
      description: 'A quiet hour away from the public eye.',
      participants: '2',
      contact_method: 'email',
    })
    .select('id, status')
    .single();
  requestId = requestInsert.data?.id ?? null;
  ok(
    'the member submits an experience request',
    !requestInsert.error && requestInsert.data?.status === 'submitted',
    requestInsert.error?.message,
  );

  const proposalInsertAsUser = await member
    .from('experience_proposals')
    .insert({request_id: requestId, summary: 'Not allowed.'});
  ok('the member cannot create proposals', Boolean(proposalInsertAsUser.error), proposalInsertAsUser.error?.message);

  const draftProposal = await manager
    .from('experience_proposals')
    .insert({
      request_id: requestId,
      version: 1,
      summary: 'Private tea, forty-five minutes, London.',
      terms: 'Non-transferable.',
      amount_cents: 25000,
      currency: 'USD',
      proposed_date: '2026-11-20',
      proposed_time: '15:00',
      location: 'London',
      duration_minutes: 45,
      participants: '2',
      status: 'draft',
    })
    .select('id')
    .single();
  proposalId = draftProposal.data?.id ?? null;
  const sendProposal = await manager
    .from('experience_proposals')
    .update({status: 'sent'})
    .eq('id', proposalId);
  const proposalStatusRow = await member
    .from('requests')
    .select('status')
    .eq('id', requestId)
    .maybeSingle();
  ok(
    'sending the proposal moves the request to proposal',
    !sendProposal.error && proposalStatusRow.data?.status === 'proposal',
    `${sendProposal.error?.message ?? ''} status=${proposalStatusRow.data?.status}`,
  );

  const userSeesProposal = await member
    .from('experience_proposals')
    .select('*')
    .eq('id', proposalId);
  ok('the member sees the sent proposal', !userSeesProposal.error && (userSeesProposal.data ?? []).length === 1);

  const acceptProposal = await member
    .from('experience_proposals')
    .update({status: 'accepted'})
    .eq('id', proposalId);
  const paymentRequired = await member.from('requests').select('status').eq('id', requestId).maybeSingle();
  const expPayment = await member
    .from('experience_payments')
    .select('*')
    .eq('request_id', requestId)
    .maybeSingle();
  experiencePaymentId = expPayment.data?.id ?? null;
  ok(
    'accepting the proposal requires payment',
    !acceptProposal.error && paymentRequired.data?.status === 'payment_required',
    `${acceptProposal.error?.message ?? ''} status=${paymentRequired.data?.status}`,
  );
  ok(
    'the pending experience payment belongs to the member',
    !expPayment.error && expPayment.data?.status === 'pending' && expPayment.data?.user_id === memberUser,
    expPayment.error?.message,
  );

  const userConfirm = await member
    .from('requests')
    .update({status: 'confirmed'})
    .eq('id', requestId);
  ok('the member cannot confirm their own request', Boolean(userConfirm.error), userConfirm.error?.message);

  const earlyConfirm = await manager
    .from('requests')
    .update({status: 'confirmed'})
    .eq('id', requestId);
  ok(
    'management cannot confirm while the experience payment is open',
    Boolean(earlyConfirm.error) && /payment must be paid before confirmation/i.test(earlyConfirm.error.message),
    earlyConfirm.error?.message,
  );

  const payExperience = await manager
    .from('experience_payments')
    .update({status: 'paid'})
    .eq('id', experiencePaymentId);
  const stillPaymentRequired = await member.from('requests').select('status').eq('id', requestId).maybeSingle();
  ok(
    'paid experience payment never confirms the request by itself',
    !payExperience.error && stillPaymentRequired.data?.status === 'payment_required',
    `status=${stillPaymentRequired.data?.status}`,
  );

  const confirmExperience = await manager
    .from('requests')
    .update({status: 'confirmed'})
    .eq('id', requestId);
  const confirmed = await member.from('requests').select('*').eq('id', requestId).maybeSingle();
  ok(
    'management confirms the experience explicitly',
    !confirmExperience.error && confirmed.data?.status === 'confirmed',
    confirmExperience.error?.message,
  );
  ok(
    'confirmation alone never resolves the request',
    confirmed.data?.resolved_at == null,
    `resolved_at=${confirmed.data?.resolved_at}`,
  );

  // ---------- Scheduling is management-only and atomic ----------
  const userSchedule = await member.rpc('schedule_experience', {
    p_request_id: requestId,
    p_title: 'Member self-schedule',
    p_starts_at: '2026-11-20T15:00:00.000Z',
    p_ends_at: '2026-11-20T15:45:00.000Z',
  });
  ok('the member cannot schedule experiences', Boolean(userSchedule.error), userSchedule.error?.message);

  const schedule = await manager.rpc('schedule_experience', {
    p_request_id: requestId,
    p_title: 'Private afternoon tea',
    p_starts_at: '2026-11-20T15:00:00.000Z',
    p_ends_at: '2026-11-20T15:45:00.000Z',
    p_timezone: 'Europe/London',
    p_location: 'London',
    p_meeting_instructions: 'Arrive fifteen minutes early.',
  });
  appointmentId = schedule.data?.appointment_id ?? null;
  const scheduledRequest = await member.from('requests').select('status').eq('id', requestId).maybeSingle();
  ok(
    'management schedules the experience atomically',
    !schedule.error && scheduledRequest.data?.status === 'scheduled',
    schedule.error?.message,
  );

  const appointmentRead = await member
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .maybeSingle();
  ok(
    'the member sees the confirmed appointment',
    !appointmentRead.error && appointmentRead.data?.status === 'confirmed' && appointmentRead.data?.timezone === 'Europe/London',
    appointmentRead.error?.message,
  );

  const scheduleRead = await member.from('experience_schedules').select('*').eq('request_id', requestId);
  ok('experience schedules stay management-only', !scheduleRead.error && (scheduleRead.data ?? []).length === 0);

  const appointmentWrite = await member
    .from('appointments')
    .update({status: 'cancelled'})
    .eq('id', appointmentId)
    .select('id, status');
  const appointmentUnchanged = await member
    .from('appointments')
    .select('status')
    .eq('id', appointmentId)
    .maybeSingle();
  ok(
    'the member cannot alter the appointment',
    !appointmentWrite.error &&
      (appointmentWrite.data ?? []).length === 0 &&
      appointmentUnchanged.data?.status === 'confirmed',
    appointmentWrite.error?.message ?? `status=${appointmentUnchanged.data?.status}`,
  );

  // ---------- Availability blocks: management planning only ----------
  const blockInsert = await manager
    .from('availability_blocks')
    .insert({
      title: 'Smoke block',
      kind: 'blocked',
      starts_at: '2026-11-19T09:00:00.000Z',
      ends_at: '2026-11-19T18:00:00.000Z',
      timezone: 'UTC',
      note: 'lifecycle smoke',
    })
    .select('id')
    .single();
  blockId = blockInsert.data?.id ?? null;
  const blockRead = await member.from('availability_blocks').select('*');
  ok(
    'management blocks availability and members cannot see it',
    !blockInsert.error && (blockRead.data ?? []).length === 0,
    blockInsert.error?.message,
  );

  // ---------- Completion ----------
  const complete = await manager
    .from('requests')
    .update({status: 'completed'})
    .eq('id', requestId);
  const completed = await member.from('requests').select('*').eq('id', requestId).maybeSingle();
  ok(
    'management completes the experience with a resolved timestamp',
    !complete.error && completed.data?.status === 'completed' && Boolean(completed.data?.resolved_at),
    complete.error?.message,
  );

  const events = await admin
    .from('request_events')
    .select('event_type')
    .eq('request_id', requestId)
    .order('created_at', {ascending: true});
  const kinds = (events.data ?? []).map((e) => e.event_type);
  ok(
    'the request timeline carries the real lifecycle events',
    ['submitted', 'proposal_created', 'proposal_accepted', 'confirmed', 'scheduled', 'completed'].every((k) => kinds.includes(k)),
    kinds.join(', '),
  );
} catch (err) {
  ok('unexpected failure', false, err instanceof Error ? err.message : String(err));
} finally {
  // ---------- Cleanup (service role) ----------
  const warn = (label, res) => {
    if (res?.error) console.log(`WARN   ${label}: ${res.error.message}`);
    else if (res != null) console.log(`CLEAN  ${label}`);
  };

  if (requestId) {
    warn('appointments', await admin.from('appointments').delete().eq('request_id', requestId));
    warn('audit request rows', await admin.from('audit_logs').delete().eq('entity_id', requestId));
    warn('request (cascades proposals/payments/schedules/events)', await admin.from('requests').delete().eq('id', requestId));
  }
  if (blockId) warn('availability block', await admin.from('availability_blocks').delete().eq('id', blockId));
  if (membershipId) {
    warn('membership cards', await admin.from('membership_cards').delete().eq('membership_id', membershipId));
    warn('membership payments', await admin.from('membership_payments').delete().eq('membership_id', membershipId));
    warn('audit membership rows', await admin.from('audit_logs').delete().eq('entity_id', membershipId));
    warn('membership', await admin.from('memberships').delete().eq('id', membershipId));
  }
  if (offerId) warn('membership offer', await admin.from('membership_offers').delete().eq('id', offerId));
  if (tierId) warn('active tier', await admin.from('membership_tiers').delete().eq('id', tierId));
  if (draftTierId) warn('draft tier', await admin.from('membership_tiers').delete().eq('id', draftTierId));
  if (managerUser) warn('manager notifications', await admin.from('notifications').delete().eq('user_id', managerUser));
  if (memberUser) {
    warn('member notifications', await admin.from('notifications').delete().eq('user_id', memberUser));
    const rm = await admin.auth.admin.deleteUser(memberUser);
    console.log(`${rm.error ? 'WARN' : 'CLEAN'}  member user removed${rm.error ? `: ${rm.error.message}` : ''}`);
  }
  if (managerUser) {
    const rm = await admin.auth.admin.deleteUser(managerUser);
    console.log(`${rm.error ? 'WARN' : 'CLEAN'}  manager user removed${rm.error ? `: ${rm.error.message}` : ''}`);
  }
}

const failed = checks.filter((c) => !c.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) {
  console.log('FAILED:', failed.map((f) => f.name).join(' | '));
  process.exitCode = 1;
}
