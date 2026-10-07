/**
 * Mobile audit for the four message screens:
 *   /dashboard/messages, /dashboard/messages/:id,
 *   /management/messages,  /management/messages/:id
 *
 * Seeds a fake Supabase session (auth.storageKey = 'gam-auth') and stubs every
 * *.supabase.co REST/auth response so the authenticated screens can render in
 * headless Chrome at phone widths without real credentials.
 *
 *   node scripts/messages-audit.mjs [baseUrl] [outDir]
 *
 * Requires `npm i --no-save puppeteer-core` and a dev server (e.g. `npm run dev`).
 */
import puppeteer from 'puppeteer-core';
import {mkdirSync} from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = process.argv[3] || process.env.TEMP || '.';

const MEMBER_ID = '11111111-1111-4111-8111-111111111111';
const MANAGER_ID = '33333333-3333-4333-8333-333333333333';
const NOW = '2026-10-07T12:00:00.000Z';

const baseUser = {
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2026-01-02T00:00:00.000Z',
  created_at: NOW,
  updated_at: NOW,
  app_metadata: {provider: 'email', providers: ['email']},
  user_metadata: {},
  identities: [],
  is_anonymous: false,
};

const memberProfile = {
  id: MEMBER_ID,
  email: 'test.member@example.com',
  full_name: 'Test Member',
  role: 'user',
  email_verified_at: '2026-01-02T00:00:00.000Z',
  avatar_url: null,
  created_at: NOW,
};

const managerProfile = {
  id: MANAGER_ID,
  email: 'office@example.com',
  full_name: 'Test Manager',
  role: 'management',
  email_verified_at: '2026-01-02T00:00:00.000Z',
  avatar_url: null,
  created_at: NOW,
};

function sessionFor(role) {
  const profile = role === 'user' ? memberProfile : managerProfile;
  return {
    access_token: 'eyJhbGciOiJIUzI1NiJ9.fake.fake',
    token_type: 'bearer',
    expires_in: 31536000,
    expires_at: 4102444800,
    refresh_token: 'fake-refresh-token',
    user: {...baseUser, id: profile.id, email: profile.email},
  };
}

const memberPerson = {id: MEMBER_ID, email: memberProfile.email, full_name: 'Test Member'};

const conversations = [
  {
    id: 'c1',
    user_id: MEMBER_ID,
    subject: 'Conversation with management — Test Member',
    status: 'open',
    assigned_to: null,
    created_at: NOW,
    updated_at: NOW,
    user: {email: memberPerson.email, full_name: memberPerson.full_name},
  },
  {
    id: 'c2',
    user_id: MEMBER_ID,
    subject: 'Membership renewal question about the annual plan and guest tickets',
    status: 'waiting',
    assigned_to: null,
    created_at: NOW,
    updated_at: NOW,
    user: {email: memberPerson.email, full_name: memberPerson.full_name},
  },
  {
    id: 'c3',
    user_id: MEMBER_ID,
    subject: 'Signed memorabilia collection',
    status: 'closed',
    assigned_to: null,
    created_at: NOW,
    updated_at: NOW,
    user: {email: memberPerson.email, full_name: memberPerson.full_name},
  },
];

const messages = [
  {
    id: 'm1',
    conversation_id: 'c1',
    sender_id: MANAGER_ID,
    is_internal: false,
    body: 'Welcome to the community — this is management. Write to us here whenever you need anything at all.',
    attachments: [],
    created_at: '2026-10-07T10:00:00.000Z',
    read_at: null,
  },
  {
    id: 'm2',
    conversation_id: 'c1',
    sender_id: MEMBER_ID,
    is_internal: false,
    body: 'Thank you! I had a question about the private screening next month — is there a plus-one policy for members who joined this quarter?',
    attachments: [],
    created_at: '2026-10-07T10:05:00.000Z',
    read_at: '2026-10-07T10:06:00.000Z',
  },
  {
    id: 'm3',
    conversation_id: 'c1',
    sender_id: MANAGER_ID,
    is_internal: false,
    body: 'One guest is included. We will confirm the details by email a week before the event.',
    attachments: [
      {
        name: 'screening-details-and-parking-information.pdf',
        path: 'x/y/z.pdf',
        size: 102400,
        mime: 'application/pdf',
      },
    ],
    created_at: '2026-10-07T10:12:00.000Z',
    read_at: null,
  },
  {
    id: 'm4',
    conversation_id: 'c1',
    sender_id: MEMBER_ID,
    is_internal: false,
    body: 'Perfect, thank you.',
    attachments: [],
    created_at: '2026-10-07T10:15:00.000Z',
    read_at: null,
  },
  {
    id: 'm5',
    conversation_id: 'c2',
    sender_id: MEMBER_ID,
    is_internal: false,
    body: 'Question about my renewal date.',
    attachments: [],
    created_at: '2026-10-06T09:00:00.000Z',
    read_at: '2026-10-06T09:30:00.000Z',
  },
];

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
  'access-control-expose-headers': 'content-range, preference-applied, sb-gateway-request-id',
};

const json = (body, extra = {}) => ({
  status: 200,
  headers: {...CORS, 'content-type': 'application/json', ...extra},
  body: JSON.stringify(body),
});

let activeRole = 'user';

function routeSupabase(req) {
  const path = new URL(req.url()).pathname;
  const wantsObject = String(req.headers()['accept'] || '').includes('vnd.pgrst.object');
  const isHead = req.method() === 'HEAD';
  const activeProfile = activeRole === 'user' ? memberProfile : managerProfile;
  const activeSession = sessionFor(activeRole);

  // Echo exactly the headers Chrome asks to send: supabase-js ships headers
  // (x-supabase-api-version, ...) that a hand-written allow-list would miss,
  // and one missing header fails the whole preflight with a CORS error.
  const preflight = {
    'access-control-allow-methods':
      String(req.headers()['access-control-request-method'] || 'GET') +
      ', POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
    'access-control-allow-headers': String(req.headers()['access-control-request-headers'] || '*'),
    'access-control-max-age': '86400',
  };

  if (req.method() === 'OPTIONS') return {status: 200, headers: {...CORS, ...preflight}, body: ''};
  if (path.startsWith('/auth/v1/token')) return json(activeSession);
  if (path.startsWith('/auth/v1/user')) return json(activeSession.user);
  if (path.startsWith('/rest/v1/profiles'))
    return json(wantsObject ? activeProfile : [activeProfile, memberProfile, managerProfile]);
  if (path.startsWith('/rest/v1/management_conversations'))
    return json(wantsObject ? conversations[0] : conversations);
  if (path.startsWith('/rest/v1/management_messages')) {
    if (isHead) return {status: 200, headers: {...CORS, 'content-range': '*/3'}, body: ''};
    return json(messages);
  }
  if (path.startsWith('/rest/v1/notifications')) {
    if (isHead) return {status: 200, headers: {...CORS, 'content-range': '*/1'}, body: ''};
    return json([{id: 'n1', read_at: null}]);
  }
  if (path.startsWith('/rest/v1/')) {
    if (isHead) return {status: 200, headers: {...CORS, 'content-range': '*/0'}, body: ''};
    return json([]);
  }
  return json([]);
}

const probe = () => {
  const d = document.documentElement;
  const vh = window.innerHeight;
  const cw = d.clientWidth;

  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > cw + 1 || r.left < -1) {
      offenders.push(
        `${el.tagName.toLowerCase()}.${String(el.className || '').slice(0, 70)} ` +
          `[${Math.round(r.left)}..${Math.round(r.right)}] "${(el.textContent || '').trim().slice(0, 30)}"`
      );
    }
  }

  const rectOf = (sel) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width)};
  };

  // Composer: member thread uses #message-draft, management thread uses the
  // footer textarea.
  const composerEl =
    document.querySelector('#message-draft') || document.querySelector('footer textarea');
  const composer = rectOf(composerEl);
  const scroller = rectOf('main [class*="overflow-y-auto"]');
  const bottomNav = rectOf('nav[aria-label="Primary mobile"], header nav, header');
  const header = rectOf('header');

  return {
    sw: d.scrollWidth,
    cw,
    sh: d.scrollHeight,
    ih: vh,
    offenders,
    header,
    composer,
    scroller,
    bottomNav,
    composerOffscreen: composer ? composer.bottom > vh + 1 || composer.top < header.bottom - 1 : null,
    composerHidden: composer ? composer.top >= vh || composer.bottom <= 0 : null,
    head: document.body.innerText.replace(/\s+/g, ' ').slice(0, 120),
  };
};

const ROUTES = [
  {name: 'list', path: '/dashboard/messages', role: 'user'},
  {name: 'thread', path: '/dashboard/messages/c1', role: 'user'},
  {name: 'mgmt-inbox', path: '/management/messages', role: 'management'},
  {name: 'mgmt-thread', path: '/management/messages/c1', role: 'management'},
];
const SIZES = [
  [320, 568],
  [360, 640],
  [390, 740],
  [390, 844],
  [412, 915],
  [430, 932],
  [768, 1024],
];
const SHOT_SIZES = new Set(['360x640', '390x740', '390x844', '412x915']);

mkdirSync(OUT, {recursive: true});

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
});

let fails = 0;

for (const route of ROUTES) {
  activeRole = route.role;
  const session = sessionFor(route.role);

  for (const [w, h] of SIZES) {
    const page = await browser.newPage();
    await page.setViewport({width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
    await page.evaluateOnNewDocument(
      (value) => {
        try {
          localStorage.setItem('gam-auth', value);
        } catch {
          /* ignore */
        }
      },
      JSON.stringify(session)
    );
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (!req.url().includes('supabase.co')) return void req.continue();
      try {
        return void req.respond(routeSupabase(req));
      } catch {
        return void req.abort();
      }
    });
    page.on('pageerror', () => {});

    await page.goto(BASE + route.path, {waitUntil: 'networkidle2', timeout: 45000}).catch(() => {});
    const rendered = await page
      .waitForFunction(() => !document.body.innerText.includes('LOADING'), {timeout: 10000})
      .then(() => true)
      .catch(() => false);
    await new Promise((r) => setTimeout(r, 800));

    const redirected = page.url().includes('/sign-in') || page.url().includes('/verify-email');
    const m =
      redirected || !rendered
        ? {
            sw: 0,
            cw: 0,
            sh: 0,
            ih: h,
            offenders: [
              redirected ? 'REDIRECTED TO ' + page.url() : 'STILL LOADING (content never rendered)',
            ],
            head: '',
          }
        : await page.evaluate(probe);

    const horizontalFail = m.sw > m.cw || m.offenders.length > 0;
    if (horizontalFail || redirected || !rendered) fails++;

    console.log(
      `${route.name} ${w}x${h}: scrollW=${m.sw} clientW=${m.cw} doc=${m.sh}/${m.ih} ` +
        `offenders=${m.offenders.length}` +
        (m.composer ? ` composer=[${m.composer.top}..${m.composer.bottom}]` : '') +
        (m.scroller ? ` thread=[${m.scroller.top}..${m.scroller.bottom}]` : '') +
        (m.bottomNav ? ` topOrNav=[${m.bottomNav.top}..${m.bottomNav.bottom}]` : '') +
        `${m.composerOffscreen ? ' COMPOSER-BLOCKED' : ''}` +
        `${horizontalFail ? ' FAIL' : ' ok'}`
    );
    for (const o of m.offenders) console.log('    ! ' + o);
    if (m.head) console.log('    > ' + m.head);

    if (SHOT_SIZES.has(`${w}x${h}`)) {
      await page.screenshot({path: `${OUT}\\msg-${route.name}-${w}x${h}.png`});
    }
    await page.close();
  }
}

console.log(fails === 0 ? 'ALL PASS' : fails + ' FAILURES');
await browser.close();
