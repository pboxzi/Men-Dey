/**
 * Responsive audit: renders the running site in headless Chrome at mobile
 * widths and reports (a) horizontal overflow (scrollWidth > clientWidth),
 * (b) the specific elements that stick out past the viewport, and (c) key
 * computed typography values so browser-dependent sizing is visible.
 *
 *   node scripts/measure-responsive.mjs [baseURL]
 */
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5173';

const WIDTHS = [320, 360, 375, 390, 412, 430, 768];
const HEIGHTS = [640, 740, 844, 900];
const ROUTES = ['/'];

const probe = () => {
  const doc = document.documentElement;
  const vw = doc.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 90),
        left: Math.round(r.left),
        right: Math.round(r.right),
        w: Math.round(r.width),
        text: (el.textContent || '').trim().slice(0, 40),
      });
    }
  }
  const title = document.querySelector('.gate-title');
  const lede = document.querySelector('.gate-lede');
  return {
    vw,
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    innerWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
    titleFont: title ? getComputedStyle(title).fontSize : null,
    ledeFont: lede ? getComputedStyle(lede).fontSize : null,
    rootFont: getComputedStyle(doc).fontSize,
    textSizeAdjust: getComputedStyle(doc).webkitTextSizeAdjust || getComputedStyle(doc).textSizeAdjust,
    offenders: offenders.slice(0, 8),
    offenderCount: offenders.length,
  };
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
});

const results = [];

for (const mobile of [true, false]) {
  const page = await browser.newPage();
  for (const width of WIDTHS) {
    for (const height of HEIGHTS) {
      await page.setViewport({width, height, deviceScaleFactor: 3, isMobile: mobile, hasTouch: mobile});
      for (const route of ROUTES) {
        await page.goto(BASE + route, {waitUntil: 'networkidle2', timeout: 45000});
        await page.evaluate(() => document.fonts && document.fonts.ready);
        await new Promise((r) => setTimeout(r, 400));
        const data = await page.evaluate(probe);
        results.push({mobile, width, height, route, ...data});
      }
    }
  }
  await page.close();
}

await browser.close();

const fmt = (r) =>
  `${r.mobile ? 'mobile' : 'desktop'} ${r.width}x${r.height} ${r.route} | ` +
  `scrollW=${r.scrollWidth} clientW=${r.clientWidth} inner=${r.innerWidth} ` +
  `overflow=${r.scrollWidth > r.clientWidth ? 'YES' : 'no'} (${r.offenderCount} el) | ` +
  `title=${r.titleFont} lede=${r.ledeFont} root=${r.rootFont} tsa=${r.textSizeAdjust}`;

for (const r of results) {
  console.log(fmt(r));
  if (r.offenderCount > 0) {
    for (const o of r.offenders) {
      console.log(`    ! ${o.tag}.${o.cls} [${o.left}..${o.right}] w=${o.w} "${o.text}"`);
    }
  }
}
