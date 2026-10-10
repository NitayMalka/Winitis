/**
 * PhotoColorStep — Winitis colour step driven by a photo of the wine.
 * Take/upload a photo → pinch/scroll to zoom, drag to pan → tap the wine → fine-adjust
 * with the loupe → confirm. Optional white-balance tap on paper/tablecloth.
 * The colour is matched (CIEDE2000) to an approximate WSET palette; the taster can override.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImagePlus, Crosshair, Sun, ZoomIn, ZoomOut, Maximize, Check, RotateCcw, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { WINE_TYPES, TYPE_ORDER, INTENSITIES, paletteHex, rgbToHex } from './winePalette.js';
import { samplePatch, identify, whiteBalanceGains, applyGains } from './wineIdentify.js';
import { loadPhoto } from './imageTools.js';
import './photoColorStep.css';

const RIM_OPTIONS = [
  ['Ruby Edge', 'color.rimOptionStandard', 'Ruby Edge (Youthful)'],
  ['Subtle Magenta', 'color.rimOptionMagenta', 'Subtle Magenta (High Acid)'],
  ['Pale Garnet Edge', 'color.rimOptionGarnet', 'Pale Garnet Edge (Maturing)'],
  ['Amber Rim', 'color.rimOptionAmber', 'Amber Rim (Aged)'],
  ['Watery Edge (Light Extraction)', 'color.rimOptionWatery', 'Watery Edge (Light Extraction)'],
];
const LEGACY_IDS = { violet: 'purple', brick: 'brown' };
const PATCH_SIZES = [[2, '5×5'], [4, '9×9'], [6, '13×13']];
const LOUPE = 132;

/** Read a saved wineNote.color back into selector state (handles legacy notes). */
export function descriptorFromColor(c = {}) {
  const type = WINE_TYPES[c.wineType] ? c.wineType : 'red';
  const id = LEGACY_IDS[c.id] || c.id;
  const hueIdx = Math.max(0, WINE_TYPES[type].hues.findIndex((h) => h.id === id));
  const intensity = ['Pale', 'Medium', 'Deep'].includes(c.intensity) ? c.intensity : 'Medium';
  return { type, hueIdx: hueIdx === -1 ? 0 : hueIdx, intensity };
}
const intensityValue = (l) => INTENSITIES.find(([n]) => n === l)?.[1] ?? 0.5;
const labelOf = (d) => `${d.intensity} ${WINE_TYPES[d.type].hues[d.hueIdx].label.toLowerCase()}`;

export default function PhotoColorStep({ colorData = {}, updateColorData, t }) {
  const tr = (k, fb) => (t ? t(k, fb) : fb);
  // ---- persisted bits ------------------------------------------------------
  const [desc, setDesc] = useState(() => descriptorFromColor(colorData));
  const [clarity, setClarity] = useState(colorData.clarity || 'Clear');
  const [rim, setRim] = useState(colorData.rimVariation || 'Ruby Edge');
  const [saved, setSaved] = useState(() => (colorData.source === 'photo' ? colorData : null));
  // ---- photo session (not persisted) --------------------------------------
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState({ s: 1, tx: 0, ty: 0 });
  const [point, setPoint] = useState(null);
  const [whitePt, setWhitePt] = useState(null);
  const [mode, setMode] = useState('wine');
  const [patchR, setPatchR] = useState(4);
  const [overridden, setOverridden] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [box, setBox] = useState({ w: 360, h: 420 });

  const camRef = useRef(null), galRef = useRef(null), vpRef = useRef(null), canvasRef = useRef(null), loupeRef = useRef(null);
  const st = useRef({}); // latest values for gesture handlers
  st.current = { view, point, photo, box, mode };

  // ---- persistence helper ---------------------------------------------------
  const save = (patch) => {
    const next = { ...colorData, clarity, rimVariation: rim, ...patch };
    updateColorData(next);
    return next;
  };
  const colorFields = (d) => ({ id: WINE_TYPES[d.type].hues[d.hueIdx].id, name: WINE_TYPES[d.type].hues[d.hueIdx].label, intensity: d.intensity, wineType: d.type, descriptor: labelOf(d) });

  // ---- sampling + identification ------------------------------------------
  const whiteRgb = useMemo(() => (photo && whitePt ? samplePatch(photo.imageData, whitePt.x, whitePt.y, 6, { trimHigh: 0.1, trimLow: 0.1 })?.rgb : null), [photo, whitePt]);
  const sample = useMemo(() => (photo && point ? samplePatch(photo.imageData, point.x, point.y, patchR) : null), [photo, point, patchR]);
  const corrected = useMemo(() => (sample ? (whiteRgb ? applyGains(sample.rgb, whiteBalanceGains(whiteRgb)) : sample.rgb) : null), [sample, whiteRgb]);
  const ident = useMemo(() => (corrected ? identify(corrected) : null), [corrected]);

  // auto-descriptor follows identification until the user overrides it
  useEffect(() => {
    if (ident && !overridden) setDesc({ type: ident.best.type, hueIdx: ident.best.hueIdx, intensity: ident.best.intensity });
  }, [ident, overridden]);

  // ---- viewport geometry ------------------------------------------------------
  useEffect(() => {
    const el = vpRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [photo]);
  const fitScale = photo ? Math.min(box.w / photo.width, box.h / photo.height) : 1;
  const clampView = useCallback((v) => {
    const p = st.current.photo, b = st.current.box; if (!p) return v;
    const fs = Math.min(b.w / p.width, b.h / p.height);
    const s = Math.min(fs * 24, Math.max(fs, v.s));
    const ax = (tx, W, w) => (w * s <= W ? (W - w * s) / 2 : Math.min(0, Math.max(W - w * s, tx)));
    return { s, tx: ax(v.tx, b.w, p.width), ty: ax(v.ty, b.h, p.height) };
  }, []);
  const fit = useCallback(() => setView(clampView({ s: 0, tx: 0, ty: 0 })), [clampView]);
  useEffect(() => { if (photo) fit(); }, [photo, box.w, box.h, fit]);
  const zoomAt = useCallback((factor, sx, sy) => {
    setView((v) => {
      const s = v.s * factor;
      const nv = clampView({ s, tx: sx - ((sx - v.tx) / v.s) * s, ty: sy - ((sy - v.ty) / v.s) * s });
      return nv;
    });
  }, [clampView]);
  const toImage = (sx, sy, v = st.current.view) => ({ x: (sx - v.tx) / v.s, y: (sy - v.ty) / v.s });
  const toScreen = (p, v = view) => ({ x: p.x * v.s + v.tx, y: p.y * v.s + v.ty });
  const clampPt = (p) => ({ x: Math.min(photo.width - 1, Math.max(0, p.x)), y: Math.min(photo.height - 1, Math.max(0, p.y)) });

  // ---- load photo ----------------------------------------------------------------
  const onFile = async (file) => {
    if (!file) return;
    setError(''); setLoading(true);
    try {
      const p = await loadPhoto(file);
      setPhoto(p); setPoint(null); setWhitePt(null); setMode('wine'); setOverridden(false); setConfirmed(false);
    } catch (e) { setError(e.message || 'Could not open photo'); }
    setLoading(false);
  };

  // ---- drawing ------------------------------------------------------------------
  useEffect(() => {
    const c = canvasRef.current; if (!c || !photo) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(box.w * dpr); c.height = Math.round(box.h * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b070c'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.setTransform(dpr * view.s, 0, 0, dpr * view.s, dpr * view.tx, dpr * view.ty);
    ctx.imageSmoothingEnabled = view.s < 3;
    ctx.drawImage(photo.canvas, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (whitePt) {
      const w = toScreen(whitePt);
      ctx.setLineDash([4, 3]); ctx.lineWidth = 2; ctx.strokeStyle = '#fff';
      ctx.beginPath(); ctx.arc(w.x, w.y, 12, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.font = '600 10px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('W', w.x, w.y + 3.5);
    }
    if (point) {
      const p = toScreen(point), half = Math.max(3, ((2 * patchR + 1) * view.s) / 2);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.65)'; drawCross(ctx, p, half);
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#f7e4a1'; drawCross(ctx, p, half);
    }
  }, [photo, view, point, whitePt, patchR, box]);

  useEffect(() => {
    const c = loupeRef.current; if (!c || !photo || !point) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = c.height = LOUPE * dpr;
    const ctx = c.getContext('2d');
    const span = Math.max(15, (2 * patchR + 1) * 3);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0b070c'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(photo.canvas, Math.round(point.x) - span / 2 + 0.5, Math.round(point.y) - span / 2 + 0.5, span, span, 0, 0, c.width, c.height);
    const k = c.width / span, half = ((2 * patchR + 1) * k) / 2, m = c.width / 2;
    ctx.lineWidth = 2 * dpr; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeRect(m - half, m - half, half * 2, half * 2);
    ctx.lineWidth = 1 * dpr; ctx.strokeStyle = '#f7e4a1'; ctx.strokeRect(m - half, m - half, half * 2, half * 2);
    ctx.beginPath(); ctx.moveTo(m, 0); ctx.lineTo(m, m - half); ctx.moveTo(m, m + half); ctx.lineTo(m, c.height);
    ctx.moveTo(0, m); ctx.lineTo(m - half, m); ctx.moveTo(m + half, m); ctx.lineTo(c.width, m); ctx.stroke();
  }, [photo, point, patchR, view]);

  // ---- gestures --------------------------------------------------------------------
  const ptrs = useRef(new Map());
  const gest = useRef(null);
  const local = (e) => { const r = vpRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  const pick = (sp) => {
    const ip = toImage(sp.x, sp.y);
    const p = st.current.photo;
    if (ip.x < 0 || ip.y < 0 || ip.x >= p.width || ip.y >= p.height) return;
    if (st.current.mode === 'white') { setWhitePt(ip); setMode('wine'); }
    else { setPoint(ip); setConfirmed(false); }
  };
  const onPointerDown = (e) => {
    if (!st.current.photo) return;
    vpRef.current.focus({ preventScroll: true });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    const p = local(e);
    ptrs.current.set(e.pointerId, p);
    if (ptrs.current.size === 1) {
      const pt = st.current.point;
      const near = pt && st.current.mode === 'wine' && Math.hypot(toScreen(pt, st.current.view).x - p.x, toScreen(pt, st.current.view).y - p.y) < 32;
      gest.current = { kind: near ? 'marker' : 'pan', start: p, last: p, t0: performance.now(), moved: 0 };
    } else if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      gest.current = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, m0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, v0: st.current.view, moved: 99 };
    }
  };
  const onPointerMove = (e) => {
    if (!ptrs.current.has(e.pointerId) || !gest.current) return;
    const p = local(e);
    ptrs.current.set(e.pointerId, p);
    const g = gest.current;
    if (g.kind === 'pinch' && ptrs.current.size >= 2) {
      const [a, b] = [...ptrs.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const s = g.v0.s * (d / g.d0);
      setView(clampView({ s, tx: m.x - ((g.m0.x - g.v0.tx) / g.v0.s) * s, ty: m.y - ((g.m0.y - g.v0.ty) / g.v0.s) * s }));
      return;
    }
    const dx = p.x - g.last.x, dy = p.y - g.last.y;
    g.moved += Math.abs(dx) + Math.abs(dy); g.last = p;
    if (g.kind === 'pan' && g.moved > 6) setView((v) => clampView({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
    if (g.kind === 'marker') { // fine adjust: half speed so the finger can be precise
      const s = st.current.view.s;
      setPoint((pt) => clampPt({ x: pt.x + (dx / s) * 0.5, y: pt.y + (dy / s) * 0.5 }));
      setConfirmed(false);
    }
  };
  const onPointerUp = (e) => {
    const g = gest.current;
    ptrs.current.delete(e.pointerId);
    if (g && g.kind !== 'pinch' && g.moved <= 6 && performance.now() - g.t0 < 500) pick(local(e));
    if (ptrs.current.size === 1 && g?.kind === 'pinch') { const [p] = [...ptrs.current.values()]; gest.current = { kind: 'pan', start: p, last: p, t0: 0, moved: 99 }; }
    else if (ptrs.current.size === 0) gest.current = null;
  };
  useEffect(() => {
    const el = vpRef.current; if (!el) return;
    const onWheel = (e) => { e.preventDefault(); const r = el.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [photo, zoomAt]);

  const nudge = (dx, dy) => { if (!point) { setPoint(toImage(box.w / 2, box.h / 2)); return; } setPoint((p) => clampPt({ x: p.x + dx, y: p.y + dy })); setConfirmed(false); };
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 1;
    const map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (map[e.key]) { e.preventDefault(); nudge(...map[e.key]); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAt(1.4, box.w / 2, box.h / 2); }
    else if (e.key === '-') { e.preventDefault(); zoomAt(1 / 1.4, box.w / 2, box.h / 2); }
    else if (e.key === 'Enter' && point) { e.preventDefault(); confirm(); }
  };

  // ---- actions -------------------------------------------------------------------------------------
  const confirm = () => {
    if (!corrected) return;
    const next = save({
      ...colorFields(desc),
      hex: rgbToHex(corrected),
      source: 'photo',
      sampledHex: rgbToHex(sample.rgb),
      whiteRefHex: whiteRgb ? rgbToHex(whiteRgb) : null,
      autoDescriptor: ident.best.descriptor,
      autoWineType: ident.best.type,
      matchDeltaE: ident.best.deltaE,
      overridden,
    });
    setSaved(next); setConfirmed(true);
  };
  const changeDesc = (patch) => {
    const d = { ...desc, ...patch };
    if (patch.type && patch.type !== desc.type) d.hueIdx = Math.min(d.hueIdx, WINE_TYPES[d.type].hues.length - 1);
    setDesc(d); setOverridden(true);
    if (photo && point && !confirmed) return; // will be saved on confirm
    if (saved && !photo) { const n = save({ ...colorFields(d), overridden: true }); setSaved(n); return; }
    if (photo && confirmed) { const n = save({ ...colorFields(d), overridden: true }); setSaved(n); return; }
    // manual mode (no photo): reference colour from the palette
    save({ ...colorFields(d), hex: paletteHex(d.type, d.hueIdx, intensityValue(d.intensity)), source: 'manual', sampledHex: null, whiteRefHex: null });
  };
  const changeClarity = (v) => { setClarity(v); updateColorData({ ...colorData, clarity: v }); };
  const changeRim = (v) => { setRim(v); updateColorData({ ...colorData, rimVariation: v }); };

  // ---- render -----------------------------------------------------------------------------------------
  const loupeLeft = point ? toScreen(point).x > box.w / 2 : false;
  const best = ident?.best;
  const shownHex = corrected ? rgbToHex(corrected) : saved?.hex || colorData.hex || paletteHex(desc.type, desc.hueIdx, intensityValue(desc.intensity));
  const fileInputs = (
    <>
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }} data-testid="camera-input" />
      <input ref={galRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }} data-testid="gallery-input" />
    </>
  );

  return (
    <div className="pcs card">
      {fileInputs}
      <div className="card-header pcs-header">
        <h2 className="card-title font-serif">{tr('color.photoTitle', 'Wine Colour')}</h2>
        {photo && <button type="button" className="btn btn-outline pcs-small" onClick={() => galRef.current.click()}><ImagePlus size={15} /> {tr('color.newPhoto', 'New photo')}</button>}
      </div>

      {!photo && (
        <div className="pcs-empty" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
          {saved ? (
            <div className="pcs-saved">
              <span className="pcs-swatch big" style={{ background: saved.hex }} />
              <div>
                <div className="pcs-desc">{saved.descriptor || `${saved.intensity} ${saved.name}`}</div>
                <div className="pcs-meta">{WINE_TYPES[saved.wineType]?.label || 'Red'} · {saved.hex}{saved.whiteRefHex ? ' · white-balanced' : ''}</div>
                <div className="pcs-meta">{tr('color.fromPhoto', 'Picked from a photo')}</div>
              </div>
            </div>
          ) : (
            <div className="pcs-hero" aria-hidden="true"><Camera size={34} /></div>
          )}
          <p className="pcs-lead">{tr('color.photoLead', 'Tilt your glass over white paper in daylight, take a photo, then tap the wine.')}</p>
          <div className="pcs-actions">
            <button type="button" className="btn btn-gold" onClick={() => camRef.current.click()} disabled={loading}><Camera size={17} /> {saved ? tr('color.retake', 'Retake photo') : tr('color.takePhoto', 'Take photo')}</button>
            <button type="button" className="btn btn-outline" onClick={() => galRef.current.click()} disabled={loading}><ImagePlus size={17} /> {tr('color.upload', 'Upload')}</button>
          </div>
          {loading && <p className="pcs-meta" role="status">Loading photo…</p>}
          <ul className="pcs-tips">
            <li>No flash; avoid coloured light and tinted tablecloths.</li>
            <li>Include some white paper in the shot to correct the colour cast.</li>
            <li>Tap the core (deepest part) for intensity; the rim for age.</li>
          </ul>
        </div>
      )}
      {error && <p className="pcs-error" role="alert"><AlertTriangle size={14} /> {error}</p>}

      {photo && (
        <>
          <div className="pcs-modebar" role="radiogroup" aria-label="Tap mode">
            <button type="button" role="radio" aria-checked={mode === 'wine'} className={mode === 'wine' ? 'on' : ''} onClick={() => setMode('wine')}><Crosshair size={15} /> {tr('color.pickWine', 'Pick wine')}</button>
            <button type="button" role="radio" aria-checked={mode === 'white'} className={mode === 'white' ? 'on' : ''} onClick={() => setMode('white')}><Sun size={15} /> {whiteRgb ? tr('color.whiteSet', 'White ✓') : tr('color.pickWhite', 'White balance')}</button>
          </div>
          <div
            ref={vpRef}
            className={`pcs-viewport ${mode === 'white' ? 'white-mode' : ''}`}
            tabIndex={0}
            role="application"
            aria-label="Wine photo. Pinch or scroll to zoom, drag to pan, tap to pick. Arrow keys move the picker, plus and minus zoom, Enter confirms."
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            data-testid="viewport"
          >
            <canvas ref={canvasRef} />
            {point && (
              <div className={`pcs-loupe ${loupeLeft ? 'left' : 'right'}`} aria-hidden="true">
                <canvas ref={loupeRef} />
                {corrected && <span style={{ background: rgbToHex(corrected) }} />}
              </div>
            )}
            {mode === 'white' && <div className="pcs-hint">{tr('color.tapWhite', 'Tap white paper or tablecloth')}</div>}
            {!point && mode === 'wine' && <div className="pcs-hint">{tr('color.tapWine', 'Zoom in and tap the wine')}</div>}
          </div>
          <div className="pcs-tools">
            <button type="button" className="pcs-icon" onClick={() => zoomAt(1 / 1.4, box.w / 2, box.h / 2)} aria-label="Zoom out"><ZoomOut size={17} /></button>
            <button type="button" className="pcs-icon" onClick={fit} aria-label="Fit photo"><Maximize size={16} /></button>
            <button type="button" className="pcs-icon" onClick={() => zoomAt(1.4, box.w / 2, box.h / 2)} aria-label="Zoom in"><ZoomIn size={17} /></button>
            <span className="pcs-sep" />
            <button type="button" className="pcs-icon" onClick={() => nudge(-1, 0)} aria-label="Move picker left"><ChevronLeft size={17} /></button>
            <button type="button" className="pcs-icon" onClick={() => nudge(0, -1)} aria-label="Move picker up"><ChevronUp size={17} /></button>
            <button type="button" className="pcs-icon" onClick={() => nudge(0, 1)} aria-label="Move picker down"><ChevronDown size={17} /></button>
            <button type="button" className="pcs-icon" onClick={() => nudge(1, 0)} aria-label="Move picker right"><ChevronRight size={17} /></button>
            <label className="pcs-patch">
              <span className="pcs-sr">Sample size</span>
              <select value={patchR} onChange={(e) => setPatchR(+e.target.value)} aria-label="Sample size">
                {PATCH_SIZES.map(([r, l]) => <option key={r} value={r}>{l}</option>)}
              </select>
            </label>
          </div>
          {whiteRgb && (
            <div className="pcs-wb">
              <span className="pcs-swatch" style={{ background: rgbToHex(whiteRgb) }} /> White reference {rgbToHex(whiteRgb)}
              <button type="button" className="pcs-link" onClick={() => setWhitePt(null)}><RotateCcw size={12} /> remove</button>
            </div>
          )}
        </>
      )}

      {photo && best && (
        <div className="pcs-result" aria-live="polite" data-testid="result">
          <div className="pcs-swatches">
            <span className="pcs-swatch big" style={{ background: shownHex }} title="Corrected sample" />
            {whiteRgb && <span className="pcs-swatch raw" style={{ background: rgbToHex(sample.rgb) }} title="Raw sample (before white balance)" />}
          </div>
          <div className="pcs-res-text">
            <div className="pcs-desc" data-testid="descriptor">{labelOf(desc)}</div>
            <div className="pcs-meta">{WINE_TYPES[desc.type].label} · <code data-testid="hex">{shownHex}</code>{whiteRgb ? <> · raw <code>{rgbToHex(sample.rgb)}</code></> : null}</div>
            <div className={`pcs-conf ${best.confidence}`}>
              {overridden ? `Your choice (auto: ${best.typeLabel.toLowerCase()} ${best.descriptor})` : `Match: ${best.confidence} (ΔE ${best.deltaE})`}
            </div>
          </div>
          {sample.spread > 0.3 && <p className="pcs-warn"><AlertTriangle size={13} /> Uneven patch (edge or reflection). Zoom in on an even area.</p>}
          {best.confidence === 'poor' && !overridden && <p className="pcs-warn"><AlertTriangle size={13} /> Doesn’t look like a wine colour. Try white balance or tap the wine’s core.</p>}
          <div className="pcs-alts">
            {ident.alternatives.slice(0, 2).map((a) => (
              <button type="button" key={a.type} className="pcs-chip" onClick={() => changeDesc({ type: a.type, hueIdx: a.hueIdx, intensity: a.intensity })}>
                {a.typeLabel}: {a.descriptor}
              </button>
            ))}
          </div>
          <button type="button" className={`btn ${confirmed ? 'btn-outline' : 'btn-gold'} pcs-confirm`} onClick={confirm} data-testid="confirm">
            <Check size={17} /> {confirmed ? tr('color.saved', 'Saved') : tr('color.useColor', 'Use this colour')}
          </button>
        </div>
      )}

      {/* Manual descriptor: override for photo results, keyboard/no-camera fallback otherwise */}
      <fieldset className="pcs-manual">
        <legend className="form-label">{photo ? tr('color.override', 'Descriptor (override if wrong)') : tr('color.manual', 'Or choose manually')}</legend>
        <div className="pcs-grid3">
          <select className="form-select" aria-label="Wine type" value={desc.type} onChange={(e) => changeDesc({ type: e.target.value })} data-testid="type-select">
            {TYPE_ORDER.map((k) => <option key={k} value={k}>{WINE_TYPES[k].label}</option>)}
          </select>
          <select className="form-select" aria-label="Hue" value={desc.hueIdx} onChange={(e) => changeDesc({ hueIdx: +e.target.value })}>
            {WINE_TYPES[desc.type].hues.map((h, i) => <option key={h.id} value={i}>{h.label}</option>)}
          </select>
          <select className="form-select" aria-label="Intensity" value={desc.intensity} onChange={(e) => changeDesc({ intensity: e.target.value })}>
            {INTENSITIES.map(([l]) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        {!photo && !saved && <div className="pcs-meta"><span className="pcs-swatch" style={{ background: shownHex }} /> {labelOf(desc)} · {shownHex} (reference)</div>}
      </fieldset>

      <div className="pcs-grid2">
        <div className="form-group">
          <label className="form-label" htmlFor="pcs-clarity">{tr('color.clarityLabel', 'Clarity')}</label>
          <select id="pcs-clarity" className="form-select" value={clarity} onChange={(e) => changeClarity(e.target.value)}>
            <option value="Clear">Clear</option><option value="Hazy">Hazy</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="pcs-rim">{tr('color.rimTransitionLabel', 'Rim Edge Transition')}</label>
          <select id="pcs-rim" className="form-select" value={rim} onChange={(e) => changeRim(e.target.value)}>
            {RIM_OPTIONS.map(([v, k, fb]) => <option key={v} value={v}>{tr(k, fb)}</option>)}
            {!RIM_OPTIONS.some(([v]) => v === rim) && <option value={rim}>{rim}</option>}
          </select>
        </div>
      </div>
      <p className="pcs-note">Colour names are matched to an approximate reference palette; lighting, glass and camera all shift colours.</p>
    </div>
  );
}

function drawCross(ctx, p, half) {
  ctx.strokeRect(p.x - half, p.y - half, half * 2, half * 2);
  ctx.beginPath();
  const g = half + 4, L = half + 16;
  ctx.moveTo(p.x - L, p.y); ctx.lineTo(p.x - g, p.y); ctx.moveTo(p.x + g, p.y); ctx.lineTo(p.x + L, p.y);
  ctx.moveTo(p.x, p.y - L); ctx.lineTo(p.x, p.y - g); ctx.moveTo(p.x, p.y + g); ctx.lineTo(p.x, p.y + L);
  ctx.stroke();
}
