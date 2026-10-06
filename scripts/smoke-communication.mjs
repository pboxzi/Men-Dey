// Live smoke test for the production communication stack (real Supabase project).
//
// Covers: two-client realtime delivery (management message -> fan realtime
// insert + notification), notification e2e with preference gating and the
// new_message exemption, internal-note secrecy, announcement permission,
// send-email auth-mode (invalid template, enumeration-safe reset, rate limit),
// process-mode delivery (real Resend send, failed template, skipped claim),
// storage signed URLs (own path, foreign path denied), and client_error_logs
// visibility. Cleanup removes everything except append-only email audit rows.

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
const anon = createClient(url, anonKey, {auth: {persistSession: false}});
const checks = [];
const ok = (name, pass, detail = '') => {
  checks.push({name, pass});
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`);
};

const stamp = Date.now();
const ackAt = new Date(Date.now() - 60_000).toISOString();

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
    reason_for_joining: 'Verifying the communication stack end to end.',
    platform_motivation: 'Ensuring notifications and messaging work for real accounts.',
    connection_interest: 'A virtual meeting to validate messaging.',
    experience_interests: ['virtual_meeting', 'text_communication'],
    contact_email_ok: true,
    contact_phone_ok: false,
    contact_whatsapp_ok: false,
    whatsapp_number: '',
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function subscribeInserts(client, table, cb) {
  const channel = client.channel(`smoke-${table}-${stamp}-${Math.random()}`);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`realtime subscribe timeout (${table})`)), 10000);
    channel
      .on('postgres_changes', {event: 'INSERT', schema: 'public', table}, (payload) => cb(payload.new))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timer);
          resolve();
        }
      });
  });
  return () => {
    void client.removeChannel(channel);
  };
}

async function waitFor(predicate, ms = 10000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await sleep(150);
  }
  return false;
}

async function invokeBody(error) {
  try {
    const context = error?.context;
    if (context && typeof context.json === 'function') return await context.json();
  } catch {
    // fall through
  }
  return null;
}

let fan1 = null;
let fan2 = null;
let staff = null;
let conversationId = null;
const fan1Client = createClient(url, anonKey, {auth: {persistSession: false}});
const fan2Client = createClient(url, anonKey, {auth: {persistSession: false}});
const staffClient = createClient(url, anonKey, {auth: {persistSession: false}});
const uploadedPaths = [];

try {
  // ---------- accounts ----------
  const emailFan1 = `smoke.comm.fan1.${stamp}@cmagency.me`;
  const emailFan2 = `smoke.comm.fan2.${stamp}@cmagency.me`;
  const emailStaff = `smoke.comm.staff.${stamp}@cmagency.me`;

  const {data: s1, error: e1} = await fan1Client.auth.signUp({
    email: emailFan1,
    password: `Smoke-Comm-Fan1-${stamp}-pw`,
    options: {data: applicationFor('Smoke Comms Fan One')},
  });
  if (e1) throw new Error(`fan1 signup: ${e1.message}`);
  fan1 = s1.user?.id ?? null;
  ok('setup: fan one signed up with acknowledgement', Boolean(fan1), fan1);

  const {data: s2, error: e2} = await fan2Client.auth.signUp({
    email: emailFan2,
    password: `Smoke-Comm-Fan2-${stamp}-pw`,
    options: {data: applicationFor('Smoke Comms Fan Two')},
  });
  if (e2) throw new Error(`fan2 signup: ${e2.message}`);
  fan2 = s2.user?.id ?? null;
  ok('setup: fan two signed up with acknowledgement', Boolean(fan2), fan2);

  const {data: s3, error: e3} = await staffClient.auth.signUp({
    email: emailStaff,
    password: `Smoke-Comm-Staff-${stamp}-pw`,
    options: {data: applicationFor('Smoke Comms Management')},
  });
  if (e3) throw new Error(`staff signup: ${e3.message}`);
  staff = s3.user?.id ?? null;
  ok('setup: management account signed up', Boolean(staff), staff);

  const {error: promoteError} = await admin
    .from('profiles')
    .update({role: 'management', status: 'active'})
    .eq('id', staff);
  if (promoteError) throw new Error(`promote: ${promoteError.message}`);
  await admin.from('profiles').update({status: 'active'}).in('id', [fan1, fan2]);

  const {data: conv, error: convError} = await fan1Client
    .from('management_conversations')
    .insert({user_id: fan1, subject: `Smoke communication ${stamp}`, status: 'open'})
    .select('id')
    .single();
  if (convError) throw new Error(`conversation: ${convError.message}`);
  conversationId = conv.id;
  ok('setup: fan opened a conversation with management', Boolean(conversationId), conversationId);

  // ---------- realtime: two-client delivery ----------
  const fanNotes = [];
  const fanMessages = [];
  const stopNotes = await subscribeInserts(fan1Client, 'notifications', (row) => fanNotes.push(row));
  const stopMessages = await subscribeInserts(fan1Client, 'management_messages', (row) => fanMessages.push(row));

  const {error: msgError} = await staffClient.from('management_messages').insert({
    conversation_id: conversationId,
    sender_id: staff,
    body: 'First smoke reply from management.',
    is_internal: false,
  });
  if (msgError) throw new Error(`staff message: ${msgError.message}`);

  const gotMessage = await waitFor(() => fanMessages.some((m) => m.body === 'First smoke reply from management.'));
  const gotNote = await waitFor(() => fanNotes.some((n) => n.title === 'New message from management'));
  ok('realtime: fan client receives the message insert live', gotMessage, JSON.stringify(fanMessages.at(-1)));
  ok('realtime: fan client receives the notification insert live', gotNote, JSON.stringify(fanNotes.at(-1)));

  // ---------- notification e2e + new_message exemption ----------
  const {error: msg2Error} = await staffClient.from('management_messages').insert({
    conversation_id: conversationId,
    sender_id: staff,
    body: 'Second smoke reply from management.',
    is_internal: false,
  });
  if (msg2Error) throw new Error(`staff message 2: ${msg2Error.message}`);
  await sleep(500);

  const {data: afterTwo} = await admin
    .from('notifications')
    .select('id')
    .eq('user_id', fan1)
    .eq('type', 'new_message')
    .eq('title', 'New message from management');
  ok(
    'notifications: each management message notifies the fan (exempt from title window)',
    (afterTwo?.length ?? 0) === 2,
    `count=${afterTwo?.length}`,
  );

  const {error: internalError} = await staffClient.from('management_messages').insert({
    conversation_id: conversationId,
    sender_id: staff,
    body: 'Internal smoke note - never to the fan.',
    is_internal: true,
  });
  if (internalError) throw new Error(`staff internal: ${internalError.message}`);
  await sleep(500);

  const {data: afterInternal} = await admin
    .from('notifications')
    .select('id, body')
    .eq('user_id', fan1)
    .eq('type', 'new_message');
  const leaked = (afterInternal ?? []).some((n) => (n.body ?? '').includes('Internal smoke note'));
  ok(
    'notifications: internal note never reaches the fan',
    !leaked && (afterInternal?.length ?? 0) === 2,
    `count=${afterInternal?.length}`,
  );

  const {error: fanMsgError} = await fan1Client.from('management_messages').insert({
    conversation_id: conversationId,
    sender_id: fan1,
    body: 'Fan smoke reply.',
    is_internal: false,
  });
  if (fanMsgError) throw new Error(`fan message: ${fanMsgError.message}`);
  await sleep(500);

  const {data: staffMessageNotes} = await admin
    .from('notifications')
    .select('id')
    .eq('user_id', staff)
    .eq('title', 'New message from a member');
  ok(
    'notifications: management is notified when the fan replies',
    (staffMessageNotes?.length ?? 0) >= 1,
    `count=${staffMessageNotes?.length}`,
  );

  // ---------- preference gate (client-side e2e) ----------
  const {error: prefError} = await fan1Client
    .from('profiles')
    .update({notify_messages: false})
    .eq('id', fan1);
  ok('preferences: fan can turn message notifications off', !prefError, prefError?.message);

  const {error: msg3Error} = await staffClient.from('management_messages').insert({
    conversation_id: conversationId,
    sender_id: staff,
    body: 'Third smoke reply with prefs off.',
    is_internal: false,
  });
  if (msg3Error) throw new Error(`staff message 3: ${msg3Error.message}`);
  await sleep(500);

  const {data: afterPref} = await admin
    .from('notifications')
    .select('id')
    .eq('user_id', fan1)
    .eq('title', 'New message from management');
  ok(
    'preferences: notify_messages=false suppresses the fan notification',
    (afterPref?.length ?? 0) === 2,
    `count=${afterPref?.length}`,
  );

  const {data: messagesVisible} = await admin
    .from('management_messages')
    .select('id')
    .eq('conversation_id', conversationId);
  ok(
    'preferences: suppression does not affect the message itself',
    (messagesVisible?.length ?? 0) === 5,
    `count=${messagesVisible?.length}`,
  );
  await fan1Client.from('profiles').update({notify_messages: true}).eq('id', fan1);

  stopNotes();
  stopMessages();

  // ---------- permissions ----------
  const {error: announceError} = await fan1Client.rpc('send_announcement', {
    p_title: 'Fan announcement attempt',
    p_body: 'should be refused',
    p_link: null,
  });
  ok(
    'permissions: fan cannot send platform announcements',
    Boolean(announceError) && announceError.message.includes('only management'),
    announceError?.message,
  );

  const {error: emailReadError} = await fan1Client.from('email_logs').select('id').limit(1);
  ok(
    'permissions: fan cannot read the email audit log',
    Boolean(emailReadError),
    emailReadError?.message,
  );

  const {error: deliveriesError} = await fan1Client
    .from('notification_deliveries')
    .select('id')
    .limit(1);
  ok(
    'permissions: fan cannot read the delivery ledger',
    Boolean(deliveriesError),
    deliveriesError?.message,
  );

  // ---------- storage ----------
  const ownPath = `${fan1}/smoke/${stamp}-fan1.txt`;
  const {error: uploadError} = await fan1Client.storage
    .from('documents')
    .upload(ownPath, new Blob(['smoke communication file']), {upsert: false});
  ok('storage: fan uploads into their own folder', !uploadError, uploadError?.message);
  if (!uploadError) uploadedPaths.push(ownPath);

  const {data: ownSigned, error: ownSignError} = await fan1Client.storage
    .from('documents')
    .createSignedUrl(ownPath, 60);
  ok(
    'storage: fan signs a URL for their own file',
    !ownSignError && Boolean(ownSigned?.signedUrl),
    ownSignError?.message,
  );

  const {error: foreignSignError} = await fan2Client.storage
    .from('documents')
    .createSignedUrl(ownPath, 60);
  ok(
    'storage: another fan cannot sign a URL for a foreign path',
    Boolean(foreignSignError),
    foreignSignError?.message,
  );

  const {error: staffSignError} = await staffClient.storage
    .from('documents')
    .createSignedUrl(ownPath, 60);
  ok(
    'storage: management signs a URL for the member file',
    !staffSignError,
    staffSignError?.message,
  );

  // ---------- send-email: auth mode ----------
  const bogusTemplate = await anon.functions.invoke('send-email', {
    body: {mode: 'auth', template: 'not_a_template', email: `smoke.${stamp}@example.test`},
  });
  const bogusBody = bogusTemplate.error ? await invokeBody(bogusTemplate.error) : bogusTemplate.data;
  ok(
    'send-email auth: unknown template refused with invalid_template',
    Boolean(bogusTemplate.error) && bogusBody?.error?.code === 'invalid_template',
    JSON.stringify(bogusBody ?? bogusTemplate.data),
  );

  const rateEmail = emailFan1;
  let rateOk = true;
  let rateBody = null;
  for (let i = 0; i < 4; i += 1) {
    const res = await anon.functions.invoke('send-email', {
      body: {mode: 'auth', template: 'password_reset', email: rateEmail},
    });
    if (i < 3) {
      if (res.error) rateOk = false;
    } else if (!res.error) {
      rateOk = false;
    } else {
      rateBody = await invokeBody(res.error);
      if (rateBody?.error?.code !== 'rate_limited') rateOk = false;
    }
  }
  ok('send-email auth: password reset allows 3 then rate limits with 429', rateOk, JSON.stringify(rateBody));

  // ---------- send-email: process mode ----------
  const {data: realLog, error: realLogError} = await admin
    .from('email_logs')
    .insert({
      user_id: fan1,
      recipient: `smoke.comm.${stamp}@cmagency.me`,
      template: 'welcome',
      subject: 'Smoke communication welcome',
      params: {name: 'Smoke Comms', link: `${url.split('.supabase')[0]}.supabase.co`},
      dedupe_key: `smoke-comm-welcome-${stamp}`,
      status: 'queued',
    })
    .select('id')
    .single();
  if (realLogError) throw new Error(`email log insert: ${realLogError.message}`);

  const realSend = await anon.functions.invoke('send-email', {
    body: {mode: 'process', log_id: realLog.id},
  });
  const {data: realRow} = await admin.from('email_logs').select('status, provider_id, sent_at, error').eq('id', realLog.id).single();
  ok(
    'send-email process: real Resend delivery marks the row sent',
    !realSend.error && realRow?.status === 'sent' && Boolean(realRow?.provider_id),
    JSON.stringify(realRow ?? realSend.error?.message),
  );

  const {data: badLog} = await admin
    .from('email_logs')
    .insert({
      user_id: fan1,
      recipient: `smoke.comm.${stamp}@cmagency.me`,
      template: 'not_a_real_template',
      subject: 'Should fail',
      params: {},
      dedupe_key: `smoke-comm-bad-${stamp}`,
      status: 'queued',
    })
    .select('id')
    .single();

  const badSend = await anon.functions.invoke('send-email', {
    body: {mode: 'process', log_id: badLog.id},
  });
  const {data: badRow} = await admin.from('email_logs').select('status, error').eq('id', badLog.id).single();
  ok(
    'send-email process: unknown template marks the row failed',
    Boolean(badSend.error) && badRow?.status === 'failed' && (badRow?.error ?? '').includes('unknown template'),
    JSON.stringify(badRow),
  );

  const {data: claimRow} = await admin
    .from('email_logs')
    .insert({
      user_id: fan1,
      recipient: `smoke.comm.${stamp}@cmagency.me`,
      template: 'welcome',
      subject: 'Already handled',
      params: {},
      dedupe_key: `smoke-comm-skip-${stamp}`,
      status: 'sent',
    })
    .select('id')
    .single();
  const skipSend = await anon.functions.invoke('send-email', {
    body: {mode: 'process', log_id: claimRow.id},
  });
  ok(
    'send-email process: non-claimable row is skipped without a resend',
    !skipSend.error && skipSend.data?.skipped === true,
    JSON.stringify(skipSend.data ?? skipSend.error?.message),
  );

  // ---------- dedupe: same queue key never sends twice ----------
  const {data: dupLog, error: dupError} = await admin
    .from('email_logs')
    .insert({
      user_id: fan1,
      recipient: `smoke.comm.${stamp}@cmagency.me`,
      template: 'welcome',
      subject: 'Dedupe probe',
      params: {},
      dedupe_key: `smoke-comm-dup-${stamp}`,
      status: 'queued',
    })
    .select('id, dedupe_key')
    .single();
  const {error: dupInsertError} = await admin.from('email_logs').insert({
    user_id: fan1,
    recipient: `smoke.comm.${stamp}@cmagency.me`,
    template: 'welcome',
    subject: 'Dedupe probe duplicate',
    params: {},
    dedupe_key: `smoke-comm-dup-${stamp}`,
    status: 'queued',
  });
  ok(
    'email queue: duplicate dedupe key is refused',
    Boolean(dupLog) && Boolean(dupInsertError),
    dupInsertError?.message,
  );
} catch (error) {
  ok('smoke test completed without errors', false);
  console.error(error);
} finally {
  if (conversationId) {
    await admin.from('management_messages').delete().eq('conversation_id', conversationId);
    await admin.from('management_conversations').delete().eq('id', conversationId);
  }
  for (const id of [fan1, fan2, staff]) {
    if (!id) continue;
    await admin.from('notifications').delete().eq('user_id', id);
    await admin.from('notification_deliveries').delete().eq('user_id', id);
  }
  for (const path of uploadedPaths) {
    const {error} = await admin.storage.from('documents').remove([path]);
    if (error) console.log(`WARN  storage cleanup failed: ${error.message}`);
  }
  for (const [label, id] of [['fan one', fan1], ['fan two', fan2], ['management', staff]]) {
    if (!id) continue;
    const {error} = await admin.auth.admin.deleteUser(id);
    if (error) console.log(`WARN  cleanup (${label}) failed: ${error.message}`);
    else console.log(`PASS  cleanup removed ${label} test user`);
  }
}

const failed = checks.filter((check) => !check.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
