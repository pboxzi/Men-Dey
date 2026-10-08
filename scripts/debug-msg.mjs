import puppeteer from 'puppeteer-core';

const ROLE = process.argv[2] || 'user';
const MANAGER_ID = '33333333-3333-4333-8333-333333333333';
const MEMBER_ID = '11111111-1111-4111-8111-111111111111';

const profile =
  ROLE === 'management'
    ? {
        id: MANAGER_ID,
        email: 'office@example.com',
        full_name: 'Test Manager',
        role: 'management',
        email_verified_at: '2026-01-02T00:00:00.000Z',
        created_at: '2026-10-07T12:00:00.000Z',
      }
    : {
        id: MEMBER_ID,
        email: 'test.member@example.com',
        full_name: 'Test Member',
        role: 'user',
        email_verified_at: '2026-01-02T00:00:00.000Z',
        created_at: '2026-10-07T12:00:00.000Z',
      };

const session = {
  access_token: 'eyJhbGciOiJIUzI1NiJ9.fake.fake',
  token_type: 'bearer',
  expires_in: 31536000,
  expires_at: 4102444800,
  refresh_token: 'fake-refresh-token',
  user: {
    id: profile.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: profile.email,
    email_confirmed_at: '2026-01-02T00:00:00.000Z',
    created_at: '2026-10-07T12:00:00.000Z',
    updated_at: '2026-10-07T12:00:00.000Z',
    app_metadata: {},
    user_metadata: {},
    identities: [],
    is_anonymous: false,
  },
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, range',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
  'access-control-expose-headers': 'content-range, preference-applied',
};

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({width: 390, height: 844, isMobile: true});
await page.evaluateOnNewDocument((v) => localStorage.setItem('gam-auth', v), JSON.stringify(session));
await page.setRequestInterception(true);
page.on('request', (req) => {
  const url = req.url();
  if (!url.includes('supabase.co')) return void req.continue();
  const path = new URL(url).pathname;
  if (req.method() !== 'OPTIONS') {
    console.log('REQ', req.method(), path);
    console.log('   headers:', JSON.stringify(req.headers()));
  }
  const preflight = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': String(req.headers()['access-control-request-method'] || 'GET') + ', POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
    'access-control-allow-headers': String(req.headers()['access-control-request-headers'] || '*'),
    'access-control-max-age': '86400',
  };
  const ok = (body) =>
    Promise.resolve(
      req.respond({
        status: 200,
        headers: {...CORS, ...preflight, 'content-type': 'application/json'},
        body,
      })
    ).catch((e) => console.log('respond failed:', e.message));
  try {
    if (req.method() === 'OPTIONS') return void ok('');
    if (path.startsWith('/rest/v1/profiles')) {
      const single =
        String(req.headers()['accept'] || '').includes('vnd.pgrst.object') || path.includes('id=eq.');
      console.log('   → single:', single, JSON.stringify(single ? profile : [profile]));
      return void ok(JSON.stringify(single ? profile : [profile]));
    }
    if (path.startsWith('/rest/v1/')) {
      const head = req.method() === 'HEAD';
      return void ok(head ? '' : '[]');
    }
    if (path.startsWith('/auth/v1/'))
      return void ok(JSON.stringify(path.includes('/user') ? session.user : session));
    return void ok('[]');
  } catch (e) {
    console.log('respond failed', e.message);
    return void req.abort();
  }
});
page.on('requestfailed', (r) => {
  if (r.url().includes('supabase')) console.log('FAILED', r.method(), r.url().slice(0, 120), r.failure()?.errorText);
});
page.on('console', (m) => console.log('CONSOLE', m.type(), m.text().slice(0, 200)));
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)));

const ROUTE = process.argv[3] || '/dashboard/messages';
await page.goto('http://localhost:5173' + ROUTE, {waitUntil: 'networkidle2', timeout: 45000}).catch((e) => console.log('goto', e.message));
await new Promise((r) => setTimeout(r, 3000));

const state = await page.evaluate(() => ({
  url: location.href,
  text: document.body.innerText.slice(0, 400),
  ls: localStorage.getItem('gam-auth') ? 'present' : 'absent',
}));
console.log('STATE', JSON.stringify(state, null, 2));
await browser.close();
