/**
 * winePalette.js — WSET-style reference palette for wine colour identification.
 *
 * APPROXIMATE: values were hand-calibrated to "the core of a tilted glass held over
 * white paper in daylight" and extended to pale/deep with a Beer–Lambert absorption
 * model. Real photos vary with lighting, glass shape, fill level and camera
 * processing, so treat matches as a best guess the taster can override.
 */
export const WINE_TYPES = {
  white: { label: 'White', range: 1.75, hues: [
    { id: 'lemon-green', label: 'Lemon-green', medium: '#E3E49B' },
    { id: 'lemon', label: 'Lemon', medium: '#EEDC8A' },
    { id: 'gold', label: 'Gold', medium: '#E4B955' },
    { id: 'amber', label: 'Amber', medium: '#C8842F' },
    { id: 'brown', label: 'Brown', medium: '#8B561F' } ] },
  rose: { label: 'Rosé', range: 1.9, hues: [
    { id: 'pink', label: 'Pink', medium: '#EE98A5' },
    { id: 'salmon', label: 'Salmon', medium: '#F2A58B' },
    { id: 'orange', label: 'Orange', medium: '#EC9C67' } ] },
  orange: { label: 'Orange', range: 1.7, hues: [
    { id: 'gold', label: 'Gold', medium: '#E2AC4D' },
    { id: 'amber', label: 'Amber', medium: '#D08732' },
    { id: 'orange', label: 'Orange', medium: '#CB6C2C' },
    { id: 'brown', label: 'Brown', medium: '#8D5022' } ] },
  red: { label: 'Red', range: 1.8, hues: [
    { id: 'purple', label: 'Purple', medium: '#5C1A42' },
    { id: 'ruby', label: 'Ruby', medium: '#8C1A2E' },
    { id: 'garnet', label: 'Garnet', medium: '#8A2B22' },
    { id: 'tawny', label: 'Tawny', medium: '#9B4A27' },
    { id: 'brown', label: 'Brown', medium: '#6E3B1F' } ] },
};
export const TYPE_ORDER = ['red', 'white', 'rose', 'orange'];
export const INTENSITIES = [['Pale', 0.17], ['Medium', 0.5], ['Deep', 0.83]];

const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
export const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
export function hexToRgb(hex) { const h = hex.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); }
export function rgbToHex(rgb) { return '#' + rgb.map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0')).join('').toUpperCase(); }

function linToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function oklabToLin([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const toLch = (hex) => { const [L, a, b] = linToOklab(hexToRgb(hex).map(srgbToLinear)); return [L, Math.hypot(a, b), Math.atan2(b, a)]; };

/** Reference colour (sRGB hex) for type, fractional hue position and intensity 0..1. */
export function paletteHex(type, hue, intensity) {
  const T = WINE_TYPES[type], n = T.hues.length - 1;
  const p = Math.min(n, Math.max(0, hue)), i = Math.min(n - 1, Math.floor(p)), t = p - i;
  const A = toLch(T.hues[i].medium), B = toLch(T.hues[i + 1].medium);
  let dh = B[2] - A[2]; if (dh > Math.PI) dh -= 2 * Math.PI; if (dh < -Math.PI) dh += 2 * Math.PI;
  const L = A[0] + (B[0] - A[0]) * t, C = A[1] + (B[1] - A[1]) * t, h = A[2] + dh * t;
  const ref = oklabToLin([L, C * Math.cos(h), C * Math.sin(h)]).map((c) => Math.min(1, Math.max(1e-4, c)));
  const k = Math.pow(T.range, 2 * clamp01(intensity) - 1);                 // concentration
  const Tr = ref.map((c) => Math.pow(10, k * Math.log10(c)));              // Beer–Lambert: T^k
  const m = (Tr[0] + Tr[1] + Tr[2]) / 3, leak = 0.06 * Math.min(1, k);     // broad-band leakage
  return rgbToHex(Tr.map((x) => linearToSrgb(x * (1 - leak) + m * leak)));
}
export function intensityLabel(v) { return v < 1 / 3 ? 'Pale' : v < 2 / 3 ? 'Medium' : 'Deep'; }
export function descriptorOf(type, hueIdx, intensity) {
  const h = WINE_TYPES[type].hues[hueIdx];
  return `${intensity} ${h.label.toLowerCase()}`;
}
