// Live smoke test for the authenticated user experience (real Supabase).
//
// Covers: request workflow + real timeline events, status permissions,
// request_events RLS, messaging (visibility, internal messages, read state,
// column-limited updates), notifications (read state + isolation),
// profile/application preference writes, protected field denials,
// storage attachments (owner folder), and read paths used by the UI.
// Cleanup removes both users; no emails are sent.

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
let user1 = null;
let user2 = null;
let attachmentPath = null;

function applicationFor(name) {
  return {
    full_name: name,
    phone: '+44 20 7946 0000',
    country: 'United Kingdom',
    city: 'London',
    occupation: 'Quality Tester',
    company: 'QA',
    preferred_contact_method: 'email',
    ack_version: '1',
    ack_at: ackAt,
    reason_for_joining: 'Verifying the authenticated experience end to end.',
    platform_motivation: 'Ensuring the platform works correctly for real users.',
    connection_interest: 'A virtual meeting to validate the pipeline.',
    experience_interests: ['virtual_meeting', 'text_communication'],
    contact_email_ok: true,
    contact_phone_ok: false,
    contact_whatsapp_ok: false,
    whatsapp_number: '',
  };
}

try {
  // ---------- Setup: two confirmed users ----------
  const created1 = await admin.auth.admin.createUser({
    email: `smoke.ux1.${stamp}@cmagency.me`,
    password: `Smoke-UX1-${stamp}-pw`,
    email_confirm: true,
    user_metadata: applicationFor('Smoke UX One'),
  });
  if (created1.error) {
    throw new Error(
      `createUser 1: ${created1.error.name} ${created1.error.status} ${created1.error.message}`,
    );
  }
  user1 = created1.data.user.id;

  const created2 = await admin.auth.admin.createUser({
    email: `smoke.ux2.${stamp}@cmagency.me`,
    password: `Smoke-UX2-${stamp}-pw`,
    email_confirm: true,
    user_metadata: applicationFor('Smoke UX Two'),
  });
  if (created2.error) {
    throw new Error(
      `createUser 2: ${created2.error.name} ${created2.error.status} ${created2.error.message}`,
    );
  }
  user2 = created2.data.user.id;

  const c1 = createClient(url, anonKey, {auth: {persistSession: false}});
  const c2 = createClient(url, anonKey, {auth: {persistSession: false}});

  const signIn1 = await c1.auth.signInWithPassword({
    email: `smoke.ux1.${stamp}@cmagency.me`,
    password: `Smoke-UX1-${stamp}-pw`,
  });
  ok('user 1 signs in', !signIn1.error, signIn1.error?.message);
  const signIn2 = await c2.auth.signInWithPassword({
    email: `smoke.ux2.${stamp}@cmagency.me`,
    password: `Smoke-UX2-${stamp}-pw`,
  });
  ok('user 2 signs in', !signIn2.error, signIn2.error?.message);

  // ---------- Requests: creation + real timeline ----------
  const reqInsert = await c1
    .from('requests')
    .insert({
      user_id: user1,
      type: 'personal_experience',
      title: 'Smoke request one',
      description: 'Verifying the request workflow end to end.',
      participants: 'just me',
      contact_method: 'email',
      preferred_date: '2026-12-01',
    })
    .select('*')
    .single();
  ok('user creates a request (defaults to submitted)', !reqInsert.error && reqInsert.data?.status === 'submitted', JSON.stringify(reqInsert.error ?? reqInsert.data));
  const req1 = reqInsert.data;

  const ev1 = await c1.from('request_events').select('*').eq('request_id', req1.id).order('created_at');
  ok(
    'submitting records the submitted timeline event',
    ev1.data?.length === 1 && ev1.data[0]?.event_type === 'submitted',
    JSON.stringify(ev1.data),
  );

  // ---------- Requests: permission enforcement ----------
  const eApproved = await c1.from('requests').update({status: 'approved'}).eq('id', req1.id);
  ok('user cannot approve their own request', Boolean(eApproved.error) && eApproved.error.message.includes('only management'), eApproved.error?.message);

  const eBadInsert = await c1
    .from('requests')
    .insert({user_id: user1, type: 'other', title: 'Bad status', status: 'approved'});
  ok('user cannot insert a non-submitted request', Boolean(eBadInsert.error) && eBadInsert.error.message.includes('submitted'), eBadInsert.error?.message);

  const eAssign = await c1.from('requests').update({assigned_to: user2}).eq('id', req1.id);
  ok('user cannot assign a request', Boolean(eAssign.error) && eAssign.error.message.includes('assigned_to'), eAssign.error?.message);

  const withdraw = await c1.from('requests').update({status: 'cancelled'}).eq('id', req1.id).select('status, resolved_at').single();
  ok(
    'user can withdraw their own submitted request',
    !withdraw.error && withdraw.data?.status === 'cancelled' && Boolean(withdraw.data?.resolved_at),
    JSON.stringify(withdraw.error ?? withdraw.data),
  );

  const ev1b = await c1.from('request_events').select('event_type').eq('request_id', req1.id);
  ok(
    'withdrawal is recorded on the timeline',
    ev1b.data?.some((e) => e.event_type === 'cancelled'),
    JSON.stringify(ev1b.data),
  );

  // ---------- Requests: management workflow events ----------
  const req2Insert = await c1
    .from('requests')
    .insert({
      user_id: user1,
      type: 'virtual_meeting',
      title: 'Smoke request two',
      description: 'Used to verify management workflow events.',
    })
    .select('id')
    .single();
  const req2 = req2Insert.data;

  const mgmtUpdate = await admin
    .from('requests')
    .update({assigned_to: user2, status: 'in_review'})
    .eq('id', req2.id);
  ok('management can assign and move a request to review', !mgmtUpdate.error, mgmtUpdate.error?.message);

  const ev2 = await c1.from('request_events').select('event_type').eq('request_id', req2.id).order('created_at');
  const types2 = (ev2.data ?? []).map((e) => e.event_type);
  ok(
    'timeline shows submitted, management received and review started',
    ['submitted', 'management_received', 'review_started'].every((t) => types2.includes(t)),
    JSON.stringify(types2),
  );

  const eEventInsert = await c1
    .from('request_events')
    .insert({request_id: req2.id, event_type: 'approved'});
  ok('user cannot fabricate timeline events', Boolean(eEventInsert.error), eEventInsert.error?.message);

  // ---------- request_events RLS ----------
  const evOther = await c2.from('request_events').select('id').eq('request_id', req2.id);
  ok('another user cannot read this timeline', !evOther.error && (evOther.data ?? []).length === 0, String((evOther.data ?? []).length));

  const reqOther = await c2.from('requests').select('id').in('id', [req1.id, req2.id]);
  ok('another user cannot read these requests', !reqOther.error && (reqOther.data ?? []).length === 0, String((reqOther.data ?? []).length));

  // ---------- Messaging ----------
  const convInsert = await admin
    .from('management_conversations')
    .insert({user_id: user1, subject: 'Smoke conversation', status: 'open'})
    .select('id')
    .single();
  const convId = convInsert.data?.id;

  const mgmtMsg = await admin
    .from('management_messages')
    .insert({conversation_id: convId, sender_id: user2, body: 'Management reply', is_internal: false})
    .select('id')
    .single();
  const internalMsg = await admin
    .from('management_messages')
    .insert({conversation_id: convId, sender_id: user2, body: 'Internal note to self', is_internal: true})
    .select('id')
    .single();

  const myConvs = await c1.from('management_conversations').select('id, subject').eq('id', convId);
  ok('user sees their conversation', !myConvs.error && myConvs.data?.length === 1, JSON.stringify(myConvs.data));

  const myMsgs = await c1.from('management_messages').select('id, body, is_internal').eq('conversation_id', convId);
  const bodies = (myMsgs.data ?? []).map((m) => m.body);
  ok(
    'user sees management messages but never internal ones',
    bodies.includes('Management reply') && !bodies.includes('Internal note to self'),
    JSON.stringify(bodies),
  );

  const markRead = await c1
    .from('management_messages')
    .update({read_at: new Date().toISOString()})
    .eq('id', mgmtMsg.data.id)
    .select('read_at')
    .single();
  ok('user can mark an incoming message read', !markRead.error && Boolean(markRead.data?.read_at), markRead.error?.message);

  const eEditBody = await c1.from('management_messages').update({body: 'tampered'}).eq('id', mgmtMsg.data.id);
  ok('user cannot edit message bodies', Boolean(eEditBody.error), eEditBody.error?.message);

  const eInternal = await c1
    .from('management_messages')
    .insert({conversation_id: convId, sender_id: user1, body: 'fake internal note', is_internal: true});
  ok('user cannot send an internal message', Boolean(eInternal.error), eInternal.error?.message);

  const eConvAssign = await c1
    .from('management_conversations')
    .update({assigned_to: user2})
    .eq('id', convId);
  ok('user cannot assign a conversation', Boolean(eConvAssign.error) && eConvAssign.error.message.includes('assigned_to'), eConvAssign.error?.message);

  const eReqEdit = await c1.from('requests').update({title: 'tampered title'}).eq('id', req2.id);
  ok('user cannot edit request details', Boolean(eReqEdit.error) && eReqEdit.error.message.includes('request details'), eReqEdit.error?.message);

  const myReply = await c1
    .from('management_messages')
    .insert({
      conversation_id: convId,
      sender_id: user1,
      body: 'Reply from user',
      attachments: [{name: 'note.txt', path: `${user1}/messages/${convId}/note.txt`}],
    })
    .select('id, attachments')
    .single();
  ok('user sends a message with attachments metadata', !myReply.error && myReply.data?.attachments?.length === 1, myReply.error?.message);

  const convOther = await c2.from('management_conversations').select('id').eq('id', convId);
  const msgsOther = await c2.from('management_messages').select('id').eq('conversation_id', convId);
  ok(
    'another user cannot read this conversation or its messages',
    !convOther.error && (convOther.data ?? []).length === 0 && (msgsOther.data ?? []).length === 0,
  );

  // ---------- Notifications ----------
  const notif = await admin
    .from('notifications')
    .insert({user_id: user1, title: 'Smoke notification', body: 'From management.', type: 'request', link: '/dashboard/requests'})
    .select('id')
    .single();

  const myNotifs = await c1.from('notifications').select('id, read_at');
  ok('user reads their notifications', !myNotifs.error && (myNotifs.data ?? []).length >= 1, JSON.stringify(myNotifs.data));

  const notifsOther = await c2.from('notifications').select('id').eq('id', notif.data.id);
  ok('another user cannot read this notification', !notifsOther.error && (notifsOther.data ?? []).length === 0);

  const markAll = await c1.from('notifications').update({read_at: new Date().toISOString()}).is('read_at', null);
  const notifsAfter = await c1.from('notifications').select('read_at');
  ok(
    'mark all read clears every unread notification',
    !markAll.error && (notifsAfter.data ?? []).every((n) => n.read_at !== null),
    markAll.error?.message,
  );

  // ---------- Profile + preference writes ----------
  const profileWrite = await c1
    .from('profiles')
    .update({full_name: 'Smoke UX Renamed', notify_requests: false, notify_membership: false})
    .eq('id', user1)
    .select('full_name, notify_requests, notify_membership, role, status')
    .single();
  ok(
    'user updates name and email preferences',
    !profileWrite.error &&
      profileWrite.data?.full_name === 'Smoke UX Renamed' &&
      profileWrite.data?.notify_requests === false &&
      profileWrite.data?.notify_membership === false &&
      profileWrite.data?.role === 'user' &&
      profileWrite.data?.status === 'active',
    JSON.stringify(profileWrite.error ?? profileWrite.data),
  );

  const eRole = await c1.from('profiles').update({role: 'management'}).eq('id', user1);
  ok('user cannot change their role', Boolean(eRole.error), eRole.error?.message);

  const eAppStatus = await c1.from('applicant_profiles').update({status: 'approved'}).eq('user_id', user1);
  ok('user cannot change their applicant status', Boolean(eAppStatus.error) && eAppStatus.error.message.includes('status'), eAppStatus.error?.message);

  const appPrefs = await c1
    .from('applicant_profiles')
    .update({contact_phone_ok: true, contact_whatsapp_ok: true, whatsapp_number: '+44 7700 900123'})
    .eq('user_id', user1)
    .select('contact_phone_ok, contact_whatsapp_ok, whatsapp_number')
    .single();
  ok(
    'user saves communication preferences',
    !appPrefs.error && appPrefs.data?.contact_phone_ok === true && appPrefs.data?.whatsapp_number === '+44 7700 900123',
    appPrefs.error?.message,
  );

  // ---------- Storage attachment (owner folder) ----------
  attachmentPath = `${user1}/messages/${convId}/${stamp}-note.txt`;
  const upload = await c1.storage
    .from('documents')
    .upload(attachmentPath, new TextEncoder().encode('hello'), {contentType: 'text/plain', upsert: false});
  ok('user uploads an attachment to their own folder', !upload.error, upload.error?.message);

  const signed = await c1.storage.from('documents').createSignedUrl(attachmentPath, 60);
  ok('user can sign their attachment for download', !signed.error && Boolean(signed.data?.signedUrl), signed.error?.message);

  const uploadOther = await c1.storage
    .from('documents')
    .upload(`${user2}/messages/steal.txt`, new TextEncoder().encode('x'), {contentType: 'text/plain'});
  ok('user cannot write into another user folder', Boolean(uploadOther.error), uploadOther.error?.message);

  // ---------- UI read paths ----------
  const membershipRead = await c1.from('memberships').select('*').limit(1);
  const expRead = await c1.from('requests').select('*').limit(1);
  const docsRead = await c1.from('documents').select('*').limit(1);
  const settingsRead = await c1.from('site_settings').select('*').eq('is_public', true).limit(1);
  ok(
    'dashboard read paths resolve without errors',
    !membershipRead.error && !expRead.error && !docsRead.error && !settingsRead.error,
    [membershipRead.error, expRead.error, docsRead.error, settingsRead.error].filter(Boolean).map((e) => e.message).join('; '),
  );
} catch (err) {
  ok('unexpected failure', false, err instanceof Error ? err.message : String(err));
} finally {
  // ---------- Cleanup ----------
  if (attachmentPath) {
    const rm = await admin.storage.from('documents').remove([attachmentPath]);
    if (!rm.error) console.log('CLEAN  attachment removed');
    else console.log(`WARN   attachment cleanup: ${rm.error.message}`);
  }
  if (user1) {
    const d = await admin.auth.admin.deleteUser(user1);
    console.log(`${d.error ? 'WARN' : 'CLEAN'}  user 1 removed${d.error ? `: ${d.error.message}` : ''}`);
  }
  if (user2) {
    const d = await admin.auth.admin.deleteUser(user2);
    console.log(`${d.error ? 'WARN' : 'CLEAN'}  user 2 removed${d.error ? `: ${d.error.message}` : ''}`);
  }
}

const failed = checks.filter((c) => !c.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) {
  console.log('FAILED:', failed.map((f) => f.name).join(' | '));
  process.exitCode = 1;
}
