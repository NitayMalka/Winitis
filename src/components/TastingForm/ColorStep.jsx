import React, { useState, useRef, useEffect } from 'react';
import { Sun, Eye, Info, Maximize2, Sparkles, Sliders } from 'lucide-react';
import EditableText from '../TextEditor/EditableText';
import { useTexts } from '../../context/TextContext';

// Linear Red Wine Spectrum (0% Violet -> 25% Ruby -> 50% Garnet -> 75% Tawny -> 100% Brick)
const SPECTRUM_CLASSES = [
  { id: 'violet', name: 'Violet / Magenta', pos: 0, desc: 'Vibrant purple/magenta rim. Youthful high-anthocyanin reds (Malbec, Syrah, Gamay).' },
  { id: 'ruby', name: 'Deep Ruby', pos: 0.25, desc: 'Classic rich crimson red. Youthful to mid-age Cabernet, Merlot, and Sangiovese.' },
  { id: 'garnet', name: 'Garnet', pos: 0.50, desc: 'Reddish-orange transition. Maturing reds or lighter skins (Pinot Noir, Nebbiolo).' },
  { id: 'tawny', name: 'Tawny', pos: 0.75, desc: 'Warm reddish-brown with amber rim. Significant bottle age (10-20 yrs).' },
  { id: 'brick', name: 'Brick / Mahogany', pos: 1.0, desc: 'Earthy brick-brown tone throughout. Tertiary peak or mature wines (20+ yrs).' }
];

// Smooth linear HSL interpolation along the Red Wine Spectrum
function getRedSpectrumHSL(progress, saturation, lightness) {
  let h;
  if (progress <= 0.25) {
    const t = progress / 0.25;
    h = 305 + t * 40; // 305 to 345
  } else if (progress <= 0.50) {
    const t = (progress - 0.25) / 0.25;
    h = 345 + t * 14; // 345 to 359
  } else if (progress <= 0.75) {
    const t = (progress - 0.50) / 0.25;
    h = (359 + t * 19) % 360; // 359 to 18°
  } else {
    const t = (progress - 0.75) / 0.25;
    h = 18 + t * 14; // 18 to 32°
  }

  return { h: Math.round(h), s: saturation, l: lightness };
}

// Utility: HSL to Hex
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default function ColorStep({ colorData, updateColorData }) {
  // Store exact normalized positions: normX = Tone Darkness (0.0 Left Light -> 1.0 Right Dark), normY = Red Spectrum (0.0 Top Violet -> 1.0 Bottom Brick)
  const [normX, setNormX] = useState(0.64); // Default ~24% lightness
  const [normY, setNormY] = useState(0.25); // Default Ruby
  const [saturation, setSaturation] = useState(82);
  const [intensity, setIntensity] = useState(colorData.intensity || 'Deep');
  const [rimVariation, setRimVariation] = useState(colorData.rimVariation || 'Standard Ruby Edge');
  const [isFullscreenWhite, setIsFullscreenWhite] = useState(false);

  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Derived continuous values
  const spectrumProgress = normY;
  const lightness = Math.round(42 - normX * (42 - 14));

  const { h: hue, s: sat, l: light } = getRedSpectrumHSL(spectrumProgress, saturation, lightness);
  const currentColorHex = hslToHex(hue, sat, light);

  // Active Class Detection
  let currentClassObj = SPECTRUM_CLASSES[1];
  if (spectrumProgress < 0.125) currentClassObj = SPECTRUM_CLASSES[0];
  else if (spectrumProgress < 0.375) currentClassObj = SPECTRUM_CLASSES[1];
  else if (spectrumProgress < 0.625) currentClassObj = SPECTRUM_CLASSES[2];
  else if (spectrumProgress < 0.875) currentClassObj = SPECTRUM_CLASSES[3];
  else currentClassObj = SPECTRUM_CLASSES[4];

  // Sync state up to parent
  useEffect(() => {
    updateColorData({
      id: currentClassObj.id,
      name: `${currentClassObj.name} (Matched)`,
      hex: currentColorHex,
      hue,
      saturation,
      lightness,
      intensity,
      rimVariation,
      description: currentClassObj.desc
    });
  }, [spectrumProgress, saturation, lightness, intensity, rimVariation, currentColorHex]);

  // Render Flipped 2D Red Wine Spectrum Rectangle Canvas (X = Tone Darkness, Y = Red Spectrum Color)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Render 2D Gradient Matrix: Rows = Red Spectrum Color (Y), Columns = Tone Darkness (X)
    const sliceHeight = Math.ceil(height / 80);
    for (let j = 0; j <= 80; j++) {
      const prog = j / 80; // Y-axis spectrum progress (0.0 Violet at top -> 1.0 Brick at bottom)
      const y = prog * height;

      // Horizontal line gradient from Light (left) to Dark (right)
      const grad = ctx.createLinearGradient(0, y, width, y);
      const leftColor = hslToHex(getRedSpectrumHSL(prog, 85, 42).h, 85, 42);
      const rightColor = hslToHex(getRedSpectrumHSL(prog, 85, 14).h, 85, 14);

      grad.addColorStop(0, leftColor);
      grad.addColorStop(1, rightColor);

      ctx.fillStyle = grad;
      ctx.fillRect(0, y, width, sliceHeight + 1);
    }

    // Class divider horizontal lines & text markers along Y-axis
    SPECTRUM_CLASSES.forEach((cls) => {
      const markY = cls.pos * height;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, markY);
      ctx.lineTo(width, markY);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 2D Handle Position: Exact pixel alignment derived from normX and normY
    const handleX = normX * width;
    const handleY = normY * height;

    // Outer glow handle ring
    ctx.beginPath();
    ctx.arc(handleX, handleY, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();

    // Inner white-bordered handle circle
    ctx.beginPath();
    ctx.arc(handleX, handleY, 13, 0, Math.PI * 2);
    ctx.fillStyle = currentColorHex;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.stroke();
  }, [normX, normY, currentColorHex]);

  // Update 2D Position - Guaranteed 100% Mouse Alignment
  const update2DPosition = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;

    const nx = Math.min(1.0, Math.max(0.0, rawX / rect.width));
    const ny = Math.min(1.0, Math.max(0.0, rawY / rect.height));

    setNormX(nx);
    setNormY(ny);
  };

  // Global Pointer Event Listeners for 2D Dragging
  useEffect(() => {
    const handleGlobalPointerMove = (e) => {
      if (!isDraggingRef.current) return;
      const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
      if (clientX !== undefined && clientY !== undefined) {
        update2DPosition(clientX, clientY);
      }
    };

    const handleGlobalPointerUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('mousemove', handleGlobalPointerMove);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('touchmove', handleGlobalPointerMove);
    window.addEventListener('touchend', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('mousemove', handleGlobalPointerMove);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchmove', handleGlobalPointerMove);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, []);

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    update2DPosition(clientX, clientY);
  };

  return (
    <div>
      {/* Fullscreen White Paper Modal */}
      {isFullscreenWhite && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#ffffff',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            color: '#1e293b'
          }}
          onClick={() => setIsFullscreenWhite(false)}
        >
          <div style={{ position: 'absolute', top: 20, right: 20, background: '#0f0910', color: '#f7e4a1', padding: '10px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600 }}>
            ✕ Exit White Canvas (Click Anywhere)
          </div>
          <div className="glass-target-guide" style={{ width: '300px', height: '400px', borderColor: '#94a3b8' }}>
            <span style={{ fontSize: '3.5rem' }}>🍷</span>
            <div className="glass-target-text" style={{ fontSize: '1.1rem', marginTop: '16px' }}>
              Hold your physical wine glass over this pure white background at a 45° angle.
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED IPHONE-STYLE SPLIT SCREEN INTERFACE */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid var(--border-gold)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          minHeight: '700px',
          background: 'var(--bg-dark)'
        }}
      >

        {/* TOP HALF: WHITE AREA (Glass Placement Canvas - Pure White surface) */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            minHeight: '320px',
            position: 'relative',
            borderBottom: '3px solid #cbd5e1'
          }}
        />

        {/* BOTTOM HALF: MATCHED WINE COLOR FILL + FLIPPED 2D RECTANGLE BOX (X=Tone, Y=Color) */}
        <div 
          style={{
            backgroundColor: currentColorHex,
            transition: 'background-color 0.12s ease',
            padding: '24px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            color: '#ffffff'
          }}
        >

          {/* Color Info Badge (Right aligned) */}
          <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
            <div 
              style={{
                background: 'rgba(15, 9, 16, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-gold)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--gold-light)'
              }}
            >
              {currentClassObj.name} | Tone: {lightness}% | {currentColorHex.toUpperCase()}
            </div>
          </div>

          {/* 2D RED WINE SPECTRUM CANVAS (Panned to the left, outer container, buttons, and helper texts removed) */}
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '460px', 
              alignSelf: 'flex-start',
              margin: '16px 0', 
              touchAction: 'none' 
            }}
          >
            <canvas 
              ref={canvasRef}
              width={460}
              height={200}
              style={{
                width: '100%',
                height: '200px',
                display: 'block',
                borderRadius: '14px',
                cursor: 'crosshair',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.45)'
              }}
              onPointerDown={handlePointerDown}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
            />
          </div>

          {/* LOWER CONTROLS PANEL: CORE EXTRACTION & RIM EDGE TRANSITION */}
          <div 
            style={{
              width: '100%',
              background: 'rgba(15, 9, 16, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
            }}
          >
            <div className="form-grid" style={{ gap: '14px', alignItems: 'center' }}>
              
              {/* Core Extraction Depth Buttons */}
              <div className="slider-group">
                <div className="slider-label" style={{ fontSize: '0.75rem' }}>
                  <span><EditableText textKey="color.coreDepthLabel" defaultText="Core Extraction Depth" /></span>
                  <span className="slider-value">{intensity}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { val: 'Pale', key: 'color.depthPale' },
                    { val: 'Medium', key: 'color.depthMedium' },
                    { val: 'Deep', key: 'color.depthDeep' }
                  ].map(({ val, key }) => (
                    <button
                      key={val}
                      type="button"
                      className={`btn ${intensity === val ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1, padding: '6px', fontSize: '0.75rem', fontWeight: 600 }}
                      onClick={() => setIntensity(val)}
                    >
                      <EditableText textKey={key} defaultText={val} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Rim Edge Transition Selector */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                  <EditableText textKey="color.rimTransitionLabel" defaultText="Rim Edge Transition" />
                </label>
                <select 
                  className="form-select"
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                  value={rimVariation}
                  onChange={(e) => setRimVariation(e.target.value)}
                >
                  <option value="Standard Ruby Edge">Standard Ruby Edge (Youthful)</option>
                  <option value="Subtle Magenta / Pink Edge">Subtle Magenta / Pink Edge (High Acid)</option>
                  <option value="Pale Garnet Rim">Pale Garnet Edge (Maturing)</option>
                  <option value="Amber / Orange Rim">Amber / Orange Rim (Aged 10-20 yrs)</option>
                  <option value="Watery Edge (Light Extraction)">Watery Edge (Light Extraction)</option>
                </select>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
