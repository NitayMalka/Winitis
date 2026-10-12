import { toCanvas } from 'html-to-image';

// Renders the summary card to a PNG for sharing, and refuses to return an image with missing content.
//
// Why the photo used to disappear: html-to-image paints the card by serialising it into an SVG
// <foreignObject> and drawing that SVG onto a canvas. WebKit (iOS Safari / the installed PWA)
// does not wait for <img> elements inside that SVG to decode before it draws it, so the
// uploaded photo (a multi-MB JPEG data URL) came out as an empty box; Chromium happens to wait.
// Now the photo is left out of the DOM snapshot and drawn onto the canvas directly from a
// fully decoded Image, then the result is checked pixel by pixel before it can be shared.

export class ShareImageError extends Error {
  constructor(code, message) { super(message || code); this.name = 'ShareImageError'; this.code = code; }
}

const loadDecoded = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.decoding = 'sync';
  img.onload = async () => {
    try { if (img.decode) await img.decode(); } catch { /* onload already fired; decode() may reject on some engines */ }
    if (img.naturalWidth > 0 && img.naturalHeight > 0) resolve(img);
    else reject(new ShareImageError('photo-decode'));
  };
  img.onerror = () => reject(new ShareImageError('photo-decode'));
  img.src = src;
});

const regionStats = (ctx, x, y, w, h) => {
  const X = Math.max(0, Math.round(x)), Y = Math.max(0, Math.round(y));
  const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
  const d = ctx.getImageData(X, Y, W, H).data;
  let n = 0, m = 0, m2 = 0;
  for (let i = 0; i < d.length; i += 16) { const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; n++; m += l; m2 += l * l; }
  m /= n;
  return { mean: m, sd: Math.sqrt(Math.max(0, m2 / n - m * m)), data: d, W, H };
};

const drawCover = (ctx, img, x, y, w, h, radius) => {
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect && radius > 0) ctx.roundRect(x, y, w, h, radius); else ctx.rect(x, y, w, h);
  ctx.clip();
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight); // object-fit: cover, centred
  const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
};

async function renderOnce(cardEl, pixelRatio) {
  const cardRect = cardEl.getBoundingClientRect();
  const photoEl = cardEl.querySelector('img.custom-bottle-img');
  const bottleSvg = photoEl ? null : cardEl.querySelector('.generic-wine-bottle-wrap svg');
  const rel = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - cardRect.left, y: r.top - cardRect.top, w: r.width, h: r.height }; };

  let photo = null, photoBox = null, radius = 0;
  if (photoEl) {
    const src = photoEl.currentSrc || photoEl.getAttribute('src');
    if (!src) throw new ShareImageError('photo-missing');
    photo = await loadDecoded(src);
    photoBox = rel(photoEl);
    radius = parseFloat(getComputedStyle(photoEl).borderTopLeftRadius) || 0;
    if (photoBox.w < 4 || photoBox.h < 4) throw new ShareImageError('photo-missing');
  }

  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = await toCanvas(cardEl, {
    pixelRatio,
    filter: (node) => !node.classList?.contains('no-print') && node !== photoEl
  });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !canvas.width || !canvas.height) throw new ShareImageError('render');
  const s = canvas.width / cardRect.width;

  // the card itself must not be blank
  if (regionStats(ctx, 0, 0, canvas.width, canvas.height).sd < 6) throw new ShareImageError('render');

  if (photo) {
    const b = { x: photoBox.x * s, y: photoBox.y * s, w: photoBox.w * s, h: photoBox.h * s };
    drawCover(ctx, photo, b.x, b.y, b.w, b.h, radius * s);
    // verify: the photo area of the final image must equal the photo drawn on its own
    const ref = document.createElement('canvas'); ref.width = Math.round(b.w); ref.height = Math.round(b.h);
    const rctx = ref.getContext('2d', { willReadFrequently: true });
    drawCover(rctx, photo, 0, 0, ref.width, ref.height, 0);
    const ix = b.w * 0.15, iy = b.h * 0.15, iw = b.w * 0.7, ih = b.h * 0.7; // inside the rounded corners
    const got = regionStats(ctx, b.x + ix, b.y + iy, iw, ih);
    const want = regionStats(rctx, ix, iy, iw, ih);
    let diff = 0, n = 0;
    for (let i = 0; i < Math.min(got.data.length, want.data.length); i += 16) {
      diff += (Math.abs(got.data[i] - want.data[i]) + Math.abs(got.data[i + 1] - want.data[i + 1]) + Math.abs(got.data[i + 2] - want.data[i + 2])) / 3; n++;
    }
    if (!n || diff / n > 12) throw new ShareImageError('photo-missing');
  } else if (bottleSvg) {
    const b = rel(bottleSvg);
    if (regionStats(ctx, b.x * s, b.y * s, b.w * s, b.h * s).sd < 8) throw new ShareImageError('bottle-missing');
  }
  return canvas;
}

/** Returns a verified PNG Blob of the summary card, or throws ShareImageError. */
export async function renderSummaryPng(cardEl, { pixelRatio = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) { // WebKit sometimes needs a warm-up pass for fonts
    try {
      const canvas = await renderOnce(cardEl, pixelRatio);
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      if (!blob || blob.size < 1024) throw new ShareImageError('render');
      return blob;
    } catch (e) {
      lastErr = e instanceof ShareImageError ? e : new ShareImageError('render', e?.message);
      if (lastErr.code === 'photo-decode') break; // a photo that cannot be decoded will not decode on retry
    }
  }
  throw lastErr;
}
