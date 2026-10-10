// SVG <textPath> does not run the Unicode bidi algorithm in WebKit (iOS Safari / PWA): Hebrew
// laid along a path comes out with its letters in logical order, i.e. mirrored ("םודא ירפ").
// For path text we therefore pre-compute the visual (right-to-left) order ourselves and draw it
// with direction:ltr + unicode-bidi:bidi-override, which every engine renders the same way.
const HEBREW = /[\u0590-\u05FF\uFB1D-\uFB4F]/;
const LTR_RUN = /^[A-Za-z0-9\u00C0-\u024F](?:[A-Za-z0-9\u00C0-\u024F.,%+\-/'’]*[A-Za-z0-9\u00C0-\u024F%+])?/;
const COMBINING = /[\u0591-\u05C7\u0300-\u036F]/;
const MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '«': '»', '»': '«' };

export function toVisualRtl(text) {
  const s = String(text ?? '');
  if (!HEBREW.test(s)) return s;
  const units = [];
  for (let i = 0; i < s.length;) {
    const m = LTR_RUN.exec(s.slice(i));
    if (m && !HEBREW.test(m[0])) { units.push(m[0]); i += m[0].length; continue; }
    let u = s[i++];
    while (i < s.length && COMBINING.test(s[i])) u += s[i++]; // keep niqqud with its letter
    units.push(MIRROR[u] || u);
  }
  return units.reverse().join('');
}

/** Props for an SVG <text> whose content was passed through toVisualRtl. */
export const visualTextStyle = { direction: 'ltr', unicodeBidi: 'bidi-override' };
