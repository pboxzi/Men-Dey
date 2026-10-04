// Live smoke test for the applicant entry flow (real Supabase project).
//
// Path A — public signup (this project runs with mailer_autoconfirm = true):
//   signUp with acknowledgement + application metadata → session immediately,
//   profile active, applicant status 'new', acknowledgement stored.
// Path B — confirmation-link mode (as if "Confirm email" were enabled):
//   admin createUser (unconfirmed) → pending/draft → confirm → active/'new'.
// Shared: sign-in, own-row RLS read, other-row RLS denial, sign-out, cleanup.
// No emails are sent in either path.

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
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
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
    reason_for_joining: 'Verifying the applicant entry flow end to end.',
    platform_motivation: 'Ensuring the platform works correctly for real applicants.',
    connection_interest: 'A virtual meeting to validate the pipeline.',
    experience_interests: ['virtual_meeting', 'text_communication'],
    contact_email_ok: true,
    contact_phone_ok: false,
    contact_whatsapp_ok: false,
    whatsapp_number: '',
  };
}

let userA = null;
let userB = null;

try {
  // ---------- Path A: public signup (autoconfirm mode) ----------
  const emailA = `smoke.patha.${stamp}@cmagency.me`;
  const client = createClient(url, anonKey, {auth: {persistSession: false}});

  const {data: signedUp, error: signUpError} = await client.auth.signUp({
    email: emailA,
    password: `Smoke-PathA-${stamp}-pw`,
    options: {data: applicationFor('Smoke Path A')},
  });
  if (signUpError) throw new Error(`signUp: ${signUpError.message}`);
  userA = signedUp.user?.id ?? null;
  ok('path A: public signup with acknowledgement accepted', Boolean(userA), userA);

  const {data: profileA} = await admin
    .from('profiles')
    .select('full_name, phone, country, city, occupation, preferred_contact_method, status, email_verified_at')
    .eq('id', userA)
    .single();
  ok(
    'path A: profile persisted and active',
    profileA?.full_name === 'Smoke Path A' &&
      profileA?.phone === '+44 20 7946 0000' &&
      profileA?.occupation === 'Quality Tester' &&
      profileA?.status === 'active' &&
      Boolean(profileA?.email_verified_at),
    JSON.stringify(profileA),
  );

  const {data: applicantA} = await admin
    .from('applicant_profiles')
    .select('status, reason_for_joining, platform_motivation, connection_interest, experience_interests, contact_email_ok, application_completed_at, submitted_at')
    .eq('user_id', userA)
    .single();
  ok(
    "path A: application persisted, applicant status 'new'",
    applicantA?.status === 'new' &&
      applicantA?.reason_for_joining?.includes('applicant entry flow') &&
      applicantA?.experience_interests?.includes('virtual_meeting') &&
      applicantA?.experience_interests?.includes('text_communication') &&
      applicantA?.contact_email_ok === true &&
      Boolean(applicantA?.application_completed_at) &&
      Boolean(applicantA?.submitted_at),
    JSON.stringify(applicantA),
  );

  const {data: ackA} = await admin
    .from('acknowledgements')
    .select('acknowledgement_version, accepted_at')
    .eq('user_id', userA)
    .single();
  ok(
    'path A: acknowledgement version stored in Supabase',
    ackA?.acknowledgement_version === 1 && Boolean(ackA?.accepted_at),
    JSON.stringify(ackA),
  );

  // Session returned by autoconfirm signup → RLS reads.
  const {data: sessionA} = await client.auth.getSession();
  ok('path A: session issued on signup', Boolean(sessionA.session));

  const {data: ownA} = await client
    .from('profiles')
    .select('id')
    .eq('id', userA);
  ok('path A: own profile readable (RLS)', ownA?.length === 1, `rows=${ownA?.length}`);

  const {data: othersA} = await client
    .from('profiles')
    .select('id')
    .neq('id', userA)
    .limit(5);
  ok('path A: other profiles hidden (RLS)', othersA?.length === 0, `rows=${othersA?.length}`);

  await client.auth.signOut();
  const {data: afterSignOut} = await client.auth.getSession();
  ok('path A: sign out clears session', afterSignOut.session === null);

  // ---------- Path B: confirmation-link mode (simulated) ----------
  const emailB = `smoke.pathb.${stamp}@cmagency.me`;
  const {data: createdB, error: createError} = await admin.auth.admin.createUser({
    email: emailB,
    password: `Smoke-PathB-${stamp}-pw`,
    email_confirm: false,
    user_metadata: applicationFor('Smoke Path B'),
  });
  if (createError) throw new Error(`createUser: ${createError.message}`);
  userB = createdB.user.id;

  const {data: beforeConfirm} = await admin
    .from('profiles')
    .select('status, email_verified_at')
    .eq('id', userB)
    .single();
  const {data: applicantBefore} = await admin
    .from('applicant_profiles')
    .select('status')
    .eq('user_id', userB)
    .single();
  ok(
    'path B: unconfirmed account starts pending/draft',
    beforeConfirm?.status === 'pending' &&
      beforeConfirm?.email_verified_at === null &&
      applicantBefore?.status === 'draft',
    `${JSON.stringify(beforeConfirm)} ${JSON.stringify(applicantBefore)}`,
  );

  const {error: confirmError} = await admin.auth.admin.updateUserById(userB, {
    email_confirm: true,
  });
  if (confirmError) throw new Error(`confirm: ${confirmError.message}`);

  const {data: afterConfirm} = await admin
    .from('profiles')
    .select('status, email_verified_at')
    .eq('id', userB)
    .single();
  const {data: applicantAfter} = await admin
    .from('applicant_profiles')
    .select('status, submitted_at')
    .eq('user_id', userB)
    .single();
  ok(
    "path B: verification activates account, applicant -> 'new'",
    afterConfirm?.status === 'active' &&
      Boolean(afterConfirm?.email_verified_at) &&
      applicantAfter?.status === 'new' &&
      Boolean(applicantAfter?.submitted_at),
    `${JSON.stringify(afterConfirm)} ${JSON.stringify(applicantAfter)}`,
  );

  const {data: signInB, error: signInError} = await client.auth.signInWithPassword({
    email: emailB,
    password: `Smoke-PathB-${stamp}-pw`,
  });
  if (signInError) throw new Error(`signIn: ${signInError.message}`);
  ok('path B: sign in after verification', Boolean(signInB.session));
  await client.auth.signOut();
} catch (error) {
  ok('smoke test completed without errors', false);
  console.error(error);
} finally {
  for (const [label, id] of [['path A', userA], ['path B', userB]]) {
    if (!id) continue;
    const {error} = await admin.auth.admin.deleteUser(id);
    if (error) console.log(`WARN  cleanup (${label}) failed: ${error.message}`);
    else console.log(`PASS  cleanup removed ${label} test user`);
  }
}

const failed = checks.filter((check) => !check.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
