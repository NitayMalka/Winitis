/**
 * PhotoColorStep — photo picker shown in the ColorStep's photo sheet.
 * Take/upload a photo → pinch/scroll to zoom, drag to pan → tap the wine → fine-adjust
 * with the swatch circle → "Use this colour". Optional white-balance tap on paper/tablecloth.
 * The colour is matched (CIEDE2000) to an approximate WSET palette and the identified
 * descriptor is handed to the host via onConfirm(patch).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImagePlus, Crosshair, Sun, Check, AlertTriangle } from 'lucide-react';
import { rgbToHex } from './winePalette.js';
import { samplePatch, identify, whiteBalanceGains, applyGains } from './wineIdentify.js';
import { loadPhoto } from './imageTools.js';
import './photoColorStep.css';

const PATCH_R = 4; // 9×9 sample patch

/** Props: onConfirm(patch) — called with the picked colour; t — optional i18n. */
export default function PhotoColorStep({ onConfirm, t }) {
  const tr = (k, fb) => (t ? t(k, fb) : fb);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState({ s: 1, tx: 0, ty: 0 });
  const [point, setPoint] = useState(null);
  const [whitePt, setWhitePt] = useState(null);
  const [mode, setMode] = useState('wine');
  const [box, setBox] = useState({ w: 360, h: 420 });

  const camRef = useRef(null), galRef = useRef(null), vpRef = useRef(null), canvasRef = useRef(null);
  const st = useRef({}); // latest values for gesture handlers
  st.current = { view, point, photo, box, mode };

  // ---- sampling + identification ------------------------------------------
  const whiteRgb = useMemo(() => (photo && whitePt ? samplePatch(photo.imageData, whitePt.x, whitePt.y, 6, { trimHigh: 0.1, trimLow: 0.1 })?.rgb : null), [photo, whitePt]);
  const sample = useMemo(() => (photo && point ? samplePatch(photo.imageData, point.x, point.y, PATCH_R) : null), [photo, point]);
  const corrected = useMemo(() => (sample ? (whiteRgb ? applyGains(sample.rgb, whiteBalanceGains(whiteRgb)) : sample.rgb) : null), [sample, whiteRgb]);
  const ident = useMemo(() => (corrected ? identify(corrected) : null), [corrected]);

  // ---- viewport geometry ------------------------------------------------------
  useEffect(() => {
    const el = vpRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [photo]);
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
      setPhoto(p); setPoint(null); setWhitePt(null); setMode('wine');
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
      const p = toScreen(point), half = Math.max(3, ((2 * PATCH_R + 1) * view.s) / 2);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.65)'; drawCross(ctx, p, half);
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#f7e4a1'; drawCross(ctx, p, half);
    }
  }, [photo, view, point, whitePt, box]);

  // ---- gestures --------------------------------------------------------------------
  const ptrs = useRef(new Map());
  const gest = useRef(null);
  const local = (e) => { const r = vpRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  const pick = (sp) => {
    const ip = toImage(sp.x, sp.y);
    const p = st.current.photo;
    if (ip.x < 0 || ip.y < 0 || ip.x >= p.width || ip.y >= p.height) return;
    if (st.current.mode === 'white') { setWhitePt(ip); setMode('wine'); }
    else setPoint(ip);
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

  const nudge = (dx, dy) => { if (!point) { setPoint(toImage(box.w / 2, box.h / 2)); return; } setPoint((p) => clampPt({ x: p.x + dx, y: p.y + dy })); };
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 1;
    const map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (map[e.key]) { e.preventDefault(); nudge(...map[e.key]); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAt(1.4, box.w / 2, box.h / 2); }
    else if (e.key === '-') { e.preventDefault(); zoomAt(1 / 1.4, box.w / 2, box.h / 2); }
    else if (e.key === 'Enter' && point) { e.preventDefault(); confirm(); }
  };

  // ---- confirm: hand the identified colour to the host ------------------------------
  const confirm = () => {
    if (!corrected || !ident) return;
    const b = ident.best;
    onConfirm({
      id: b.hueId,
      name: b.hueLabel,
      intensity: b.intensity,
      wineType: b.type,
      descriptor: b.descriptor,
      hex: rgbToHex(corrected),
      source: 'photo',
      sampledHex: rgbToHex(sample.rgb),
      whiteRefHex: whiteRgb ? rgbToHex(whiteRgb) : null,
      matchDeltaE: b.deltaE,
    });
  };

  // ---- render ------------------------------------------------------------------------
  const pickedHex = corrected ? rgbToHex(corrected) : null;
  const whiteHex = whiteRgb ? rgbToHex(whiteRgb) : null;
  const swatchHex = mode === 'white' ? whiteHex : pickedHex; // white mode shows the tapped white
  // swatch sits top-left; move it right only if the pick point would be hidden under it
  const pScreen = point ? toScreen(point) : null;
  const swatchRight = !!pScreen && pScreen.x < 120 && pScreen.y < 150;

  return (
    <div className="pcs card">
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }} data-testid="camera-input" />
      <input ref={galRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }} data-testid="gallery-input" />

      {!photo && (
        <div className="pcs-empty-min">
          <div className="pcs-actions">
            <button type="button" className="btn btn-gold" onClick={() => camRef.current.click()} disabled={loading} aria-label="Take a photo of the wine"><Camera size={17} /> {tr('color.takePhoto', 'Take photo')}</button>
            <button type="button" className="btn btn-outline" onClick={() => galRef.current.click()} disabled={loading} aria-label="Upload a photo of the wine"><ImagePlus size={17} /> {tr('color.upload', 'Upload')}</button>
          </div>
          {loading && <span className="pcs-sr" role="status">Loading photo…</span>}
        </div>
      )}
      {error && <p className="pcs-error" role="alert"><AlertTriangle size={14} /> {error}</p>}

      {photo && (
        <>
          <div className="card-header pcs-header pcs-header-min">
            <button type="button" className="btn btn-outline pcs-small" onClick={() => galRef.current.click()} aria-label="Choose a new photo"><ImagePlus size={15} /> {tr('color.newPhoto', 'New photo')}</button>
          </div>
          <div className="pcs-modebar" role="radiogroup" aria-label="Tap mode">
            <button type="button" role="radio" aria-checked={mode === 'wine'} className={mode === 'wine' ? 'on' : ''} onClick={() => setMode('wine')}><Crosshair size={15} /> {tr('color.pickWine', 'Pick wine')}</button>
            <button type="button" role="radio" aria-checked={mode === 'white'} className={mode === 'white' ? 'on' : ''} onClick={() => setMode('white')}><Sun size={15} /> {whiteRgb ? tr('color.whiteSet', 'White ✓') : tr('color.pickWhite', 'White balance')}</button>
          </div>
          <div
            ref={vpRef}
            className={`pcs-viewport ${mode === 'white' ? 'white-mode' : ''}`}
            tabIndex={0}
            role="application"
            aria-label="Wine photo. Pinch or scroll to zoom, drag to pan, tap to pick. Arrow keys move the picker, plus and minus zoom, Enter uses the colour."
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            data-testid="viewport"
          >
            <canvas ref={canvasRef} />
            {swatchHex && (
              <div className={`pcs-swatch-overlay ${swatchRight ? 'right' : 'left'}`} data-testid="swatch">
                <span className="pcs-swatch-circle" style={{ background: swatchHex }} />
                <code className="pcs-swatch-hex" data-testid="hex">{swatchHex}</code>
              </div>
            )}
          </div>
          <span className="pcs-sr" aria-live="polite">{pickedHex ? `Picked colour ${pickedHex}` : ''}</span>
          <button type="button" className="btn btn-gold pcs-confirm" onClick={confirm} disabled={!pickedHex} data-testid="confirm" aria-label={pickedHex ? `Use colour ${pickedHex}` : 'Use this colour (tap the wine first)'}>
            <Check size={17} /> {tr('color.useColor', 'Use this colour')}
          </button>
        </>
      )}
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
