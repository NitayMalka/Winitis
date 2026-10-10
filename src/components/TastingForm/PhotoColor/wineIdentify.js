/**
 * wineIdentify.js — sampling, white balance and perceptual matching (CIEDE2000).
 */
import { WINE_TYPES, paletteHex, hexToRgb, rgbToHex, srgbToLinear, linearToSrgb, intensityLabel } from './winePalette.js';

// ---------- CIELAB + CIEDE2000 ----------------------------------------------
export function rgbToLab(rgb) {
  const [r, g, b] = rgb.map(srgbToLinear);
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
export function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) * deg + 360) % 360, h2p = (Math.atan2(b2, a2p) * deg + 360) % 360;
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) hbp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + (h1p + h2p < 360 ? 360 : -360)) / 2 : (h1p + h2p) / 2;
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2), Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

// ---------- Patch sampling ----------------------------------------------------
/**
 * Sample a (2r+1)² patch around (x, y) of an ImageData-like {data,width,height}.
 * Trimmed mean in linear light: sort by luminance, drop the brightest 25%
 * (specular glints) and darkest 10% (dust/edges). Returns sRGB [0..1] + spread.
 */
export function samplePatch(img, x, y, r = 4, { trimHigh = 0.25, trimLow = 0.1 } = {}) {
  const px = [];
  const cx = Math.round(x), cy = Math.round(y);
  for (let j = cy - r; j <= cy + r; j++) {
    if (j < 0 || j >= img.height) continue;
    for (let i = cx - r; i <= cx + r; i++) {
      if (i < 0 || i >= img.width) continue;
      const o = (j * img.width + i) * 4, d = img.data;
      const lin = [srgbToLinear(d[o] / 255), srgbToLinear(d[o + 1] / 255), srgbToLinear(d[o + 2] / 255)];
      px.push({ lin, Y: 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2] });
    }
  }
  if (!px.length) return null;
  px.sort((a, b) => a.Y - b.Y);
  const lo = Math.floor(px.length * trimLow), hi = Math.max(lo + 1, Math.ceil(px.length * (1 - trimHigh)));
  const kept = px.slice(lo, hi);
  const mean = [0, 1, 2].map((c) => kept.reduce((s, p) => s + p.lin[c], 0) / kept.length);
  // spread = how non-uniform the patch is (std of luminance relative to mean); > ~0.25 suggests an edge
  const mY = kept.reduce((s, p) => s + p.Y, 0) / kept.length;
  const spread = Math.sqrt(kept.reduce((s, p) => s + (p.Y - mY) ** 2, 0) / kept.length) / Math.max(1e-3, mY);
  return { rgb: mean.map(linearToSrgb), lin: mean, spread, n: kept.length, total: px.length };
}

// ---------- White balance -----------------------------------------------------
/**
 * Von Kries-style correction in linear RGB: scales channels so the tapped white
 * reference becomes neutral *and* maps to paper white (normalises exposure too,
 * since the palette was calibrated "over white paper"). Gains capped to avoid blowing up noise.
 */
export const PAPER_WHITE_LIN = 0.91; // ≈ #F5F5F5
export function whiteBalanceGains(whiteRgb) {
  if (!whiteRgb) return [1, 1, 1];
  return whiteRgb.map(srgbToLinear).map((c) => Math.min(4, Math.max(0.5, PAPER_WHITE_LIN / Math.max(1e-3, c))));
}
export function applyGains(rgb, gains) {
  return rgb.map((c, i) => linearToSrgb(Math.min(1, srgbToLinear(c) * gains[i])));
}

// ---------- Identification ----------------------------------------------------
let GRID = null;
function grid() {
  if (GRID) return GRID;
  GRID = [];
  for (const type of Object.keys(WINE_TYPES)) {
    const n = WINE_TYPES[type].hues.length - 1;
    for (let hp = 0; hp <= n + 1e-9; hp += 0.1) {
      for (let iv = 0; iv <= 1 + 1e-9; iv += 0.025) {
        const hex = paletteHex(type, hp, iv);
        GRID.push({ type, hue: hp, intensity: iv, hex, lab: rgbToLab(hexToRgb(hex)) });
      }
    }
  }
  return GRID;
}

/**
 * Identify the nearest wine descriptor for an sRGB colour [0..1].
 * Returns best match + best per type (alternatives), with ΔE00 and a confidence label.
 */
export function identify(rgb) {
  const lab = rgbToLab(rgb);
  const perType = {};
  for (const g of grid()) {
    const d = deltaE2000(lab, g.lab);
    if (!perType[g.type] || d < perType[g.type].deltaE) perType[g.type] = { ...g, deltaE: d };
  }
  const mk = (g) => {
    const T = WINE_TYPES[g.type], hueIdx = Math.round(g.hue), h = T.hues[hueIdx], iL = intensityLabel(g.intensity);
    return {
      type: g.type, typeLabel: T.label, hueIdx, hueId: h.id, hueLabel: h.label, intensity: iL,
      descriptor: `${iL} ${h.label.toLowerCase()}`, referenceHex: g.hex, deltaE: +g.deltaE.toFixed(1),
      confidence: g.deltaE < 6 ? 'good' : g.deltaE < 12 ? 'approximate' : 'poor',
    };
  };
  const ranked = Object.values(perType).sort((a, b) => a.deltaE - b.deltaE).map(mk);
  return { best: ranked[0], alternatives: ranked.slice(1), hex: rgbToHex(rgb) };
}
