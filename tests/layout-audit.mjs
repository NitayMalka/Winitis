// Cross-device / cross-engine layout regression audit for Winitis.
// For every device x engine x language x screen it checks:
//   1. no horizontal page overflow
//   2. no two text runs overlap (tight text-range boxes, not element boxes)
//   3. no text clipped by an overflow:hidden ancestor (unless deliberately ellipsised) or pushed outside the viewport
//   4. summary card: key blocks (header, bottle, gauges/attributes, aromas, notes, VFM) don't overlap and stay inside the card
//   5. bottle label (SVG) text fits inside the label
// Usage:  npm run build && npx vite preview --port 8767   (in another shell)
//         URL=http://localhost:8767/ OUT=./layout-shots node tests/layout-audit.mjs [--engines=webkit,chromium] [--devices=se,desk1366] [--langs=en,he]
// Needs playwright-core (PW_CORE=<path to playwright-core/index.mjs> if not resolvable) with WebKit installed
// (npx playwright-core install webkit); Chromium uses CHROME_PATH or Playwright's own build.
const { chromium, webkit } = await import(process.env.PW_CORE || 'playwright-core');
import fs from 'node:fs';
const URL = process.env.URL || 'http://localhost:8767/';
const OUT = (process.env.OUT || './after').replace(/\/$/, '') + '/';
const arg = (k) => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
fs.mkdirSync(OUT, { recursive: true });

export const DEVICES = [
  { id: 'se', label: 'iPhone SE 375x667', w: 375, h: 667, mobile: true },
  { id: 'ip14-tab', label: 'iPhone 14 Safari tab 390x664', w: 390, h: 664, mobile: true },
  { id: 'ip15-tab', label: 'iPhone 15 Chrome tab 393x660', w: 393, h: 660, mobile: true },
  { id: 'ip14-pwa', label: 'iPhone 14 PWA 390x844', w: 390, h: 844, mobile: true },
  { id: 'ip15', label: 'iPhone 15 393x852', w: 393, h: 852, mobile: true },
  { id: 'pixel7', label: 'Pixel 7 412x915', w: 412, h: 915, mobile: true },
  { id: 's8', label: 'Galaxy S8 360x740', w: 360, h: 740, mobile: true },
  { id: 'small', label: 'Small Android 360x640', w: 360, h: 640, mobile: true },
  { id: 'tablet', label: 'Tablet 768x1024', w: 768, h: 1024, mobile: true },
  { id: 'desk1366', label: 'Desktop 1366x768', w: 1366, h: 768, mobile: false },
  { id: 'desk1920', label: 'Desktop 1920x1080', w: 1920, h: 1080, mobile: false },
];
const ENGINES = (arg('engines') || 'webkit,chromium').split(',');
const ONLY = arg('devices') ? arg('devices').split(',') : null;
const LANGS = (arg('langs') || 'en,he').split(',');

const LONG_NOTE = {
  id: 'note_audit_1', wineName: 'The Revelator Red Blend', vintage: '2019', grape: 'Cabernet Sauvignon',
  country: 'Israel', region: 'Upper Galilee', alcohol: '14.5%', date: '2026-09-01',
  color: { id: 'garnet', name: 'Garnet', hex: '#701c18', intensity: 'Medium', clarity: 'Clear', rimVariation: 'Pale Garnet Rim' },
  nose: { intensity: 'Medium(+)', development: 'Developing', aromas: ['Blackberry', 'Blackcurrant', 'Plum', 'Dark Cherry', 'Vanilla', 'Cedar', 'Cinnamon / Sweet Spice', 'Oak', 'Leather', 'Tobacco', 'Black Pepper', 'Violet', "Grandma's Plum Jam Reduction"] },
  palate: { sweetness: 'Off-Dry', acidity: 'High', tannin: 'Medium(+)', alcoholLevel: 'High (≥14%)', body: 'Full-Bodied', flavorIntensity: 'Pronounced', finish: 'Long (45s+)', finishSeconds: 45 },
  conclusion: { score: 93, price: '$45', quality: 'Very Good', drinkWindow: 'Drink now or hold 5-8 years',
    notes: 'Balanced red wine evaluation displaying harmonious structure and lingering finish; pairs with lamb, aged cheeses and mushroom risotto. Hold 5 years.' },
  vfm: 4
};
const DRAFT = { ...LONG_NOTE, id: undefined, bottleImage: null, useGenericBottle: true };
delete DRAFT.id;
const SAVED = [LONG_NOTE, { ...LONG_NOTE, id: 'note_audit_2', wineName: 'Yarden Cabernet', conclusion: { ...LONG_NOTE.conclusion, score: 88, price: '₪180' } }];

// ---------------- in-page audit ----------------
function pageAudit(opts) {
  const { rootSel, card } = opts;
  const INTENTIONAL_CLIP = '.palate-carousel-picker';
  const vw = document.documentElement.clientWidth;
  const out = { overflowX: Math.round(document.documentElement.scrollWidth - vw), overlaps: [], clipped: [], blocks: [], label: [] };
  const root = (rootSel && document.querySelector(rootSel)) || document.body;
  const visible = (el) => el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true;
  const items = [];
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) {
    const t = tw.currentNode; const el = t.parentElement;
    if (!el || !t.data.trim()) continue;
    if (el.closest('svg, select, option, textarea, script, style, [aria-hidden="true"], .step-label-ghost')) continue;
    if (!visible(el)) continue;
    const r = document.createRange(); r.selectNodeContents(t);
    const rects = [...r.getClientRects()].filter(q => q.width > 0.5 && q.height > 0.5);
    if (!rects.length) continue;
    // the part actually painted: clipped by every overflow:hidden/clip/auto/scroll ancestor (incl. line-clamp boxes)
    let vis = rects.map(p => ({ left: p.left, right: p.right, top: p.top, bottom: p.bottom, height: p.height }));
    for (let anc = el; anc && anc !== document.body && vis.length; anc = anc.parentElement) {
      const cs = getComputedStyle(anc);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      const c = anc.getBoundingClientRect();
      vis = vis.map(p => ({ left: cs.overflowX === 'visible' ? p.left : Math.max(p.left, c.left), right: cs.overflowX === 'visible' ? p.right : Math.min(p.right, c.right),
        top: cs.overflowY === 'visible' ? p.top : Math.max(p.top, c.top), bottom: cs.overflowY === 'visible' ? p.bottom : Math.min(p.bottom, c.bottom), height: p.height }))
        .filter(p => p.right - p.left > 0.5 && p.bottom - p.top > 0.5);
    }
    items.push({ el, t, rects, vis, txt: t.data.trim().slice(0, 28) });
  }
  const tag = (it) => `"${it.txt}"`;
  // 2. overlapping text runs
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    for (const p of a.vis) for (const q of b.vis) {
      const ix = Math.min(p.right, q.right) - Math.max(p.left, q.left);
      const iy = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
      if (ix > 2 && iy > 0.35 * Math.min(p.height, q.height)) { out.overlaps.push(`${tag(a)} x ${tag(b)}`); break; }
    }
  }
  // 2b. text running under a button it doesn't belong to (e.g. brand title under the header buttons)
  const buttons = [...root.querySelectorAll('button, .btn')].filter(b => visible(b) && !b.closest('svg'))
    .map(b => ({ b, r: b.getBoundingClientRect() })).filter(x => x.r.width > 4 && x.r.height > 4);
  for (const it of items) for (const { b, r: q } of buttons) {
    if (b.contains(it.el) || it.el.contains(b) || it.el.closest(INTENTIONAL_CLIP)) continue;
    const hit = it.vis.some(p => Math.min(p.right, q.right) - Math.max(p.left, q.left) > 1.5 && Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top) > 0.35 * p.height);
    if (hit) out.overlaps.push(`${tag(it)} runs under button "${(b.getAttribute('aria-label') || b.title || b.textContent || '').trim().slice(0, 20)}"`);
  }
  // 3. clipped / outside viewport
  for (const it of items) {
    let hScroller = false, bad = null;
    let rects = it.rects.map(p => ({ left: p.left, right: p.right, top: p.top, bottom: p.bottom }));
    for (let anc = it.el; anc && anc !== document.documentElement && !bad; anc = anc.parentElement) {
      const cs = getComputedStyle(anc);
      const ox = cs.overflowX, oy = cs.overflowY;
      if (anc.matches(INTENTIONAL_CLIP)) break; // carousels that deliberately show partial neighbours
      if (ox === 'auto' || ox === 'scroll' || oy === 'auto' || oy === 'scroll') {
        // scrollable: content is reachable; only the part currently shown in the scroller matters further out
        if (ox === 'auto' || ox === 'scroll') hScroller = true;
        const c = anc.getBoundingClientRect();
        rects = rects.map(p => ({ left: Math.max(p.left, c.left), right: Math.min(p.right, c.right), top: Math.max(p.top, c.top), bottom: Math.min(p.bottom, c.bottom) }))
          .filter(p => p.right - p.left > 0.5 && p.bottom - p.top > 0.5);
        if (!rects.length) break;
        continue;
      }
      if (ox === 'visible' && oy === 'visible') continue;
      if (anc === document.body) continue;
      const ellipsis = getComputedStyle(it.el).textOverflow === 'ellipsis' || cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none' && cs.webkitLineClamp;
      if (ellipsis) continue;
      const c = anc.getBoundingClientRect();
      for (const p of rects) {
        if ((ox !== 'visible' && (p.left < c.left - 1.5 || p.right > c.right + 1.5)) || (oy !== 'visible' && (p.top < c.top - 1.5 || p.bottom > c.bottom + 1.5))) {
          bad = `${tag(it)} clipped by .${(anc.className || anc.tagName).toString().split(' ')[0]}`; break;
        }
      }
    }
    if (!bad && !hScroller) for (const p of it.rects) if (p.left < -1 || p.right > vw + 1) { bad = `${tag(it)} outside viewport (${Math.round(p.left)}..${Math.round(p.right)} of ${vw})`; break; }
    if (bad) out.clipped.push(bad);
  }
  // 3b. one-screen steps must fit the visible viewport (when it is tall enough for the 520px minimum)
  const scr = document.querySelector('.color-split-container, .nose-step-card, .rating-step-card');
  const nav = document.querySelector('.sticky-nav-wrapper');
  if (scr && nav && opts.fitCheck) {
    const bottom = scr.getBoundingClientRect().bottom + window.scrollY, room = innerHeight - nav.getBoundingClientRect().height - 22;
    if (room >= 520 && bottom > innerHeight + 1) out.blocks.push(`screen card ends at ${Math.round(bottom)}px, below the visible viewport (${innerHeight}px) - needs scrolling`);
  }
  // 4. summary card blocks
  const cardEl = card && document.querySelector(card);
  if (cardEl) {
    const cr = cardEl.getBoundingClientRect();
    const sels = ['.verdict-header-row', '.verdict-bottle-top-sector', '.verdict-bottom-subsector', '.verdict-col-aromas', '.verdict-notes-row', '.verdict-vfm-footer-bar'];
    const bx = sels.map(s => [s, cardEl.querySelector(s)]).filter(([, e]) => e).map(([s, e]) => {
      // a block's extent includes its overflowing content
      let b = e.getBoundingClientRect(); let top = b.top, bottom = b.bottom, left = b.left, right = b.right;
      for (const d of e.querySelectorAll('*')) { if (!visible(d) || d.closest('svg') && d.tagName !== 'svg') continue; const r = d.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
        top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom); left = Math.min(left, r.left); right = Math.max(right, r.right); }
      return { s, top, bottom, left, right };
    });
    for (const b of bx) if (b.bottom > cr.bottom + 1 || b.right > cr.right + 1 || b.left < cr.left - 1) out.blocks.push(`${b.s} spills outside the card`);
    for (let i = 0; i < bx.length; i++) for (let j = i + 1; j < bx.length; j++) {
      const a = bx[i], b = bx[j];
      const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ix > 2 && iy > 2) out.blocks.push(`${a.s} overlaps ${b.s} (${Math.round(iy)}px)`);
    }
    // 5. bottle label text inside the label rect
    const svg = cardEl.querySelector('.generic-wine-bottle-wrap svg');
    if (svg) {
      const rects = [...svg.querySelectorAll('rect')].filter(r => r.getAttribute('stroke') === '#b8934a');
      const lab = rects.length ? rects[rects.length - 1].getBoundingClientRect() : null;
      if (lab) for (const tx of svg.querySelectorAll('text')) { const r = tx.getBoundingClientRect(); if (r.width && (r.left < lab.left - 0.5 || r.right > lab.right + 0.5)) out.label.push(`label text "${tx.textContent.trim().slice(0, 24)}" overflows the bottle label`); }
    }
  }
  return out;
}

// ---------------- driver ----------------
const SCREENS = ['color', 'nose', 'rating', 'summary', 'notes', 'share'];
const results = [];
async function runEngine(engineName) {
  const browser = await (engineName === 'webkit' ? webkit : chromium).launch(engineName === 'chromium' ? { ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] } : {});
  for (const d of DEVICES) {
    if (ONLY && !ONLY.includes(d.id)) continue;
    const ctx = await browser.newContext({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: d.mobile ? 2 : 1, isMobile: engineName === 'chromium' ? d.mobile : undefined, hasTouch: d.mobile });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    for (const lang of LANGS) {
      await page.goto(URL + 'manifest.json');
      await page.evaluate(({ SAVED, DRAFT, lang }) => { localStorage.clear();
        localStorage.setItem('winitis_tasting_notes', JSON.stringify(SAVED)); localStorage.setItem('winitis_active_draft_note', JSON.stringify(DRAFT));
        localStorage.setItem('winitis_active_step', '0'); localStorage.setItem('winitis_active_view', 'new'); localStorage.setItem('winitis_lang', lang); }, { SAVED, DRAFT, lang });
      await page.goto(URL); await page.waitForLoadState('networkidle').catch(() => {}); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500);
      for (const screen of SCREENS) {
        try {
          const tabs = page.locator('.step-item');
          if (['color', 'nose', 'rating', 'summary'].includes(screen)) {
            if (await page.locator('.step-item').count() === 0) { await page.locator('.nav-buttons .btn:has(svg.lucide-wine)').click(); await page.waitForTimeout(300); }
            await tabs.nth(SCREENS.indexOf(screen)).click(); await page.waitForTimeout(450);
          } else if (screen === 'notes') {
            await page.locator('.nav-buttons .btn:has(svg.lucide-list-filter)').click(); await page.waitForTimeout(450);
          } else if (screen === 'share') {
            await page.locator('.note-card .btn-gold').first().click(); await page.waitForTimeout(500);
          }
          await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(100);
          const a = await page.evaluate(pageAudit, { rootSel: screen === 'share' ? '.modal-overlay' : null, card: screen === 'summary' ? '.verdict-card' : null, fitCheck: ['color', 'nose', 'rating'].includes(screen) });
          const shot = `${OUT}${engineName}-${d.id}-${lang}-${screen}.png`;
          await page.screenshot({ path: shot, fullPage: screen === 'summary' });
          const problems = [...(a.overflowX > 0 ? [`page overflows horizontally by ${a.overflowX}px`] : []), ...a.overlaps.map(s => 'overlap ' + s), ...a.clipped, ...a.blocks, ...a.label];
          results.push({ engine: engineName, device: d.id, lang, screen, ok: problems.length === 0, problems, shot });
          if (screen === 'share') { await page.keyboard.press('Escape'); await page.locator('.modal-overlay').first().click({ position: { x: 3, y: 3 } }).catch(() => {}); await page.waitForTimeout(250); }
        } catch (e) { results.push({ engine: engineName, device: d.id, lang, screen, ok: false, problems: ['driver error: ' + e.message.split('\n')[0]] }); }
      }
    }
    if (errors.length) results.push({ engine: engineName, device: d.id, lang: '-', screen: 'page', ok: false, problems: errors });
    await ctx.close();
  }
  await browser.close();
}
await Promise.all(ENGINES.map(runEngine));
fs.writeFileSync(OUT + 'results.json', JSON.stringify(results, null, 1));
const fails = results.filter(r => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.engine.padEnd(8)} ${r.device.padEnd(9)} ${r.lang} ${r.screen.padEnd(8)} ${r.problems.slice(0, 3).join(' | ')}${r.problems.length > 3 ? ` (+${r.problems.length - 3} more)` : ''}`);
console.log(`\n${results.length - fails.length}/${results.length} screen checks passed`);
console.log(fails.length ? `${fails.length} FAILURE(S)` : 'ALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
