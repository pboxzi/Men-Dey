import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.argv[2] || 'http://localhost:5174';
const OUT = process.argv[3] || process.env.TEMP || '.';

const SHOTS = [
  {name: 'landing-320x568', w: 320, h: 568},
  {name: 'landing-360x640', w: 360, h: 640},
  {name: 'landing-390x740', w: 390, h: 740},
  {name: 'landing-390x844', w: 390, h: 844},
  {name: 'landing-412x915', w: 412, h: 915},
  {name: 'landing-430x932', w: 430, h: 932},
  {name: 'landing-768x1024', w: 768, h: 1024},
  {name: 'landing-1440x900', w: 1440, h: 900},
  {name: 'signin-390x844', w: 390, h: 844, route: '/sign-in'},
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=2'],
});

for (const s of SHOTS) {
  const page = await browser.newPage();
  await page.setViewport({width: s.w, height: s.h, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
  await page.goto(BASE + (s.route || '/'), {waitUntil: 'networkidle2', timeout: 45000});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({path: `${OUT}\\${s.name}.png`});
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  console.log(`${s.name}: scrollW=${m.sw} clientW=${m.cw} ${m.sw > m.cw ? 'OVERFLOW' : 'ok'}`);
  await page.close();
}

await browser.close();
