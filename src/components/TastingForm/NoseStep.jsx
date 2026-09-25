import React, { useState, useRef, useEffect } from 'react';
import { RED_WINE_AROMAS } from '../../data/wineData';
import { Wind, Sparkles, Check, Info, Trash2, Sliders } from 'lucide-react';
import EditableText from '../TextEditor/EditableText';
import { useTexts } from '../../context/TextContext';
import PalateStep from './PalateStep';

const INTENSITY_LEVELS = ['Light', 'Medium(-)', 'Medium', 'Medium(+)', 'Pronounced'];
const DEVELOPMENT_LEVELS = ['Youthful', 'Developing', 'Fully Developed', 'Tired'];

// Flat category mapping for Ring 2
const CATEGORY_MAP = [
  // Primary (0° to 120° -> -90° to 30°)
  { id: 'red_fruit', tier: 'primary', name: 'Red Fruit', startAngle: -90, endAngle: -60, color: '#b81d40', items: ['Red Cherry', 'Raspberry', 'Strawberry', 'Cranberry', 'Red Plum', 'Pomegranate'] },
  { id: 'black_fruit', tier: 'primary', name: 'Black Fruit', startAngle: -60, endAngle: -30, color: '#5c133a', items: ['Blackberry', 'Blackcurrant', 'Black Cherry', 'Black Plum', 'Blueberry'] },
  { id: 'floral', tier: 'primary', name: 'Floral & Herb', startAngle: -30, endAngle: 0, color: '#8e235b', items: ['Violet', 'Rose Petal', 'Eucalyptus/Mint', 'Green Pepper', 'Dried Herbs', 'Lavender'] },
  { id: 'spice', tier: 'primary', name: 'Spice & Pepper', startAngle: 0, endAngle: 30, color: '#a02334', items: ['Black Pepper', 'White Pepper', 'Liquorice/Anise', 'Clove', 'Cinnamon'] },

  // Secondary (120° to 240° -> 30° to 150°)
  { id: 'oak', tier: 'secondary', name: 'Oak Influences', startAngle: 30, endAngle: 90, color: '#b8860b', items: ['Vanilla', 'Cedar', 'Toast', 'Smoke', 'Coconut', 'Dill', 'Sweet Tobacco'] },
  { id: 'winemaking', tier: 'secondary', name: 'Winemaking', startAngle: 90, endAngle: 150, color: '#aa820a', items: ['Butter/Cream', 'Yeast/Biscuit', 'Chocolate', 'Coffee/Espresso', 'Cocoa'] },

  // Tertiary (240° to 360° -> 150° to 270°)
  { id: 'aging', tier: 'tertiary', name: 'Aging & Maturation', startAngle: 150, endAngle: 210, color: '#692a18', items: ['Leather', 'Forest Floor', 'Mushroom', 'Game/Meat', 'Truffle', 'Cigar Box'] },
  { id: 'earth', tier: 'tertiary', name: 'Dried Fruit & Earth', startAngle: 210, endAngle: 270, color: '#522215', items: ['Prune', 'Raisin', 'Dried Fig', 'Wet Leaves', 'Graphite/Lead Pencil', 'Tar'] }
];

// Strips any parenthetical text e.g. "Butter/Cream (MLF)" -> "Butter/Cream"
const cleanAromaText = (text) => (text ? text.replace(/\s*\([^)]*\)/g, '').trim() : '');

// Generates an SVG stroke arc for textPath along a circular ring.
// When isFlipped is true (bottom half slices), the path runs counter-clockwise (smile curve)
// so the text reads left-to-right and remains upright and fully legible!
function describeTextArc(cx, cy, r, startAngle, endAngle, isFlipped) {
  const pad = 1.0;
  const sA = isFlipped ? endAngle - pad : startAngle + pad;
  const eA = isFlipped ? startAngle + pad : endAngle - pad;
  const sweepFlag = isFlipped ? 0 : 1;
  const start = polarToCartesian(cx, cy, r, sA);
  const end = polarToCartesian(cx, cy, r, eA);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, sweepFlag, end.x, end.y].join(' ');
}

// Dynamically calculates the optimal font size so text is bold and readable
// along the wheel flow, while strictly never exiting slice borders.
function getAromaFontSize(text, sliceAngle) {
  // Center radius of Ring 3 is 181.5
  const arcLength = 181.5 * (sliceAngle * Math.PI / 180);
  // Available length reserving comfortable margins on both sides
  const maxUsableWidth = arcLength - 22;
  // Bold SVG sans-serif character width estimate is ~0.55 * fontSize
  const charWidthRatio = 0.55;
  const targetSize = maxUsableWidth / (Math.max(text.length, 3) * charWidthRatio);
  // Allow prominent font size up to 13.5px, but scaled down if text is extra long
  return Math.max(10.5, Math.min(13.5, Math.round(targetSize * 10) / 10));
}

// Helper: polar to cartesian
function polarToCartesian(cx, cy, r, angleInDegrees) {
  const rad = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

// Helper: SVG Arc Path Generator
function describeArc(cx, cy, rInner, rOuter, startAngle, endAngle) {
  const pad = 0.5;
  const sA = startAngle + pad;
  const eA = endAngle - pad;

  const startOuter = polarToCartesian(cx, cy, rOuter, sA);
  const endOuter = polarToCartesian(cx, cy, rOuter, eA);
  const startInner = polarToCartesian(cx, cy, rInner, sA);
  const endInner = polarToCartesian(cx, cy, rInner, eA);

  const largeArcFlag = eA - sA <= 180 ? '0' : '1';

  return [
    'M', startOuter.x, startOuter.y,
    'A', rOuter, rOuter, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', rInner, rInner, 0, largeArcFlag, 0, startInner.x, startInner.y,
    'Z'
  ].join(' ');
}

// Helper: SVG Stroke Arc Generator (for transparent ring paths & textPaths)
function describeStrokeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 1, end.x, end.y].join(' ');
}

// Map level string to continuous percentage (0-100)
function levelToPercent(level, list) {
  const idx = Math.max(0, list.indexOf(level));
  return (idx / (list.length - 1)) * 100;
}

// Map continuous percentage (0-100) to level string
function percentToLevel(pct, list) {
  const step = 100 / list.length;
  const idx = Math.min(list.length - 1, Math.floor(pct / step));
  return list[idx];
}

export default function NoseStep({ noseData, updateNoseData, palateData, updatePalateData }) {
  const selectedAromas = noseData.aromas || [];
  const [activeTier, setActiveTier] = useState('primary');
  const [activeCategory, setActiveCategory] = useState(CATEGORY_MAP[0]); // Default Red Fruit

  // Continuous 0-100 float progress
  const [intensityVal, setIntensityVal] = useState(levelToPercent(noseData.intensity || 'Medium', INTENSITY_LEVELS));
  const [developmentVal, setDevelopmentVal] = useState(levelToPercent(noseData.development || 'Youthful', DEVELOPMENT_LEVELS));

  const currentIntensity = percentToLevel(intensityVal, INTENSITY_LEVELS);
  const currentDevelopment = percentToLevel(developmentVal, DEVELOPMENT_LEVELS);

  const svgRef = useRef(null);
  const activeSliderDragRef = useRef(null); // 'intensity' | 'development' | null

  const isAromaSelected = (aroma) => {
    const clean = cleanAromaText(aroma);
    return selectedAromas.some(a => cleanAromaText(a) === clean);
  };

  const toggleAroma = (aroma) => {
    const clean = cleanAromaText(aroma);
    let updated;
    if (selectedAromas.some(a => cleanAromaText(a) === clean)) {
      updated = selectedAromas.filter(a => cleanAromaText(a) !== clean);
    } else {
      updated = [...selectedAromas.filter(a => cleanAromaText(a) !== clean), clean];
    }
    updateNoseData({ ...noseData, aromas: updated });
  };

  const handleIntensityChange = (newVal) => {
    setIntensityVal(newVal);
    const mapped = percentToLevel(newVal, INTENSITY_LEVELS);
    if (mapped !== noseData.intensity) {
      updateNoseData({ ...noseData, intensity: mapped });
    }
  };

  const handleDevelopmentChange = (newVal) => {
    setDevelopmentVal(newVal);
    const mapped = percentToLevel(newVal, DEVELOPMENT_LEVELS);
    if (mapped !== noseData.development) {
      updateNoseData({ ...noseData, development: mapped });
    }
  };

  const handleSelectTier = (tier) => {
    setActiveTier(tier);
    const firstCat = CATEGORY_MAP.find(c => c.tier === tier);
    if (firstCat) setActiveCategory(firstCat);
  };

  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    setActiveTier(cat.tier);
  };

  const cx = 250;
  const cy = 250;
  const rControlRing = 238; // Radius of transparent separated control ring

  // Separated Arc Bounds (30° gap spacing at sides)
  // Top Arc (Intensity): -165° (Weak) to -15° (Strong)
  const intensityAngle = -165 + (intensityVal / 100) * 150;
  const intensityArrowPos = polarToCartesian(cx, cy, rControlRing, intensityAngle);
  const intensityArrowRot = intensityAngle + 90; // Pointing forward clockwise towards Strong!

  // Bottom Arc (Development): +15° (Youthful) to +165° (Tired)
  const devAngle = 15 + (developmentVal / 100) * 150;
  const devArrowPos = polarToCartesian(cx, cy, rControlRing, devAngle);
  const devArrowRot = devAngle + 90; // Pointing forward clockwise towards Aged!

  // Dragging logic for separated control ring
  const updateRingSliderPos = (clientX, clientY, targetMode) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Convert DOM coords to SVG coords
    const svgX = (mouseX / rect.width) * 500;
    const svgY = (mouseY / rect.height) * 500;

    let deg = Math.atan2(svgY - cy, svgX - cx) * (180 / Math.PI);

    if (targetMode === 'intensity' || (targetMode === null && deg <= 0)) {
      // Top Half Arc (-165° to -15°) -> Intensity
      let normDeg = Math.min(-15, Math.max(-165, deg));
      let pct = ((normDeg - (-165)) / 150) * 100;
      handleIntensityChange(Math.min(100, Math.max(0, pct)));
    } else if (targetMode === 'development' || (targetMode === null && deg > 0)) {
      // Bottom Half Arc (+15° to +165°) -> Development
      let normDeg = Math.min(165, Math.max(15, deg));
      let pct = ((normDeg - 15) / 150) * 100;
      handleDevelopmentChange(Math.min(100, Math.max(0, pct)));
    }
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e) => {
      if (!activeSliderDragRef.current) return;
      const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
      if (clientX !== undefined && clientY !== undefined) {
        updateRingSliderPos(clientX, clientY, activeSliderDragRef.current);
      }
    };

    const handleGlobalPointerUp = () => {
      activeSliderDragRef.current = null;
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

  // Active items for Ring 3 dynamically populated from activeCategory!
  const ring3Items = activeCategory.items;
  const numRing3Slices = ring3Items.length;
  const sliceAngle3 = 360 / numRing3Slices;

  return (
    <div className="card nose-step-card">
      <div className="card-header">
        <h3 className="card-title font-serif">
          <Wind size={22} color="#d4af37" />
          <EditableText textKey="nose.title" defaultText="Nose & Aromatic Profile" />
        </h3>
      </div>

      {/* WORKSPACE LAYOUT: CENTERED AROMA WHEEL WITH SELECTED AROMAS BENEATH */}
      <div className="nose-workspace-container">
        {/* INTERACTIVE AROMA WHEEL WITH CURVED TEXT ARCS */}
        <div className="nose-wheel-wrap" style={{ width: '100%', touchAction: 'none', position: 'relative' }}>
            <svg 
              ref={svgRef}
              viewBox="0 0 500 500" 
              style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.8))' }}
            >
              {/* DEFINITIONS FOR CURVED SVG TEXT PATHS */}
              <defs>
                {/* Curved Text Path for Top Arc (Intensity) starting right at origin (-165°) */}
                <path id="intensity-text-path" d={describeStrokeArc(cx, cy, rControlRing + 16, -165, -15)} />
                
                {/* Curved Text Path for Bottom Arc (Development) starting right at origin (+15°) */}
                <path id="dev-text-path" d={describeStrokeArc(cx, cy, rControlRing + 16, 15, 165)} />

                {/* Curved Text Paths for Ring 3 Aromas aligned with wheel flow */}
                {ring3Items.map((rawItem, idx) => {
                  const itemStartAngle = -90 + idx * sliceAngle3;
                  const itemEndAngle = -90 + (idx + 1) * sliceAngle3;
                  let midAngle = (itemStartAngle + itemEndAngle) / 2;
                  while (midAngle > 180) midAngle -= 360;
                  while (midAngle <= -180) midAngle += 360;
                  const isFlipped = midAngle > 0 && midAngle < 180;
                  const pathD = describeTextArc(cx, cy, 181.5, itemStartAngle, itemEndAngle, isFlipped);
                  return <path key={`aroma-path-${idx}`} id={`aroma-path-${idx}`} d={pathD} />;
                })}
              </defs>

              {/* RING 3: DYNAMIC OUTER CONCENTRIC RING (Radius 145 -> 218) */}
              {ring3Items.map((rawItem, idx) => {
                const item = cleanAromaText(rawItem);
                const itemStartAngle = -90 + idx * sliceAngle3;
                const itemEndAngle = -90 + (idx + 1) * sliceAngle3;
                const isSelected = isAromaSelected(item);

                const pathD = describeArc(cx, cy, 145, 218, itemStartAngle, itemEndAngle);
                const displayText = `${item}${isSelected ? ' ✓' : ''}`;
                const fontSize = getAromaFontSize(displayText, sliceAngle3);

                return (
                  <g key={item} style={{ cursor: 'pointer' }} onClick={() => toggleAroma(item)}>
                    <path 
                      d={pathD} 
                      fill={isSelected ? '#d4af37' : activeCategory.color} 
                      opacity={isSelected ? 1.0 : 0.85}
                      stroke={isSelected ? '#ffffff' : '#0f0910'} 
                      strokeWidth={isSelected ? 3.5 : 1.5}
                      style={{ transition: 'all 0.2s ease' }}
                    />
                    <text 
                      fill={isSelected ? '#0f0910' : '#ffffff'} 
                      fontSize={fontSize} 
                      fontWeight={isSelected ? 'bold' : '700'}
                      textAnchor="middle" 
                      dominantBaseline="central"
                      letterSpacing="0.02em"
                      style={{ 
                        pointerEvents: 'none', 
                        userSelect: 'none', 
                        textShadow: isSelected ? 'none' : '0 1px 3px rgba(0,0,0,0.9)' 
                      }}
                    >
                      <textPath 
                        href={`#aroma-path-${idx}`}
                        xlinkHref={`#aroma-path-${idx}`}
                        startOffset="50%"
                      >
                        {displayText}
                      </textPath>
                    </text>
                  </g>
                );
              })}

              {/* RING 2: MIDDLE CATEGORY WEDGES (Radius 76 -> 141) */}
              {CATEGORY_MAP.map((cat) => {
                const isSelected = activeCategory.id === cat.id;
                const pathD = describeArc(cx, cy, 76, 141, cat.startAngle, cat.endAngle);
                const midAngle = (cat.startAngle + cat.endAngle) / 2;
                const labelPos = polarToCartesian(cx, cy, 108, midAngle);

                let textRotation = midAngle;
                if (midAngle > 90 || midAngle < -90) textRotation += 180;

                return (
                  <g key={cat.id} style={{ cursor: 'pointer' }} onClick={() => handleSelectCategory(cat)}>
                    <path 
                      d={pathD} 
                      fill={cat.color} 
                      opacity={isSelected ? 1.0 : 0.65}
                      stroke={isSelected ? '#f7e4a1' : 'rgba(15, 9, 16, 0.8)'} 
                      strokeWidth={isSelected ? 3.5 : 1.5}
                      style={{ transition: 'all 0.2s ease' }}
                    />
                    <text 
                      x={labelPos.x} 
                      y={labelPos.y} 
                      fill="#ffffff" 
                      fontSize="10" 
                      fontWeight={isSelected ? 'bold' : '600'}
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      transform={`rotate(${textRotation}, ${labelPos.x}, ${labelPos.y})`}
                      style={{ pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.9)', userSelect: 'none' }}
                    >
                      {cat.name.split(' ')[0]} {isSelected ? '▶' : ''}
                    </text>
                  </g>
                );
              })}

              {/* RING 1: CENTER TIER CIRCLE (Radius 0 -> 72) */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleSelectTier('primary')}>
                <path 
                  d={describeArc(cx, cy, 0, 72, -90, 30)} 
                  fill="#800020" 
                  opacity={activeTier === 'primary' ? 1.0 : 0.7}
                  stroke="#0f0910" 
                  strokeWidth="2"
                />
                {(() => {
                  const pos = polarToCartesian(cx, cy, 40, -30);
                  return (
                    <text x={pos.x} y={pos.y} fill="#ffffff" fontSize="10.5" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      Primary
                    </text>
                  );
                })()}
              </g>

              <g style={{ cursor: 'pointer' }} onClick={() => handleSelectTier('secondary')}>
                <path 
                  d={describeArc(cx, cy, 0, 72, 30, 150)} 
                  fill="#d4af37" 
                  opacity={activeTier === 'secondary' ? 1.0 : 0.7}
                  stroke="#0f0910" 
                  strokeWidth="2"
                />
                {(() => {
                  const pos = polarToCartesian(cx, cy, 40, 90);
                  return (
                    <text x={pos.x} y={pos.y} fill="#0f0910" fontSize="9.5" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      Secondary
                    </text>
                  );
                })()}
              </g>

              <g style={{ cursor: 'pointer' }} onClick={() => handleSelectTier('tertiary')}>
                <path 
                  d={describeArc(cx, cy, 0, 72, 150, 270)} 
                  fill="#522215" 
                  opacity={activeTier === 'tertiary' ? 1.0 : 0.7}
                  stroke="#0f0910" 
                  strokeWidth="2"
                />
                {(() => {
                  const pos = polarToCartesian(cx, cy, 40, 210);
                  return (
                    <text x={pos.x} y={pos.y} fill="#ffffff" fontSize="10.5" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      Tertiary
                    </text>
                  );
                })()}
              </g>

              {/* SEPARATED DUAL ARC CONTROL SLIDERS (WITH CURVED TEXT ORIGIN LABELS & ARROW POINTERS) */}
              
              {/* TOP ARC (-165° to -15°): AROMA INTENSITY SLIDER (GOLD/CRIMSON) */}
              <g 
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  activeSliderDragRef.current = 'intensity';
                  updateRingSliderPos(e.clientX, e.clientY, 'intensity');
                }}
              >
                {/* Transparent Background Track Arc */}
                <path 
                  d={describeStrokeArc(cx, cy, rControlRing, -165, -15)} 
                  fill="none" 
                  stroke="rgba(212, 175, 55, 0.22)" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                />
                {/* Active Highlight Arc */}
                <path 
                  d={describeStrokeArc(cx, cy, rControlRing, -165, intensityAngle)} 
                  fill="none" 
                  stroke="#d4af37" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                />

                {/* CURVED "INTENSITY" TEXT LABEL CURVED EXACTLY ALONG SLIDER SHAPE STARTING AT ORIGIN */}
                <text fill="#d4af37" fontSize="10" fontWeight="bold" letterSpacing="0.08em" style={{ pointerEvents: 'none' }}>
                  <textPath href="#intensity-text-path" xlinkHref="#intensity-text-path" startOffset="2%">
                    INTENSITY: {currentIntensity.replace(/[()]/g, '').toUpperCase()}
                  </textPath>
                </text>

                {/* DIRECTIONAL ARROW POINTER KNOB (Pointing towards Strong!) */}
                <g transform={`translate(${intensityArrowPos.x}, ${intensityArrowPos.y}) rotate(${intensityArrowRot})`}>
                  <polygon 
                    points="-8,-12 14,0 -8,12 -3,0" 
                    fill="#d4af37" 
                    stroke="#ffffff" 
                    strokeWidth="2.5" 
                    style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.9))' }}
                  />
                </g>
              </g>

              {/* BOTTOM ARC (+15° to +165°): AROMA DEVELOPMENT SLIDER (AGED AMBER/TAWNY) */}
              <g 
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  activeSliderDragRef.current = 'development';
                  updateRingSliderPos(e.clientX, e.clientY, 'development');
                }}
              >
                {/* Transparent Background Track Arc */}
                <path 
                  d={describeStrokeArc(cx, cy, rControlRing, 15, 165)} 
                  fill="none" 
                  stroke="rgba(230, 126, 34, 0.22)" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                />
                {/* Active Highlight Arc */}
                <path 
                  d={describeStrokeArc(cx, cy, rControlRing, 15, devAngle)} 
                  fill="none" 
                  stroke="#e67e22" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                />

                {/* CURVED "DEVELOPMENT" TEXT LABEL CURVED EXACTLY ALONG SLIDER SHAPE STARTING AT ORIGIN */}
                <text fill="#e67e22" fontSize="10" fontWeight="bold" letterSpacing="0.08em" style={{ pointerEvents: 'none' }}>
                  <textPath href="#dev-text-path" xlinkHref="#dev-text-path" startOffset="2%">
                    DEVELOPMENT: {currentDevelopment.replace(/[()]/g, '').toUpperCase()}
                  </textPath>
                </text>

                {/* DIRECTIONAL ARROW POINTER KNOB (Pointing towards Aged!) */}
                <g transform={`translate(${devArrowPos.x}, ${devArrowPos.y}) rotate(${devArrowRot})`}>
                  <polygon 
                    points="-8,-12 14,0 -8,12 -3,0" 
                    fill="#e67e22" 
                    stroke="#ffffff" 
                    strokeWidth="2.5" 
                    style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.9))' }}
                  />
                </g>
              </g>

            </svg>
          </div>

        {/* SELECTED AROMAS (Single slideable line beneath wheel - fixed height) */}
        <div className="selected-aromas-slider">
          {selectedAromas.length > 0 ? (
            selectedAromas.map((item) => (
              <div 
                key={item} 
                className="aroma-pill-slide"
                onClick={() => toggleAroma(item)}
                title="Click to remove"
              >
                <span style={{ fontWeight: 500 }}>{cleanAromaText(item)}</span>
                <span style={{ color: 'var(--gold-light)', fontWeight: 'bold' }}>✕</span>
              </div>
            ))
          ) : (
            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>
              <EditableText textKey="nose.emptyAromasHint" defaultText="Tap aromas on the wheel to select" multiline={true} />
            </div>
          )}
        </div>

        {/* PALATE & STRUCTURAL (Embedded in Nose & Aroma sector) */}
        {palateData && updatePalateData && (
          <PalateStep
            palateData={palateData}
            updatePalateData={updatePalateData}
            isEmbedded={true}
          />
        )}

      </div>
    </div>
  );
}
