import React, { useState, useRef, useEffect } from 'react';
import { Activity, Flame, Droplets, Gauge, Timer, Wine, Zap, Sparkles } from 'lucide-react';
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
const getFinishTierInfo = (seconds) => {
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

const TEXTURE_SNAP_POSITIONS = [7.14, 21.43, 35.71, 50.0, 64.29, 78.57, 92.86];

/**
 * 7-Sector Slideable Track Slider for Tannin Texture
 * [ Silky | Velvety | Chalky | Fine-grained | Grippy | Chewy | Muscular ]
 */
function SommelierTextureSlider({ value, onChange, options, ariaLabel }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState(null);
  const trackRef = useRef(null);

  const activeIndex = (() => {
    const idx = options.indexOf(value);
    return idx === -1 ? 1 : idx;
  })();

  const getNearestIndexFromPct = (pct) => {
    const step = 100 / options.length;
    const idx = Math.floor(pct / step);
    return Math.max(0, Math.min(options.length - 1, idx));
  };

  const updateFromPointer = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawPct = (rawX / rect.width) * 100;
    const clampedPct = Math.max(7.14, Math.min(92.86, rawPct));
    setDragPct(clampedPct);

    const newIndex = getNearestIndexFromPct(clampedPct);
    if (options[newIndex] && options[newIndex] !== value) {
      onChange(options[newIndex]);
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
      const next = Math.min(options.length - 1, activeIndex + 1);
      onChange(options[next]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(0, activeIndex - 1);
      onChange(options[prev]);
    }
  };

  const activeOption = options[activeIndex] || options[1];
  const snapPosition = TEXTURE_SNAP_POSITIONS[activeIndex] ?? 21.43;
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
      aria-valuemax={options.length - 1}
      aria-valuetext={activeOption}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      style={{ cursor: 'grab' }}
    >
      {/* 7 Exposed Sectors with thin separators */}
      <div className="sommelier-slider-sectors">
        {options.map((opt, i) => (
          <React.Fragment key={opt}>
            <div
              className="sommelier-slider-sector"
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-muted)'
              }}
              onClick={() => onChange(opt)}
            >
              {opt}
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
          width: '13.8%',
          fontSize: '0.72rem',
          padding: '0 2px',
          transition: isDragging ? 'none' : 'left 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s ease, box-shadow 0.2s ease'
        }}
      >
        {activeOption}
      </div>
    </div>
  );
}

const BAR_TYPES = [
  {
    id: 'tannin',
    label: 'Tannin',
    icon: Flame,
    color: '#d4af37',
    options: [
      { value: 'Low (Soft)', label: 'Low', sub: 'Soft' },
      { value: 'Medium(-)', label: 'Med(-)', sub: 'Light Grip' },
      { value: 'Medium (Velvety)', label: 'Medium', sub: 'Velvety' },
      { value: 'Medium(+)', label: 'Med(+)', sub: 'Structured' },
      { value: 'High (Grippy)', label: 'High', sub: 'Grippy' }
    ]
  },
  {
    id: 'tanninTexture',
    label: 'Texture',
    icon: Sparkles,
    color: '#f7e4a1',
    options: [
      { value: 'Silky', label: 'Silky' },
      { value: 'Velvety', label: 'Velvety' },
      { value: 'Chalky', label: 'Chalky' },
      { value: 'Fine-grained', label: 'Fine-grained' },
      { value: 'Grippy', label: 'Grippy' },
      { value: 'Chewy', label: 'Chewy' },
      { value: 'Muscular', label: 'Muscular' }
    ]
  },
  {
    id: 'acidity',
    label: 'Acidity',
    icon: Droplets,
    color: '#38bdf8',
    options: [
      { value: 'Low', label: 'Low', sub: 'Soft' },
      { value: 'Medium(-)', label: 'Med(-)', sub: 'Gentle' },
      { value: 'Medium', label: 'Medium', sub: 'Balanced' },
      { value: 'Medium(+)', label: 'Med(+)', sub: 'Bright' },
      { value: 'High', label: 'High', sub: 'Crisp / Tart' }
    ]
  },
  {
    id: 'body',
    label: 'Body',
    icon: Gauge,
    color: '#e6c86e',
    options: [
      { value: 'Light', label: 'Light', sub: 'Lean' },
      { value: 'Medium(-)', label: 'Med(-)', sub: 'Light-Med' },
      { value: 'Medium', label: 'Medium', sub: 'Balanced' },
      { value: 'Medium(+)', label: 'Med(+)', sub: 'Med-Full' },
      { value: 'Full-Bodied', label: 'Full', sub: 'Rich' }
    ]
  },
  {
    id: 'flavorIntensity',
    label: 'Flavor',
    icon: Zap,
    color: '#f59e0b',
    options: [
      { value: 'Light', label: 'Light', sub: 'Faint' },
      { value: 'Medium(-)', label: 'Med(-)', sub: 'Subtle' },
      { value: 'Medium', label: 'Medium', sub: 'Moderate' },
      { value: 'Medium(+)', label: 'Med(+)', sub: 'Expressive' },
      { value: 'Pronounced', label: 'Pronounced', sub: 'Intense' }
    ]
  },
  {
    id: 'finish',
    label: 'Aftertaste',
    icon: Timer,
    color: '#d4af37',
    options: [
      { value: 'Short (<15s)', seconds: 10, label: 'Short', sub: '< 15s' },
      { value: 'Medium (15-30s)', seconds: 22, label: 'Medium', sub: '15-30s' },
      { value: 'Medium(+) (30-45s)', seconds: 36, label: 'Med(+)', sub: '30-45s' },
      { value: 'Long (45s+)', seconds: 48, label: 'Long', sub: '45s+' }
    ]
  },
  {
    id: 'sweetness',
    label: 'Sweetness',
    icon: Wine,
    color: '#ec4899',
    options: [
      { value: 'Bone Dry', label: 'Bone Dry', sub: '0g sugar' },
      { value: 'Dry', label: 'Dry', sub: 'Standard' },
      { value: 'Off-Dry', label: 'Off-Dry', sub: 'Hint' },
      { value: 'Medium-Dry', label: 'Med-Dry', sub: 'Noticeable' },
      { value: 'Sweet', label: 'Sweet', sub: 'Dessert' }
    ]
  },
  {
    id: 'alcoholLevel',
    label: 'Alcohol',
    icon: Flame,
    color: '#ef4444',
    options: [
      { value: 'Low (<11%)', label: 'Low', sub: '< 11%' },
      { value: 'Medium(-)', label: 'Med(-)', sub: '11-12%' },
      { value: 'Medium (11-13.9%)', label: 'Medium', sub: '12-13.9%' },
      { value: 'Medium(+)', label: 'Med(+)', sub: '14-14.5%' },
      { value: 'High (≥14%)', label: 'High', sub: '≥ 15%' }
    ]
  }
];

/**
 * Linear 5-Position Bar Slider Picker (No Loop)
 * Displays the picked bar in the middle with chosen value stacked below name,
 * with previous/next bars on its left/right,
 * and next-next bars shaded out and half-covered by the container boundaries.
 */
function BarCarouselPicker({ barTypes, selectedBarId, onSelectBar, getBarValueBadge }) {
  const N = barTypes.length;
  const rawIdx = barTypes.findIndex(b => b.id === selectedBarId);
  const currentIndex = Math.max(0, Math.min(N - 1, rawIdx === -1 ? 0 : rawIdx));

  const touchStartXRef = useRef(0);
  const touchDeltaXRef = useRef(0);
  const lastWheelTimeRef = useRef(0);

  const offsets = [
    { offset: -2, posClass: 'pos-left-2' },
    { offset: -1, posClass: 'pos-left-1' },
    { offset: 0, posClass: 'pos-center' },
    { offset: 1, posClass: 'pos-right-1' },
    { offset: 2, posClass: 'pos-right-2' }
  ];

  const handlePointerDown = (e) => {
    touchStartXRef.current = e.clientX;
    touchDeltaXRef.current = 0;
  };

  const handlePointerMove = (e) => {
    if (touchStartXRef.current === 0) return;
    touchDeltaXRef.current = e.clientX - touchStartXRef.current;
  };

  const handlePointerUp = () => {
    if (touchStartXRef.current === 0) return;
    const delta = touchDeltaXRef.current;
    touchStartXRef.current = 0;
    touchDeltaXRef.current = 0;
    if (delta > 30) {
      // Swiped right -> go to previous (clamped, no loop)
      if (currentIndex > 0) {
        onSelectBar(barTypes[currentIndex - 1].id);
      }
    } else if (delta < -30) {
      // Swiped left -> go to next (clamped, no loop)
      if (currentIndex < N - 1) {
        onSelectBar(barTypes[currentIndex + 1].id);
      }
    }
  };

  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 250) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 15) {
      lastWheelTimeRef.current = now;
      if (delta > 0 && currentIndex < N - 1) {
        onSelectBar(barTypes[currentIndex + 1].id);
      } else if (delta < 0 && currentIndex > 0) {
        onSelectBar(barTypes[currentIndex - 1].id);
      }
    }
  };

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < N - 1;

  return (
    <div
      className="palate-carousel-picker"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      role="region"
      aria-label="Bar attribute picker"
    >
      {/* Left Chevron Button */}
      <button
        type="button"
        className={`carousel-nav-arrow left ${!hasPrev ? 'disabled' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (hasPrev) onSelectBar(barTypes[currentIndex - 1].id);
        }}
        disabled={!hasPrev}
        title={hasPrev ? `Previous: ${barTypes[currentIndex - 1].label}` : undefined}
        aria-label="Previous attribute"
      >
        ‹
      </button>

      {/* 5 Positions: Left-2, Left-1, Center, Right-1, Right-2 (Linear, No Loop) */}
      {offsets.map(({ offset, posClass }) => {
        const barIndex = currentIndex + offset;
        // Linear: do not loop if before start or after end
        if (barIndex < 0 || barIndex >= N) return null;

        const bar = barTypes[barIndex];
        const Icon = bar.icon;
        const isCenter = offset === 0;
        const currentVal = getBarValueBadge(bar.id);

        return (
          <div
            key={bar.id}
            className={`carousel-bar-item ${posClass} ${isCenter ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBar(bar.id);
            }}
            title={isCenter ? `${bar.label}: ${currentVal}` : `Switch to ${bar.label}`}
          >
            {/* Top Row: Icon + Bar Label */}
            <div className="carousel-bar-header">
              <Icon size={isCenter ? 13 : 11} color={isCenter ? '#ffffff' : bar.color} />
              <span className="carousel-bar-label">{bar.label}</span>
            </div>
            {/* Bottom Row: Chosen Value Badge Below Name (More square layout) */}
            <div className="carousel-bar-val">{currentVal}</div>
          </div>
        );
      })}

      {/* Right Chevron Button */}
      <button
        type="button"
        className={`carousel-nav-arrow right ${!hasNext ? 'disabled' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (hasNext) onSelectBar(barTypes[currentIndex + 1].id);
        }}
        disabled={!hasNext}
        title={hasNext ? `Next: ${barTypes[currentIndex + 1].label}` : undefined}
        aria-label="Next attribute"
      >
        ›
      </button>
    </div>
  );
}

export default function PalateStep({ palateData = {}, updatePalateData, isEmbedded = false }) {
  const [selectedBarId, setSelectedBarId] = useState('tannin');
  const [finishSeconds, setFinishSeconds] = useState(() => parseInitialSeconds(palateData));
  const [isPressingTimer, setIsPressingTimer] = useState(false);
  const [liveElapsed, setLiveElapsed] = useState(0);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const sliderPercent = ((finishSeconds || 0) / 60) * 100;

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
    if (e && e.cancelable) e.preventDefault();
    if (isPressingTimer) return;

    setIsPressingTimer(true);
    startTimeRef.current = performance.now();
    setLiveElapsed(0);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(25); } catch (err) {}
    }

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

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([30, 50, 30]); } catch (err) {}
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const getBarValueBadge = (barId) => {
    switch (barId) {
      case 'tannin': {
        const v = palateData?.tannin || 'Medium (Velvety)';
        if (v.includes('+')) return 'Med(+)';
        if (v.includes('-')) return 'Med(-)';
        if (v.startsWith('Low')) return 'Low';
        if (v.startsWith('High')) return 'High';
        return 'Medium';
      }
      case 'tanninTexture':
        return palateData?.tanninTexture || 'Velvety';
      case 'acidity': {
        const v = palateData?.acidity || 'Medium';
        if (v.includes('+')) return 'Med(+)';
        if (v.includes('-')) return 'Med(-)';
        return v;
      }
      case 'body': {
        const v = palateData?.body || 'Medium';
        if (v.includes('+')) return 'Med(+)';
        if (v.includes('-')) return 'Med(-)';
        if (v.includes('Full')) return 'Full';
        return v;
      }
      case 'flavorIntensity': {
        const v = palateData?.flavorIntensity || 'Pronounced';
        if (v.includes('+')) return 'Med(+)';
        if (v.includes('-')) return 'Med(-)';
        return v;
      }
      case 'finish': {
        const sec = typeof finishSeconds === 'number' ? finishSeconds : 22;
        const tier = getFinishTierInfo(sec);
        return `${tier.tier} (${sec}s)`;
      }
      case 'sweetness':
        return palateData?.sweetness || 'Dry';
      case 'alcoholLevel': {
        const v = palateData?.alcoholLevel || 'Medium (11-13.9%)';
        if (v.includes('<11%')) return 'Low';
        if (v.includes('≥14%') || v.includes('High')) return 'High';
        if (v.includes('+')) return 'Med(+)';
        if (v.includes('-')) return 'Med(-)';
        return 'Medium';
      }
      default:
        return '';
    }
  };

  const isOptionSelected = (barId, opt) => {
    switch (barId) {
      case 'tannin': {
        const cur = palateData?.tannin || 'Medium (Velvety)';
        return cur === opt.value || cur.startsWith(opt.label) || (opt.label === 'Med(+)' && cur.includes('+')) || (opt.label === 'Med(-)' && cur.includes('-'));
      }
      case 'tanninTexture':
        return (palateData?.tanninTexture || 'Velvety') === opt.value;
      case 'acidity': {
        const cur = palateData?.acidity || 'Medium';
        return cur === opt.value || cur.startsWith(opt.label) || (opt.label === 'Med(+)' && cur.includes('+')) || (opt.label === 'Med(-)' && cur.includes('-'));
      }
      case 'body': {
        const cur = palateData?.body || 'Medium';
        return cur === opt.value || cur.startsWith(opt.label) || (opt.label === 'Med(+)' && cur.includes('+')) || (opt.label === 'Med(-)' && cur.includes('-')) || (opt.label === 'Full' && cur.includes('Full'));
      }
      case 'flavorIntensity': {
        const cur = palateData?.flavorIntensity || 'Pronounced';
        return cur === opt.value || cur.startsWith(opt.label) || (opt.label === 'Med(+)' && cur.includes('+')) || (opt.label === 'Med(-)' && cur.includes('-'));
      }
      case 'finish': {
        const sec = typeof finishSeconds === 'number' ? finishSeconds : 22;
        if (opt.seconds !== undefined) {
          return Math.abs(sec - opt.seconds) < 7;
        }
        return false;
      }
      case 'sweetness':
        return (palateData?.sweetness || 'Dry') === opt.value;
      case 'alcoholLevel': {
        const cur = palateData?.alcoholLevel || 'Medium (11-13.9%)';
        return cur === opt.value || cur.startsWith(opt.label) || (opt.label === 'Med(+)' && cur.includes('+')) || (opt.label === 'Med(-)' && cur.includes('-')) || (opt.label === 'High' && cur.includes('≥14%'));
      }
      default:
        return false;
    }
  };

  const handleSelectOption = (barId, opt) => {
    if (barId === 'finish') {
      handleFinishChange(opt.seconds ?? 22);
    } else if (barId === 'tannin') {
      handleChange('tannin', opt.value);
    } else if (barId === 'tanninTexture') {
      handleChange('tanninTexture', opt.value);
    } else if (barId === 'acidity') {
      handleChange('acidity', opt.value);
    } else if (barId === 'body') {
      handleChange('body', opt.value);
    } else if (barId === 'flavorIntensity') {
      handleChange('flavorIntensity', opt.value);
    } else if (barId === 'sweetness') {
      handleChange('sweetness', opt.value);
    } else if (barId === 'alcoholLevel') {
      handleChange('alcoholLevel', opt.value);
    }
  };

  const activeBarObj = BAR_TYPES.find(b => b.id === selectedBarId) || BAR_TYPES[0];

  const palateContent = (
    <div className={`palate-compact-container ${isEmbedded ? 'embedded' : ''}`}>
      {/* LINE 1: REDESIGNED 5-POSITION CAROUSEL BAR PICKER */}
      <BarCarouselPicker
        barTypes={BAR_TYPES}
        selectedBarId={selectedBarId}
        onSelectBar={setSelectedBarId}
        getBarValueBadge={getBarValueBadge}
      />

        {/* LINE 2: DYNAMIC SOMMELIER SLIDER BAR FOR THE PICKED ATTRIBUTE */}
        <div className="palate-slider-line2">
          {selectedBarId === 'tannin' && (
            <SommelierTrackSlider
              value={palateData.tannin || 'Medium (Velvety)'}
              onChange={(val) => handleChange('tannin', val)}
              options={TANNIN_SLIDER_OPTIONS}
              anchorLabels={['Low', 'Medium', 'High']}
              ariaLabel="Tannin Level"
            />
          )}

          {selectedBarId === 'tanninTexture' && (
            <SommelierTextureSlider
              value={palateData.tanninTexture || 'Velvety'}
              onChange={(val) => handleChange('tanninTexture', val)}
              options={TANNIN_TEXTURES}
              ariaLabel="Tannin Texture"
            />
          )}

          {selectedBarId === 'acidity' && (
            <SommelierTrackSlider
              value={palateData.acidity || 'Medium'}
              onChange={(val) => handleChange('acidity', val)}
              options={ACIDITY_SLIDER_OPTIONS}
              anchorLabels={['Low', 'Medium', 'High']}
              ariaLabel="Acidity Level"
            />
          )}

          {selectedBarId === 'body' && (
            <SommelierTrackSlider
              value={palateData.body || 'Medium'}
              onChange={(val) => handleChange('body', val)}
              options={BODY_SLIDER_OPTIONS}
              anchorLabels={['Light', 'Medium', 'Full']}
              ariaLabel="Body Weight"
            />
          )}

          {selectedBarId === 'flavorIntensity' && (
            <SommelierTrackSlider
              value={palateData.flavorIntensity || 'Pronounced'}
              onChange={(val) => handleChange('flavorIntensity', val)}
              options={FLAVOR_SLIDER_OPTIONS}
              anchorLabels={['Light', 'Medium', 'Pronounced']}
              ariaLabel="Flavor Intensity"
            />
          )}

          {selectedBarId === 'alcoholLevel' && (
            <SommelierTrackSlider
              value={palateData.alcoholLevel || 'Medium (11-13.9%)'}
              onChange={(val) => handleChange('alcoholLevel', val)}
              options={ALCOHOL_SLIDER_OPTIONS}
              anchorLabels={['Low', 'Medium', 'High']}
              anchorSubLabels={['< 11%', '11 - 13.9%', '≥ 14%']}
              ariaLabel="Alcohol Warmth"
            />
          )}

          {selectedBarId === 'sweetness' && (
            <Sommelier5SectorSlider
              value={palateData.sweetness || 'Dry'}
              onChange={(val) => handleChange('sweetness', val)}
              options={SWEETNESS_SLIDER_OPTIONS}
              ariaLabel="Sweetness Level"
            />
          )}

          {selectedBarId === 'finish' && (() => {
            const tierInfo = getFinishTierInfo(finishSeconds);
            return (
              <div className="aftertaste-bar-container">
                <div className="aftertaste-slider-group">
                  {isPressingTimer && (
                    <div className="aftertaste-floating-timer">
                      <Timer size={13} className="spin-animate" color="#ffffff" />
                      <span>{liveElapsed.toFixed(1)}s</span>
                    </div>
                  )}
                  <div className="aftertaste-track-wrap">
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="1"
                      className="aftertaste-range-input"
                      value={finishSeconds}
                      onChange={(e) => handleFinishChange(e.target.value)}
                      style={{
                        background: `linear-gradient(to right, #b81d40 0%, #d4af37 ${sliderPercent}%, rgba(255,255,255,0.08) ${sliderPercent}%, rgba(255,255,255,0.08) 100%)`
                      }}
                      aria-label="Aftertaste duration in seconds"
                    />
                  </div>
                  <div className="aftertaste-labels-row">
                    <span className="aftertaste-tick-label" onClick={() => handleFinishChange(0)}>0s</span>
                    <span className="aftertaste-level-center" style={{ color: tierInfo.color }}>
                      {tierInfo.tier}
                    </span>
                    <span className="aftertaste-tick-label" onClick={() => handleFinishChange(60)}>60s</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`aftertaste-hold-btn ${isPressingTimer ? 'pressing' : ''}`}
                  onPointerDown={startTiming}
                  onPointerUp={stopTiming}
                  onPointerLeave={stopTiming}
                  onPointerCancel={stopTiming}
                  title="Hold while tasting to measure aftertaste"
                  aria-label="Hold to time aftertaste"
                >
                  <Timer size={14} color={isPressingTimer ? '#ffffff' : 'var(--gold-primary)'} />
                  <span>Hold</span>
                </button>
              </div>
            );
          })()}
        </div>
      </div>
  );

  if (isEmbedded) {
    return (
      <div className="palate-embedded-section">
        <div className="palate-embedded-header">
          <h4 className="palate-embedded-title font-serif">
            <Activity size={18} color="#d4af37" />
            <EditableText textKey="palate.title" defaultText="Palate & Structural" />
          </h4>
        </div>
        {palateContent}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title font-serif">
          <Activity size={22} color="#d4af37" />
          <EditableText textKey="palate.title" defaultText="Palate & Structural" />
        </h3>
      </div>
      {palateContent}
    </div>
  );
}

