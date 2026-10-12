// Share-as-image regression test: the generated summary PNG must contain the user's uploaded photo
// (or the drawn bottle when there is no photo), in WebKit and Chromium, EN and HE. A capture that
// would be missing the photo must be blocked with an error instead of being shared.
// Usage: URL=http://localhost:8767/ OUT=./share-shots PW_CORE=... CHROME_PATH=... node tests/e2e-share-image.mjs
import fs from 'node:fs';
import path from 'node:path';
const { chromium, webkit } = await import(process.env.PW_CORE || 'playwright-core');
const APP_URL = process.env.URL || 'http://localhost:8767/';
const OUT = (process.env.OUT || './share-shots').replace(/\/$/, '') + '/';
const PHOTO = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'iphone-photo.jpg'); // 4032x3024, EXIF orientation 6
fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) fails++; };

const DRAFT = {
  wineName: 'TESTTEST', vintage: '2026', country: 'Testistan', region: '', alcohol: '14.0%', vfm: 4,
  bottleImage: null, useGenericBottle: true,
  color: { id: 'ruby', name: 'Ruby', hex: '#8c1a2e', intensity: 'Deep', clarity: 'Clear', rimVariation: 'Ruby Edge' },
  nose: { intensity: 'Medium(+)', development: 'Youthful', aromas: ['Red Cherry', 'Strawberry', 'Cranberry', 'Red Plum', 'Pomegranate'] },
  palate: { sweetness: 'Off-Dry', acidity: 'Low', tannin: 'Low', alcoholLevel: 'Low (<11%)', body: 'Light', flavorIntensity: 'Light', finish: 'Medium (15-30s)', finishSeconds: 15 },
  conclusion: { score: 89, price: '77', notes: 'Hsbdbvdvxvdhdhsbsvvdxe this was the best day ever and it made my heart smile' }
};

// in-page: decode the shared PNG and measure a region (given in card CSS px) against an expected image
async function analyse({ dataUrl, region, refSrc, cardW }) {
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const img = await load(dataUrl);
  const s = img.naturalWidth / cardW;
  const r = { x: Math.round(region.x * s), y: Math.round(region.y * s), w: Math.round(region.w * s), h: Math.round(region.h * s) };
  const c = document.createElement('canvas'); c.width = r.w; c.height = r.h;
  const g = c.getContext('2d'); g.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
  const px = g.getImageData(0, 0, r.w, r.h).data;
  const stats = (d) => { let n = 0, m = 0, m2 = 0; for (let i = 0; i < d.length; i += 4) { const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; n++; m += l; m2 += l * l; } m /= n; return { mean: m, sd: Math.sqrt(Math.max(0, m2 / n - m * m)) }; };
  const out = { size: [img.naturalWidth, img.naturalHeight], ...stats(px) };
  if (refSrc) { // expected: the photo drawn object-fit:cover into the same box
    const ref = await load(refSrc);
    const k = Math.max(r.w / ref.naturalWidth, r.h / ref.naturalHeight), dw = ref.naturalWidth * k, dh = ref.naturalHeight * k;
    const c2 = document.createElement('canvas'); c2.width = r.w; c2.height = r.h;
    const g2 = c2.getContext('2d'); g2.drawImage(ref, (r.w - dw) / 2, (r.h - dh) / 2, dw, dh);
    const q = g2.getImageData(0, 0, r.w, r.h).data;
    // compare away from the rounded corners (inner 80%)
    let diff = 0, n = 0;
    for (let y = Math.round(r.h * 0.1); y < r.h * 0.9; y += 2) for (let x = Math.round(r.w * 0.1); x < r.w * 0.9; x += 2) {
      const i = (y * r.w + x) * 4; diff += (Math.abs(px[i] - q[i]) + Math.abs(px[i + 1] - q[i + 1]) + Math.abs(px[i + 2] - q[i + 2])) / 3; n++;
    }
    out.diff = diff / n;
  }
  return out;
}

for (const [engName, engine] of [['webkit', webkit], ['chromium', chromium]]) {
  const browser = await engine.launch(engName === 'chromium' ? { ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] } : {});
  for (const lang of ['en', 'he']) for (const kind of ['photo', 'nophoto', 'broken']) {
    if (kind === 'broken' && lang === 'he') continue;
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const dialogs = []; page.on('dialog', d => { dialogs.push(d.message()); d.accept(); });
    await page.goto(APP_URL + 'manifest.json');
    const draft = kind === 'broken' ? { ...DRAFT, bottleImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP////8=', useGenericBottle: false } : DRAFT;
    await page.evaluate(({ d, lang }) => { localStorage.clear(); localStorage.setItem('winitis_active_draft_note', JSON.stringify(d)); localStorage.setItem('winitis_lang', lang); localStorage.setItem('winitis_active_step', '0'); }, { d: draft, lang });
    await page.goto(APP_URL); await page.waitForTimeout(700);
    await page.locator('.step-item').nth(3).click(); await page.waitForTimeout(500);
    if (kind === 'photo') {
      await page.locator('.verdict-card input[type=file]').setInputFiles(PHOTO);
      await page.waitForSelector('img.custom-bottle-img', { timeout: 15000 });
      await page.waitForFunction(() => { const i = document.querySelector('img.custom-bottle-img'); return i && i.complete && i.naturalWidth > 0; });
    }
    // capture what would be shared: a share-capable "phone"
    await page.evaluate(() => {
      window.__shared = null;
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
      Object.defineProperty(navigator, 'share', { configurable: true, value: async (d) => { window.__shared = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(d.files[0]); }); } });
      HTMLAnchorElement.prototype.click = function () { if (this.download) window.__downloaded = this.href; };
    });
    const geo = await page.evaluate(() => {
      const card = document.querySelector('.verdict-card').getBoundingClientRect();
      const box = (document.querySelector('img.custom-bottle-img') || document.querySelector('.generic-wine-bottle-wrap svg') || document.querySelector('.verdict-bottle-frame')).getBoundingClientRect();
      return { cardW: card.width, region: { x: box.left - card.left, y: box.top - card.top, w: box.width, h: box.height }, src: document.querySelector('img.custom-bottle-img')?.src || null };
    });
    await page.locator('.nav-buttons .btn:has(svg.lucide-share2)').click();
    await page.waitForFunction(() => window.__shared || window.__downloaded || document.querySelector('.share-error-toast'), null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(300);
    const res = await page.evaluate(() => ({ shared: window.__shared, downloaded: window.__downloaded, err: document.querySelector('.share-error-toast')?.textContent || null }));
    const tag = `${engName} ${lang} ${kind}`;
    if (kind === 'broken') {
      check(!res.shared && !res.downloaded && !!res.err, `${tag}: photo that cannot be decoded -> sharing blocked with an error ("${res.err}")`);
    } else {
      check(!!res.shared, `${tag}: share sheet received a PNG${res.err ? ` (error: ${res.err})` : ''}`);
      if (res.shared) {
        fs.writeFileSync(`${OUT}share-${engName}-${lang}-${kind}.png`, Buffer.from(res.shared.split(',')[1], 'base64'));
        const a = await page.evaluate(analyse, { dataUrl: res.shared, region: geo.region, refSrc: kind === 'photo' ? geo.src : null, cardW: geo.cardW });
        if (kind === 'photo') check(a.sd > 20 && a.diff < 28, `${tag}: photo region of the shared image matches the uploaded photo (sd ${a.sd.toFixed(1)}, mean diff ${a.diff.toFixed(1)}/255, ${a.size.join('x')})`);
        else check(a.sd > 12, `${tag}: drawn bottle present in the shared image (sd ${a.sd.toFixed(1)})`);
      }
    }
    check(errors.length === 0, `${tag}: no page errors ${errors.join(' | ')}`);
    await ctx.close();
  }
  await browser.close();
}
console.log(fails ? `${fails} FAILURE(S)` : 'ALL CHECKS PASSED');
process.exit(fails ? 1 : 0);
