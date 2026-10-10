import { HE_TERMS, LEGACY_ALIASES } from './he.js';

export const LANG_KEY = 'winitis_lang';
export const SUPPORTED_LANGS = ['en', 'he'];

export function getStoredLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (SUPPORTED_LANGS.includes(v)) return v;
  } catch (e) {}
  return 'en';
}

const LOWER = Object.fromEntries(Object.entries(HE_TERMS).map(([k, v]) => [k.toLowerCase(), v]));
const HAS_LATIN = /[A-Za-z]/;
const MEASURE = /^[\d\s<>≥≤+\-–.,%/]*s?\+?$/; // e.g. "45s+", "<15s", "11-13.9%", "≥14%"

function recordMiss(str) {
  if (typeof window === 'undefined') return;
  (window.__i18nMissing = window.__i18nMissing || new Set()).add(str);
}

// "45s+" -> "⁦45+⁩ שנ׳", "11-13.9%" -> "⁦11-13.9%⁩" (bidi-isolated so digits/symbols keep their order in RTL)
function heMeasure(m) {
  const secs = m.match(/^([<>≥≤]?\s*[\d.]+(?:\s*[-–]\s*[\d.]+)?)\s*s(\+?)$/);
  if (secs) return `\u2066${secs[1]}${secs[2]}\u2069 שנ׳`;
  return `\u2066${m}\u2069`;
}

// English canonical value / UI literal -> Hebrew. Unknown text (user free text) is returned unchanged.
export function translateHe(value) {
  if (value === null || value === undefined) return value;
  const str = String(value);
  const key = str.trim();
  if (!key || !HAS_LATIN.test(key)) return str; // numbers, symbols, Hebrew user text
  const hit = HE_TERMS[key] ?? LOWER[key.toLowerCase()];
  if (hit !== undefined) return hit;
  const alias = LEGACY_ALIASES[key];
  if (alias && HE_TERMS[alias]) return HE_TERMS[alias];
  // Compound "Base (Inner)" e.g. "Deep Ruby (Matched)", "Medium(+) (30-45s)", "Low (<11%)"
  const m = key.match(/^(.*?)\s*\(([^()]*)\)$/);
  if (m && m[1]) {
    const inner = m[2].trim();
    const innerHe = MEASURE.test(inner) ? heMeasure(inner) : translateHe(inner);
    return `${translateHe(m[1])} (${innerHe})`;
  }
  // Trailing colon labels "Finish:"
  if (key.endsWith(':') && HE_TERMS[key.slice(0, -1)]) return HE_TERMS[key.slice(0, -1)] + ':';
  recordMiss(key);
  return str;
}

export function makeTr(lang) {
  if (lang !== 'he') return (s) => s;
  return (s) => translateHe(s);
}
