import React, { useState, useRef, useEffect } from 'react';
import { Activity, Flame, Droplets, Gauge, Timer, Sparkles, Check, Wine, Zap } from 'lucide-react';
import EditableText from '../TextEditor/EditableText';
import { useTexts } from '../../context/TextContext';

const TANNIN_SLIDER_OPTIONS = [
  { value: 'Low (Soft)', label: 'Low', pillLabel: 'Low' },
  { value: 'Medium(-)', label: 'Med(-)', pillLabel: 'Med(-)' },
  { value: 'Medium (Velvety)', label: 'Medium', pillLabel: 'Medium' },
  { value: 'Medium(+)', label: 'Med(+)', pillLabel: 'Med(+)' },
  { value: 'High (Grippy)', label: 'High', pillLabel: 'High' }
];

const TANNIN_TEXTURES = [
  'Silky', 'Velvety', 'Chalky', 'Fine-grained', 'Grippy', 'Chewy', 'Muscular'
];

const ACIDITY_SLIDER_OPTIONS = [
  { value: 'Low', label: 'Low', pillLabel: 'Low' },
  { value: 'Medium(-)', label: 'Med(-)', pillLabel: 'Med(-)' },
  { value: 'Medium', label: 'Medium', pillLabel: 'Medium' },
  { value: 'Medium(+)', label: 'Med(+)', pillLabel: 'Med(+)' },
  { value: 'High', label: 'High', pillLabel: 'High' }
];

const BODY_SLIDER_OPTIONS = [
  { value: 'Light', label: 'Light', pillLabel: 'Light' },
  { value: 'Medium(-)', label: 'Med(-)', pillLabel: 'Med(-)' },
  { value: 'Medium', label: 'Medium', pillLabel: 'Medium' },
  { value: 'Medium(+)', label: 'Med(+)', pillLabel: 'Med(+)' },
  { value: 'Full-Bodied', label: 'Full', pillLabel: 'Full' }
];

const SWEETNESS_SLIDER_OPTIONS = [
  { value: 'Bone Dry', label: 'Bone Dry', pillLabel: 'Bone Dry' },
  { value: 'Dry', label: 'Dry', pillLabel: 'Dry' },
  { value: 'Off-Dry', label: 'Off-Dry', pillLabel: 'Off-Dry' },
  { value: 'Medium-Dry', label: 'Med-Dry', pillLabel: 'Med-Dry' },
  { value: 'Sweet', label: 'Sweet', pillLabel: 'Sweet' }
];

const ALCOHOL_SLIDER_OPTIONS = [
  { value: 'Low (<11%)', label: 'Low', pillLabel: 'Low', sub: '< 11%' },
  { value: 'Medium(-)', label: 'Medium(-)', pillLabel: 'Med(-)' },
  { value: 'Medium (11-13.9%)', label: 'Medium', pillLabel: 'Medium', sub: '11 - 13.9%' },
  { value: 'Medium(+)', label: 'Medium(+)', pillLabel: 'Med(+)' },
  { value: 'High (≥14%)', label: 'High', pillLabel: 'High', sub: '≥ 14%' }
];

const FLAVOR_SLIDER_OPTIONS = [
  { value: 'Light', label: 'Light', pillLabel: 'Light' },
  { value: 'Medium(-)', label: 'Med(-)', pillLabel: 'Med(-)' },
  { value: 'Medium', label: 'Medium', pillLabel: 'Medium' },
  { value: 'Medium(+)', label: 'Med(+)', pillLabel: 'Med(+)' },
  { value: 'Pronounced', label: 'Pronounced', pillLabel: 'Pronounced' }
];

// Helper to determine Finish classification & description based on seconds
export const getFinishTierInfo = (seconds) => {
  const sec = Math.max(0, Math.min(60, Number(seconds) || 0));
  if (sec < 15) {
    return {
      tier: 'Short',
      range: '<15s',
      desc: 'Flavors dissipate quickly on the palate',
      color: '#a395a8'
    };
  }
  if (sec < 30) {
    return {
      tier: 'Medium',
      range: '15-30s',
      desc: 'Balanced, pleasant persistence of fruit and oak',
      color: '#e6c86e'
    };
  }
  if (sec < 45) {
    return {
      tier: 'Medium(+)',
      range: '30-45s',
      desc: 'Impressive sustained complexity and structure',
      color: '#f39c12'
    };
  }
  return {
    tier: 'Long',
    range: '45s+',
    desc: 'Exceptional lingering resonance, multi-dimensional finish',
    color: '#d4af37'
  };
};

// Smart parser from existing note strings into seconds
const parseInitialSeconds = (palateData) => {
  if (typeof palateData?.finishSeconds === 'number' && !isNaN(palateData.finishSeconds)) {
    return palateData.finishSeconds;
  }
  const str = palateData?.finish || '';
  const match = str.match(/(\d+)\s*s/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  if (str.includes('45s+') || str.includes('Long')) return 48;
  if (str.includes('30-45s') || str.includes('Medium(+)')) return 36;
  if (str.includes('15-30s') || str.includes('Medium')) return 22;
  if (str.includes('<15s') || str.includes('Short')) return 10;
  return 22; // default
};

const SNAP_POSITIONS = [15.5, 33.33, 50.0, 66.67, 84.5];

/**
 * Reusable Luxury Sommelier Gold Track Slider
 * Exposes 3 main anchors [Low | Medium | High] with thin separators.
 * Slides smoothly and parks between choices for Med(-) and Med(+).
 */
function SommelierTrackSlider({ value, onChange, options, anchorLabels, anchorSubLabels = null, ariaLabel }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState(null);
  const trackRef = useRef(null);

  // Determine active index based on value
  const activeIndex = (() => {
    // 1. Exact match by value
    let idx = options.findIndex(opt => opt.value === value);
    if (idx !== -1) return idx;

    // 2. Exact match by pillLabel or label
    idx = options.findIndex(opt => opt.pillLabel === value || opt.label === value);
    if (idx !== -1) return idx;

    // 3. Exact marker for (+) or (-)
    if (typeof value === 'string') {
      if (value.includes('+') || value.includes('(+)')) {
        idx = options.findIndex(opt => opt.value.includes('+') || opt.label.includes('+'));
        if (idx !== -1) return idx;
      }
      if (value.includes('-') || value.includes('(-)')) {
        idx = options.findIndex(opt => opt.value.includes('-') || opt.label.includes('-'));
        if (idx !== -1) return idx;
      }
    }

    // 4. Starts with match
    idx = options.findIndex(opt =>
      value && typeof value === 'string' && (value.startsWith(opt.label) || opt.value.startsWith(value))
    );
    return idx === -1 ? 2 : idx;
  })();

  const getNearestIndexFromPct = (pct) => {
    if (pct < 24.4) return 0;
    if (pct < 41.7) return 1;
    if (pct < 58.3) return 2;
    if (pct < 75.6) return 3;
    return 4;
  };

  const updateFromPointer = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawPct = (rawX / rect.width) * 100;
    const clampedPct = Math.max(15.5, Math.min(84.5, rawPct));
    setDragPct(clampedPct);

    const newIndex = getNearestIndexFromPct(clampedPct);
    if (options[newIndex] && options[newIndex].value !== value) {
      onChange(options[newIndex].value);
    }
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updateFromPointer(e.clientX);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    setDragPct(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(4, activeIndex + 1);
      onChange(options[next].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(0, activeIndex - 1);
      onChange(options[prev].value);
    }
  };

  const activeOption = options[activeIndex] || options[2];
  const snapPosition = SNAP_POSITIONS[activeIndex] ?? 50;
  const currentLeft = isDragging && dragPct !== null ? dragPct : snapPosition;

  return (
    <div
      ref={trackRef}
      className="sommelier-slider-track"
      tabIndex={0}
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={activeIndex}
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuetext={activeOption.label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      {/* 3 Exposed Sectors with thin separators [Low | Medium | High] - NO DOTS */}
      <div className="sommelier-slider-sectors">
        <div className="sommelier-slider-sector" style={{ flexDirection: 'column', gap: '1px' }}>
          <span>{anchorLabels[0]}</span>
          {anchorSubLabels?.[0] && (
            <span style={{ fontSize: '0.62rem', opacity: 0.65, fontWeight: 500 }}>
              {anchorSubLabels[0]}
            </span>
          )}
        </div>

        <div className="sommelier-slider-separator" />

        <div className="sommelier-slider-sector" style={{ flexDirection: 'column', gap: '1px' }}>
          <span>{anchorLabels[1]}</span>
          {anchorSubLabels?.[1] && (
            <span style={{ fontSize: '0.62rem', opacity: 0.65, fontWeight: 500 }}>
              {anchorSubLabels[1]}
            </span>
          )}
        </div>

        <div className="sommelier-slider-separator" />

        <div className="sommelier-slider-sector" style={{ flexDirection: 'column', gap: '1px' }}>
          <span>{anchorLabels[2]}</span>
          {anchorSubLabels?.[2] && (
            <span style={{ fontSize: '0.62rem', opacity: 0.65, fontWeight: 500 }}>
              {anchorSubLabels[2]}
            </span>
          )}
        </div>
      </div>

      {/* Gold Sliding Indicator - moves smoothly, straddles separators for Med- and Med+ */}
      <div
        className={`sommelier-slider-thumb ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${currentLeft}%`,
          transition: isDragging ? 'none' : 'left 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s ease, box-shadow 0.2s ease'
        }}
      >
        {activeOption.pillLabel || activeOption.label}
      </div>
    </div>
  );
}

const SWEETNESS_SNAP_POSITIONS = [10.0, 30.0, 50.0, 70.0, 90.0];

/**
 * 5-Sector Slideable Track Slider for Sweetness Level
 * [ Bone Dry | Dry | Off-Dry | Med-Dry | Sweet ]
 */
function Sommelier5SectorSlider({ value, onChange, options, ariaLabel }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState(null);
  const trackRef = useRef(null);

  const activeIndex = (() => {
    const idx = options.findIndex(opt =>
      opt.value === value || opt.label === value || opt.pillLabel === value
    );
    return idx === -1 ? 1 : idx;
  })();

  const getNearestIndexFromPct = (pct) => {
    const idx = Math.floor(pct / 20);
    return Math.max(0, Math.min(4, idx));
  };

  const updateFromPointer = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawPct = (rawX / rect.width) * 100;
    const clampedPct = Math.max(10.0, Math.min(90.0, rawPct));
    setDragPct(clampedPct);

    const newIndex = getNearestIndexFromPct(clampedPct);
    if (options[newIndex] && options[newIndex].value !== value) {
      onChange(options[newIndex].value);
    }
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updateFromPointer(e.clientX);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    setDragPct(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(4, activeIndex + 1);
      onChange(options[next].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(0, activeIndex - 1);
      onChange(options[prev].value);
    }
  };

  const activeOption = options[activeIndex] || options[1];
  const snapPosition = SWEETNESS_SNAP_POSITIONS[activeIndex] ?? 30.0;
  const currentLeft = isDragging && dragPct !== null ? dragPct : snapPosition;

  return (
    <div
      ref={trackRef}
      className="sommelier-slider-track"
      tabIndex={0}
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={activeIndex}
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuetext={activeOption.label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      {/* 5 Exposed Sectors with thin separators */}
      <div className="sommelier-slider-sectors">
        {options.map((opt, i) => (
          <React.Fragment key={opt.value}>
            <div className="sommelier-slider-sector" style={{ fontSize: '0.74rem' }}>
              {opt.pillLabel || opt.label}
            </div>
            {i < options.length - 1 && <div className="sommelier-slider-separator" />}
          </React.Fragment>
        ))}
      </div>

      {/* Gold Sliding Indicator */}
      <div
        className={`sommelier-slider-thumb ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${currentLeft}%`,
          width: '19%',
          fontSize: '0.74rem',
          transition: isDragging ? 'none' : 'left 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s ease, box-shadow 0.2s ease'
        }}
      >
        {activeOption.pillLabel || activeOption.label}
      </div>
    </div>
  );
}

export default function PalateStep({ palateData = {}, updatePalateData }) {
  const [finishSeconds, setFinishSeconds] = useState(() => parseInitialSeconds(palateData));
  const [isPressingTimer, setIsPressingTimer] = useState(false);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [timerSavedFlash, setTimerSavedFlash] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Sync state if palateData externally changes
  useEffect(() => {
    const sec = parseInitialSeconds(palateData);
    if (!isPressingTimer && sec !== finishSeconds) {
      setFinishSeconds(sec);
    }
  }, [palateData?.finish, palateData?.finishSeconds]);

  const handleChange = (field, value) => {
    updatePalateData({ ...palateData, [field]: value });
  };

  // Commit finish changes
  const handleFinishChange = (newSeconds) => {
    const clamped = Math.max(0, Math.min(60, Math.round(newSeconds)));
    setFinishSeconds(clamped);
    const tierInfo = getFinishTierInfo(clamped);
    const formattedFinish = `${tierInfo.tier} (${clamped}s)`;
    updatePalateData({
      ...palateData,
      finishSeconds: clamped,
      finish: formattedFinish
    });
  };

  // ==========================================
  // LONG-PRESS STOPWATCH TIMER FOR AFTERTASTE
  // ==========================================
  const startTiming = (e) => {
    if (e && e.cancelable) {
      e.preventDefault();
    }
    if (isPressingTimer) return;

    setIsPressingTimer(true);
    startTimeRef.current = performance.now();
    setLiveElapsed(0);

    // Haptic feedback if supported on mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch (err) {}
    }

    // High-resolution timer loop
    timerRef.current = setInterval(() => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const currentSec = Math.min(60, elapsed);
      setLiveElapsed(currentSec);
      setFinishSeconds(Math.round(currentSec));
    }, 50);
  };

  const stopTiming = () => {
    if (!isPressingTimer) return;

    clearInterval(timerRef.current);
    timerRef.current = null;
    setIsPressingTimer(false);

    const elapsed = (performance.now() - (startTimeRef.current || performance.now())) / 1000;
    const finalSec = Math.max(1, Math.min(60, Math.round(elapsed)));

    handleFinishChange(finalSec);

    // Haptic confirmation
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([30, 50, 30]);
      } catch (err) {}
    }

    setTimerSavedFlash(true);
    setTimeout(() => {
      setTimerSavedFlash(false);
    }, 1800);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const finishTier = getFinishTierInfo(finishSeconds);
  const currentTannin = palateData.tannin || 'Medium (Velvety)';
  const currentTexture = palateData.tanninTexture || 'Velvety';
  const currentAcidity = palateData.acidity || 'Medium';
  const currentBody = palateData.body || 'Medium';
  const currentSweetness = palateData.sweetness || 'Dry';
  const currentAlcohol = palateData.alcoholLevel || 'Medium (11-13.9%)';
  const currentFlavor = palateData.flavorIntensity || 'Pronounced';

  const sliderPercent = (finishSeconds / 60) * 100;

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <h3 className="card-title font-serif">
          <Activity size={22} color="#d4af37" />
          <EditableText textKey="palate.title" defaultText="Palate & Structural Balance" />
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-gold)', background: 'rgba(212,175,55,0.1)', padding: '4px 12px', borderRadius: '12px' }}>
          <EditableText textKey="palate.stepBadge" defaultText="Step 4 of 6" />
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ====================================================
            1. TANNIN ARCHITECTURE (Crucial Pillar for Red Wine)
           ==================================================== */}
        <div className="palate-section-card" style={{ background: 'linear-gradient(135deg, rgba(128, 0, 32, 0.18) 0%, rgba(20, 10, 24, 0.7) 100%)', borderColor: 'rgba(184, 29, 64, 0.35)' }}>
          <div className="palate-section-header">
            <div className="palate-section-title" style={{ color: 'var(--gold-light)' }}>
              <Flame size={17} color="#b81d40" />
              <EditableText textKey="palate.tanninTitle" defaultText="Tannin Quantity & Grip" />
            </div>
          </div>
          <div className="palate-section-desc">
            Astringency and drying sensation on gums. Forms the essential aging backbone of fine red wines.
          </div>

          {/* Gold Sommelier Slider: Low <-> Medium <-> High */}
          <SommelierTrackSlider
            value={currentTannin}
            onChange={(val) => handleChange('tannin', val)}
            options={TANNIN_SLIDER_OPTIONS}
            anchorLabels={['Low', 'Medium', 'High']}
            ariaLabel="Tannin Level"
          />

          {/* Sommelier Tannin Texture Pills */}
          <div className="texture-pills-wrap">
            <span style={{ fontSize: '0.72rem', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
              Texture:
            </span>
            {TANNIN_TEXTURES.map((tex) => (
              <button
                key={tex}
                type="button"
                className={`texture-pill ${currentTexture === tex ? 'active' : ''}`}
                onClick={() => handleChange('tanninTexture', tex)}
              >
                {tex}
              </button>
            ))}
          </div>
        </div>

        {/* ====================================================
            2. ACIDITY (Freshness & Salivation)
           ==================================================== */}
        <div className="palate-section-card">
          <div className="palate-section-header">
            <div className="palate-section-title" style={{ color: 'var(--text-main)' }}>
              <Droplets size={17} color="#38bdf8" />
              <EditableText textKey="palate.acidityTitle" defaultText="Acidity Level" />
            </div>
          </div>
          <div className="palate-section-desc">
            Stimulates salivary glands at the sides of the tongue. Provides vibrancy, lift, and aging balance.
          </div>

          {/* Gold Sommelier Slider: Low <-> Medium <-> High */}
          <SommelierTrackSlider
            value={currentAcidity}
            onChange={(val) => handleChange('acidity', val)}
            options={ACIDITY_SLIDER_OPTIONS}
            anchorLabels={['Low', 'Medium', 'High']}
            ariaLabel="Acidity Level"
          />
        </div>

        {/* ====================================================
            3. BODY & PALATE WEIGHT (Viscosity)
           ==================================================== */}
        <div className="palate-section-card">
          <div className="palate-section-header">
            <div className="palate-section-title" style={{ color: 'var(--text-main)' }}>
              <Gauge size={17} color="#d4af37" />
              <EditableText textKey="palate.bodyTitle" defaultText="Body Weight" />
            </div>
          </div>
          <div className="palate-section-desc">
            Overall impression of weight and thickness in mouth, influenced by alcohol, tannins, and extract.
          </div>

          {/* Gold Sommelier Slider: Light <-> Medium <-> Full */}
          <SommelierTrackSlider
            value={currentBody}
            onChange={(val) => handleChange('body', val)}
            options={BODY_SLIDER_OPTIONS}
            anchorLabels={['Light', 'Medium', 'Full']}
            ariaLabel="Body Weight"
          />
        </div>

        {/* ====================================================
            4. FLAVOR INTENSITY ON PALATE
           ==================================================== */}
        <div className="palate-section-card" style={{ padding: '16px 20px' }}>
          <div className="palate-section-header">
            <span className="palate-section-title" style={{ fontSize: '0.9rem' }}>
              <EditableText textKey="palate.flavorTitle" defaultText="Flavor Intensity (Palate Concentration)" />
            </span>
          </div>

          {/* Gold Sommelier Slider: Light <-> Medium <-> Pronounced */}
          <SommelierTrackSlider
            value={currentFlavor}
            onChange={(val) => handleChange('flavorIntensity', val)}
            options={FLAVOR_SLIDER_OPTIONS}
            anchorLabels={['Light', 'Medium', 'Pronounced']}
            ariaLabel="Flavor Intensity"
          />
        </div>

        {/* ====================================================
            5. DUAL ROW: FINISH (LEFT 50%) + SWEETNESS & ALCOHOL (RIGHT 50%)
           ==================================================== */}
        <div className="finish-sweetness-alcohol-grid">
          
          {/* Left: Finish & Aftertaste Length */}
          <div className="finish-slider-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', marginBottom: 0 }}>
            <div>
              <div className="palate-section-header" style={{ marginBottom: '6px' }}>
                <div className="palate-section-title" style={{ color: 'var(--gold-light)', fontSize: '1.02rem' }}>
                  <Timer size={19} color="var(--gold-primary)" />
                  <EditableText textKey="palate.finishTitle" defaultText="Finish & Aftertaste Length" />
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                <strong style={{ color: finishTier.color }}>{finishTier.tier} ({finishSeconds}s)</strong> — {finishTier.desc}
              </div>

              {/* Controls: Continuous Slider + Stopwatch Long-Press Button */}
              <div className="finish-controls-layout">
                {/* Continuous Slider Track */}
                <div className="finish-slider-track-wrap">
                  <div style={{ position: 'relative' }}>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="1"
                      className="custom-range-slider"
                      value={finishSeconds}
                      onChange={(e) => handleFinishChange(e.target.value)}
                      style={{
                        background: `linear-gradient(to right, #b81d40 0%, #d4af37 ${sliderPercent}%, rgba(255,255,255,0.08) ${sliderPercent}%, rgba(255,255,255,0.08) 100%)`
                      }}
                      aria-label="Aftertaste duration in seconds"
                    />
                  </div>

                  {/* Benchmark Ticks */}
                  <div className="benchmark-ticks">
                    <span onClick={() => handleFinishChange(0)} className={finishSeconds === 0 ? 'active' : ''}>
                      0s
                    </span>
                    <span onClick={() => handleFinishChange(15)} className={finishSeconds >= 15 && finishSeconds < 30 ? 'active' : ''} style={{ transform: 'translateX(-12%)' }}>
                      | 15s (Med)
                    </span>
                    <span onClick={() => handleFinishChange(30)} className={finishSeconds >= 30 && finishSeconds < 45 ? 'active' : ''} style={{ transform: 'translateX(-8%)' }}>
                      | 30s (Med+)
                    </span>
                    <span onClick={() => handleFinishChange(45)} className={finishSeconds >= 45 ? 'active' : ''}>
                      | 45s+ (Long)
                    </span>
                    <span onClick={() => handleFinishChange(60)} className={finishSeconds === 60 ? 'active' : ''}>
                      60s
                    </span>
                  </div>
                </div>

                {/* Sommelier Hold-to-Time Stopwatch Button */}
                <button
                  type="button"
                  className={`aftertaste-timer-btn ${isPressingTimer ? 'pressing' : ''}`}
                  onPointerDown={startTiming}
                  onPointerUp={stopTiming}
                  onPointerLeave={stopTiming}
                  onPointerCancel={stopTiming}
                  title="Press and hold while tasting to measure aftertaste duration"
                >
                  {isPressingTimer ? (
                    <>
                      <div className="timer-live-time">
                        {liveElapsed.toFixed(1)}s
                      </div>
                      <span className="timer-btn-label">
                        <EditableText textKey="palate.releaseBtn" defaultText="Release" />
                      </span>
                    </>
                  ) : timerSavedFlash ? (
                    <>
                      <Check size={18} color="#4ade80" />
                      <span className="timer-btn-label" style={{ color: '#4ade80' }}>
                        <EditableText textKey="palate.savedBtn" defaultText="Saved!" />
                      </span>
                    </>
                  ) : (
                    <>
                      <Timer size={18} color="var(--gold-primary)" />
                      <span className="timer-btn-label">
                        <EditableText textKey="palate.holdToTimeBtn" defaultText="Hold to Time" />
                      </span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
                        <EditableText textKey="palate.holdToTimeSub" defaultText="Press & Hold" />
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sommelier Hint */}
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-gold)', opacity: 0.85 }}>
              <Sparkles size={12} />
              <span>
                <EditableText textKey="palate.finishTip" defaultText="Sommelier Tip: Press & hold upon swallowing. Release when flavor persistence fades." />
              </span>
            </div>
          </div>

          {/* Right: Sweetness & Alcohol Warmth stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
            
            {/* Sweetness Level - Slideable */}
            <div className="palate-section-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 20px', margin: 0 }}>
              <div className="palate-section-header" style={{ marginBottom: '10px' }}>
                <span className="palate-section-title" style={{ fontSize: '0.9rem' }}>
                  <EditableText textKey="palate.sweetnessTitle" defaultText="Sweetness Level" />
                </span>
              </div>
              <Sommelier5SectorSlider
                value={currentSweetness}
                onChange={(val) => handleChange('sweetness', val)}
                options={SWEETNESS_SLIDER_OPTIONS}
                ariaLabel="Sweetness Level"
              />
            </div>

            {/* Alcohol Warmth - Slideable */}
            <div className="palate-section-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 20px', margin: 0 }}>
              <div className="palate-section-header" style={{ marginBottom: '10px' }}>
                <span className="palate-section-title" style={{ fontSize: '0.9rem' }}>
                  <EditableText textKey="palate.alcoholTitle" defaultText="Alcohol Warmth" />
                </span>
              </div>
              <SommelierTrackSlider
                value={currentAlcohol}
                onChange={(val) => handleChange('alcoholLevel', val)}
                options={ALCOHOL_SLIDER_OPTIONS}
                anchorLabels={['Low', 'Medium', 'High']}
                anchorSubLabels={['< 11%', '11 - 13.9%', '≥ 14%']}
                ariaLabel="Alcohol Warmth"
              />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

