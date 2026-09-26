import React, { useState, useRef } from 'react';
import GenericWineBottle from './GenericWineBottle';
import EditableText from '../TextEditor/EditableText';
import { Camera, RotateCcw, Quote, Sun, Moon, Share2, Loader2, Check } from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import { useTexts } from '../../context/TextContext';

// Helper to convert structural levels to gauge percentage
function getGaugePercent(levelStr = '') {
  const str = String(levelStr).toLowerCase();
  if (str.includes('low') || str.includes('light')) {
    if (str.includes('+')) return 35;
    if (str.includes('-')) return 15;
    return 25;
  }
  if (str.includes('full') || str.includes('high') || str.includes('pronounced')) {
    if (str.includes('-')) return 78;
    return 95;
  }
  // Medium
  if (str.includes('+') || str.includes('(+)')) return 75;
  if (str.includes('-') || str.includes('(-)')) return 40;
  return 55;
}

// Text formatter for structural pillar subtitles - concise and never cut off
function getStructureSubtitle(type, levelStr = '', texture = '') {
  const str = String(levelStr);
  if (type === 'body') {
    if (str.includes('Full')) return 'Full & Rich Weight';
    if (str.includes('Light')) return 'Light & Crisp';
    if (str.includes('+')) return 'Medium-Full Weight';
    if (str.includes('-')) return 'Medium-Light Weight';
    return 'Medium Weight';
  }
  if (type === 'acidity') {
    if (str.includes('High')) return 'Bright & Crisp';
    if (str.includes('Low')) return 'Soft & Mellow';
    if (str.includes('+')) return 'Vibrant & Fresh';
    if (str.includes('-')) return 'Mild & Supple';
    return 'Clean & Balanced';
  }
  if (type === 'tannin') {
    const cleanTex = texture ? texture.trim() : '';
    if (cleanTex) {
      if (str.includes('High')) return `${cleanTex} & Firm`;
      if (str.includes('Low')) return `${cleanTex} & Soft`;
      if (str.includes('+')) return `${cleanTex} Grip`;
      if (str.includes('-')) return `${cleanTex} & Gentle`;
      return `${cleanTex} Backbone`;
    }
    if (str.includes('High')) return 'Firm & Structured';
    if (str.includes('Low')) return 'Silky & Soft';
    if (str.includes('+')) return 'Velvety Grip';
    if (str.includes('-')) return 'Soft & Gentle';
    return 'Balanced Backbone';
  }
  return levelStr;
}

const getAromaIcon = (aroma) => {
  const textLower = String(aroma).toLowerCase();
  if (textLower.includes('oak') || textLower.includes('cedar') || textLower.includes('barrel') || textLower.includes('toast') || textLower.includes('smoke')) {
    return '🪵';
  }
  if (textLower.includes('vanilla')) {
    return '🌸';
  }
  if (textLower.includes('spice') || textLower.includes('pepper') || textLower.includes('clove') || textLower.includes('cinnamon')) {
    return '✳️';
  }
  if (textLower.includes('leather') || textLower.includes('earth') || textLower.includes('forest') || textLower.includes('mushroom') || textLower.includes('tobacco') || textLower.includes('leaves')) {
    return '🍂';
  }
  if (textLower.includes('floral') || textLower.includes('violet') || textLower.includes('rose') || textLower.includes('lavender')) {
    return '🌸';
  }
  if (textLower.includes('blackberry') || textLower.includes('blueberry') || textLower.includes('plum')) {
    return '🫐';
  }
  if (textLower.includes('currant') || textLower.includes('cassis') || textLower.includes('cherry')) {
    return '🍇';
  }
  return '🍇';
};

export default function VerdictStep({
  wineNote,
  updateWineNote,
  onSave,
  onShare,
  readOnly = false
}) {
  const { t } = useTexts();
  const fileInputRef = useRef(null);
  const cardRef = useRef(null);

  const [theme, setTheme] = useState('parchment'); // 'parchment' | 'dark'
  const [isSharingPhoto, setIsSharingPhoto] = useState(false);
  const [shareSuccessFlash, setShareSuccessFlash] = useState(false);

  // Identity & Specs
  const rawWineName = wineNote.wineName || 'THE REVELATOR RED BLEND';
  const wineName = rawWineName.slice(0, 23);
  const vintage = wineNote.vintage || '2018';
  const grape = wineNote.grape || 'Grand Vin';
  const country = wineNote.country || '';
  const region = wineNote.region || '';
  const originStr = [region, country].filter(Boolean).join(', ') || 'Fine Wine';
  const alcohol = wineNote.alcohol || '14.5% alc./vol.';
  const score = typeof wineNote.conclusion?.score === 'number' ? wineNote.conclusion.score : 93;
  const price = wineNote.conclusion?.price || '$45';
  const notes = wineNote.conclusion?.notes || '';
  const displayNotes = notes ? notes.trim().slice(0, 160) : '';

  // Helper to remove any parenthetical text (e.g. "(Cassis)", "(30s)")
  const cleanText = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/[()]/g, '')
      .trim();
  };

  // Helper to cleanly convert "(+)" to "+" and strip other parens
  const cleanIntensity = (val) => {
    if (!val) return '';
    return String(val)
      .replace(/\(\+\)/g, '+')
      .replace(/\(-\)/g, '-')
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/[()]/g, '')
      .trim();
  };

  // 1. Color Parameters (Sector 1)
  const colorHex = wineNote.color?.hex || '#5c133a';
  const colorName = wineNote.color?.name || 'Deep Ruby';
  const colorIntensity = wineNote.color?.intensity || 'Deep';

  const cleanColorName = colorName.replace(' (Matched)', '').trim();
  const hasIntensityInName = cleanColorName.toLowerCase().startsWith(colorIntensity.toLowerCase());
  const displayColorName = hasIntensityInName ? cleanColorName : `${colorIntensity} ${cleanColorName}`;

  // 2. Nose Parameters (Sector 2)
  const noseIntensity = wineNote.nose?.intensity || 'Medium(+)';
  const noseIntensityClean = cleanIntensity(noseIntensity);
  const noseDevelopment = wineNote.nose?.development || 'Youthful';
  const rawAromas = wineNote.nose?.aromas?.length ? wineNote.nose.aromas : [
    'Blackberry',
    'Blackcurrant',
    'Vanilla',
    'Cedar'
  ];
  // Strip parentheses and limit length for clean sommelier presentation
  const userAromas = rawAromas
    .map(a => cleanText(a))
    .filter(Boolean)
    .slice(0, 4)
    .map(a => a.length > 28 ? a.slice(0, 28).trim() : a);

  // Dynamic food pairings matching wine color/grape (or inspiration defaults)
  const isWhiteOrRose = colorHex.toLowerCase().includes('gold') ||
    colorHex.toLowerCase().includes('straw') ||
    colorName.toLowerCase().includes('white') ||
    colorName.toLowerCase().includes('rosé') ||
    colorName.toLowerCase().includes('rose') ||
    colorName.toLowerCase().includes('yellow') ||
    colorName.toLowerCase().includes('green');

  const pairingsList = isWhiteOrRose ? [
    { icon: '🐟', name: 'Grilled Salmon' },
    { icon: '🧀', name: 'Goat Cheese' },
    { icon: '🍗', name: 'Roasted Poultry' }
  ] : [
    { icon: '🥩', name: 'Ribeye Steak' },
    { icon: '🧀', name: 'Aged Cheddar' },
    { icon: '🍖', name: 'Lamb Shanks' }
  ];

  // 3. Palate & Structural Parameters (Sector 2 - all 8 attributes)
  const bodyVal = wineNote.palate?.body || 'Medium(+)';
  const bodyClean = cleanIntensity(bodyVal);
  const acidityVal = wineNote.palate?.acidity || 'Medium(+)';
  const tanninVal = wineNote.palate?.tannin || 'Medium(+)';
  const tanninTexture = wineNote.palate?.tanninTexture || (tanninVal.match(/\(([^)]+)\)/)?.[1] || '');
  const sweetnessVal = cleanIntensity(wineNote.palate?.sweetness || 'Dry');
  const alcoholLevelVal = wineNote.palate?.alcoholLevel || 'Medium (11-13.9%)';
  const flavorIntensityVal = cleanIntensity(wineNote.palate?.flavorIntensity || 'Pronounced');
  const finishVal = wineNote.palate?.finish || 'Medium(+) (30s)';
  const finishSeconds = typeof wineNote.palate?.finishSeconds === 'number'
    ? wineNote.palate.finishSeconds
    : (() => {
        const m = String(finishVal).match(/(\d+)\s*s/i);
        return m ? parseInt(m[1], 10) : null;
      })();

  const formatFinishDisplay = () => {
    const raw = String(finishVal || '').trim();
    const cleanLevel = cleanIntensity(raw);
    if (finishSeconds !== null && finishSeconds !== undefined && finishSeconds > 0) {
      return `${cleanLevel} ${finishSeconds}s`;
    }
    const secMatch = raw.match(/(\d+)\s*s/i);
    if (secMatch) {
      return `${cleanLevel} ${secMatch[1]}s`;
    }
    return cleanLevel;
  };

  // 4. Rating & VFM (Sector 3)
  const vfmScore = typeof wineNote.vfm === 'number' ? wineNote.vfm : 4;
  const bottleImage = wineNote.bottleImage || null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

        updateWineNote({
          ...wineNote,
          bottleImage: optimizedDataUrl,
          useGenericBottle: false
        });
      };

      img.onerror = () => {
        updateWineNote({
          ...wineNote,
          bottleImage: dataUrl,
          useGenericBottle: false
        });
      };

      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateWineNote({
      ...wineNote,
      bottleImage: null,
      useGenericBottle: true
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const setVfm = (newVfm) => {
    if (readOnly) return;
    updateWineNote({ ...wineNote, vfm: newVfm });
  };

  const handleSharePhoto = async () => {
    if (!cardRef.current || isSharingPhoto) return;
    setIsSharingPhoto(true);

    try {
      await new Promise(r => setTimeout(r, 60));

      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        filter: (node) => {
          return !node.classList?.contains('no-print');
        }
      });

      if (!blob) {
        throw new Error('Failed to capture card image');
      }

      const safeName = (wineName || 'wine').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeName}_verdict.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: wineName || 'Wine Tasting Verdict',
          text: `Wine Tasting Summary: ${wineName} (${vintage})`
        });
        setShareSuccessFlash(true);
        setTimeout(() => setShareSuccessFlash(false), 2500);
      } else {
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
        setShareSuccessFlash(true);
        setTimeout(() => setShareSuccessFlash(false), 2500);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing photo:', err);
        try {
          const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
          const safeName = (wineName || 'wine').replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const link = document.createElement('a');
          link.download = `${safeName}_verdict.png`;
          link.href = dataUrl;
          link.click();
          setShareSuccessFlash(true);
          setTimeout(() => setShareSuccessFlash(false), 2500);
        } catch (fallbackErr) {
          console.error('Fallback photo download failed:', fallbackErr);
        }
      }
    } finally {
      setIsSharingPhoto(false);
    }
  };

  // Wine type clean for GenericBottle
  const wineTypeClean = (wineNote.type || 'red').toLowerCase();

  return (
    <div className="verdict-wrapper">
      
      {/* Top Toolbar Controls: Theme Toggle & Bottle Photo Actions */}
      <div className="verdict-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Day / Night Theme Single Toggle Button (Symbol only) */}
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '8px 10px', minWidth: '38px', height: '36px', justifyContent: 'center' }}
            onClick={() => setTheme(prev => prev === 'parchment' ? 'dark' : 'parchment')}
            title={theme === 'parchment' ? 'Switch to Dark Theme' : 'Switch to Day / Parchment Theme'}
            aria-label="Toggle Day / Night theme"
          >
            {theme === 'parchment' ? <Sun size={18} color="#d4af37" /> : <Moon size={18} color="#d4af37" />}
          </button>

          {/* Separator */}
          <div style={{ width: '1px', height: '20px', background: 'rgba(212, 175, 55, 0.25)', margin: '0 2px' }} />

          {/* Bottle Photo Controls (Symbol only, no text) */}
          {!readOnly && (
            <>
              {bottleImage ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '8px 10px', minWidth: '38px', height: '36px', justifyContent: 'center' }}
                    onClick={() => fileInputRef.current?.click()}
                    title="Change Bottle Photo"
                    aria-label="Change Bottle Photo"
                  >
                    <Camera size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '8px 10px', minWidth: '38px', height: '36px', justifyContent: 'center' }}
                    onClick={handleRemovePhoto}
                    title="Use Generic Bottle"
                    aria-label="Use Generic Bottle"
                  >
                    <RotateCcw size={18} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '8px 10px', minWidth: '38px', height: '36px', justifyContent: 'center' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload Bottle Photo"
                  aria-label="Upload Bottle Photo"
                >
                  <Camera size={18} />
                </button>
              )}
            </>
          )}

          {/* Share Summary as Photo Button (Symbol only) */}
          <button
            type="button"
            className="btn btn-outline"
            style={{ 
              padding: '8px 10px', 
              minWidth: '38px', 
              height: '36px', 
              justifyContent: 'center',
              borderColor: shareSuccessFlash ? 'var(--gold-primary)' : undefined,
              background: shareSuccessFlash ? 'rgba(212, 175, 55, 0.2)' : undefined
            }}
            onClick={handleSharePhoto}
            disabled={isSharingPhoto}
            title="Share Summary as Photo"
            aria-label="Share Summary as Photo"
          >
            {isSharingPhoto ? (
              <Loader2 size={18} className="spin-animate" color="#d4af37" />
            ) : shareSuccessFlash ? (
              <Check size={18} color="#d4af37" />
            ) : (
              <Share2 size={18} />
            )}
          </button>
        </div>
      </div>

      {/* ==========================================================
          THE 700PX ONE-SCREEN VERDICT SUMMARY CARD
         ========================================================== */}
      <div
        ref={cardRef}
        className={`verdict-card ${theme === 'dark' ? 'theme-dark' : 'theme-parchment'}`}
      >
        {/* Hidden File Input for Custom Bottle Photo Upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handlePhotoUpload}
        />

        {/* ----------------------------------------------------
            1. TOP HEADER BLOCK: IDENTITY, SPECS & ROSETTE MEDAL
           ---------------------------------------------------- */}
        <div className="verdict-header-row">
          
          {/* Left: Wine Title & Compact Specs */}
          <div className="verdict-header-left">
            <h1 className="verdict-wine-title font-serif">
              {wineName}
            </h1>
            <div className="verdict-wine-specs font-serif">
              <span className="spec-item spec-vintage-origin">
                {vintage ? `${vintage} | ` : ''}{originStr.toUpperCase()}
              </span>
              <span className="spec-badge-item">
                <span className="spec-mini-circle">%</span>
                <span className="spec-badge-label"><EditableText textKey="verdict.alcoholBadgeLabel" defaultText="ALCOHOL:" /></span>
                <span className="spec-badge-val">{alcohol.includes('%') ? alcohol : `${alcohol}%`}</span>
              </span>
              <span className="spec-badge-item">
                <span className="spec-mini-circle">$</span>
                <span className="spec-badge-label"><EditableText textKey="verdict.priceBadgeLabel" defaultText="PRICE:" /></span>
                <span className="spec-badge-val">{price}</span>
              </span>
            </div>
          </div>

          {/* Center/Right: Rosette Gold Medal Stamp (Points Score) */}
          <div className="verdict-medal-wrap">
            <div className={`verdict-gold-medal ${score === 0 ? 'unworthy-medal' : ''}`}>
              <div className="verdict-medal-inner">
                <span className="medal-score-number font-serif">{score}</span>
                <span className="medal-score-label font-serif">
                  {score === 0 ? (
                    <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.62rem', letterSpacing: '0.05em' }}>UNWORTHY</span>
                  ) : (
                    <>
                      <EditableText textKey="verdict.scorePoints" defaultText="POINTS" />
                      <br />
                      <EditableText textKey="verdict.scoreScore" defaultText="SCORE" />
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thin Divider Line */}
        <div className="verdict-divider-line" />

        {/* ----------------------------------------------------
            2. MAIN BODY: 2 COLUMNS
               Left Column: Bottle Frame + Key Attributes
               Right Column: Tasting Notes (Nose & Aromas) + Palate
           ---------------------------------------------------- */}
        <div className="verdict-body-grid">
          {/* Left Column: holds Bottle + Key Attributes (below bottle) */}
          <div className="verdict-left-column">
            <div className="verdict-bottle-column">
              <div className="verdict-bottle-frame">
                {bottleImage ? (
                  <div className="custom-bottle-img-wrap">
                    <img src={bottleImage} alt="Wine Bottle" className="custom-bottle-img" />
                  </div>
                ) : (
                  <div className="generic-wine-bottle-wrap">
                    <GenericWineBottle
                      wineType={wineTypeClean}
                      wineColorHex={colorHex}
                      wineName={wineName}
                      vintage={vintage}
                      appellation={originStr}
                      alcohol={alcohol}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Key Attributes Block (Pillars & Color Bar) placed below bottle */}
            <div className="verdict-key-attributes-block font-serif">
              <div className="verdict-section-heading" style={{ marginBottom: '4px', textAlign: 'center' }}>
                <EditableText textKey="verdict.keyAttributesTitle" defaultText="KEY ATTRIBUTES" />
              </div>

              {/* 4-Color Attribute Segments Bar */}
              <div className="verdict-attr-bar-container">
                <div className="attr-color-segment attr-seg-sweetness" title={`Sweetness: ${sweetnessVal}`}>
                  <span className="attr-seg-icon">💧</span>
                </div>
                <div className="attr-color-segment attr-seg-alcohol" title={`Alcohol: ${alcoholLevelVal}`}>
                  <span className="attr-seg-icon">🌡️</span>
                </div>
                <div 
                  className="attr-color-segment attr-seg-flavor" 
                  style={{ backgroundColor: colorHex }} 
                  title={`Color: ${displayColorName} | Flavor: ${flavorIntensityVal}`}
                >
                  <span className="attr-seg-icon">☀️</span>
                </div>
                <div className="attr-color-segment attr-seg-finish" title={`Finish: ${formatFinishDisplay()}`}>
                  <span className="attr-seg-icon">⏱️</span>
                </div>
              </div>

              {/* 2x2 Palate Pillars */}
              <div className="verdict-palate-pillars-grid">
                <div className="palate-pillar-item">
                  <div className="pillar-header-row">
                    <span className="pillar-label"><EditableText textKey="verdict.sweetnessTitle" defaultText="SWEETNESS:" /></span>
                    <span className="pillar-icon">💧</span>
                  </div>
                  <span className="pillar-val">{sweetnessVal.toUpperCase()}</span>
                </div>

                <div className="palate-pillar-item">
                  <div className="pillar-header-row">
                    <span className="pillar-label"><EditableText textKey="verdict.alcoholLevelTitle" defaultText="ALCOHOL:" /></span>
                    <span className="pillar-icon">↗️</span>
                  </div>
                  <span className="pillar-val">{cleanIntensity(alcoholLevelVal.split(' ')[0]).toUpperCase()}</span>
                </div>

                <div className="palate-pillar-item">
                  <div className="pillar-header-row">
                    <span className="pillar-label"><EditableText textKey="verdict.flavorTitle" defaultText="FLAVOR:" /></span>
                    <span className="pillar-icon">🍄</span>
                  </div>
                  <span className="pillar-val">{flavorIntensityVal.toUpperCase()}</span>
                </div>

                <div className="palate-pillar-item">
                  <div className="pillar-header-row">
                    <span className="pillar-label"><EditableText textKey="verdict.finishTitle" defaultText="FINISH:" /></span>
                    <span className="pillar-icon">⏱️</span>
                  </div>
                  <span className="pillar-val">{formatFinishDisplay().toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tasting Data & Sections (Tasting Notes + Palate) */}
          <div className="verdict-tasting-content">
            
            {/* SUB-SECTION 1: Tasting Notes (Nose & Aromas) - Profile is removed */}
            <div className="verdict-tasting-notes-block font-serif">
              <h3 className="verdict-section-heading">
                <EditableText textKey="verdict.tastingNotesTitle" defaultText="TASTING NOTES" />
              </h3>

              <div className="verdict-nose-content-row">
                <div className="verdict-nose-meta-wrap">
                  <div className="verdict-nose-subheading">
                    <EditableText textKey="verdict.noseTitle" defaultText="NOSE & AROMAS" />
                  </div>
                  <div className="verdict-nose-meta">
                    <div className="meta-line">
                      <span className="meta-label"><EditableText textKey="verdict.intensityLabel" defaultText="INTENSITY:" /></span>{' '}
                      <strong className="meta-val">{noseIntensityClean.toUpperCase()}</strong>
                    </div>
                    <div className="meta-line">
                      <span className="meta-label"><EditableText textKey="verdict.developmentLabel" defaultText="DEVELOPMENT:" /></span>{' '}
                      <strong className="meta-val">{cleanIntensity(noseDevelopment).toUpperCase()}</strong>
                    </div>
                  </div>
                </div>

                <div className="verdict-aromas-list font-serif">
                  {userAromas.length > 0 ? (
                    userAromas.map((aroma, idx) => (
                      <div key={idx} className="verdict-aroma-row">
                        <span className="aroma-icon">{getAromaIcon(aroma)}</span>
                        <span className="aroma-text">{aroma.toUpperCase()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="verdict-aroma-row verdict-aroma-empty">
                      <span className="aroma-icon">🍇</span>
                      <span className="aroma-text">NO SPECIFIC AROMAS</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* SUB-SECTION 2: Palate & Structure */}
            <div className="verdict-palate-block font-serif">
              <h3 className="verdict-section-heading" style={{ marginBottom: '6px' }}>
                <EditableText textKey="palate.title" defaultText="PALATE & STRUCTURE" />
              </h3>

              {/* Body Gauge */}
              <div className="verdict-gauge-row">
                <div className="gauge-icon-label">
                  <span className="gauge-icon">🍷</span>
                  <span className="gauge-title"><EditableText textKey="verdict.bodyTitle" defaultText="BODY:" /></span>
                </div>
                <div className="gauge-control-wrap">
                  <div className="gauge-track-container">
                    <span
                      className="gauge-pointer"
                      style={{ left: `${getGaugePercent(bodyVal)}%` }}
                    >
                      ▼
                    </span>
                    <div className="verdict-gauge-track">
                      <div
                        className="verdict-gauge-fill"
                        style={{ width: `${getGaugePercent(bodyVal)}%` }}
                      />
                    </div>
                  </div>
                  <div className="gauge-tickers-row">
                    <span>Light</span>
                    <span>Full</span>
                  </div>
                  <div className="gauge-desc-line">
                    <strong>{bodyClean.toUpperCase()}</strong> • <span>{getStructureSubtitle('body', bodyVal).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Acidity Gauge */}
              <div className="verdict-gauge-row">
                <div className="gauge-icon-label">
                  <span className="gauge-icon">🍋</span>
                  <span className="gauge-title"><EditableText textKey="verdict.acidityTitle" defaultText="ACIDITY:" /></span>
                </div>
                <div className="gauge-control-wrap">
                  <div className="gauge-track-container">
                    <span
                      className="gauge-pointer"
                      style={{ left: `${getGaugePercent(acidityVal)}%` }}
                    >
                      ▼
                    </span>
                    <div className="verdict-gauge-track">
                      <div
                        className="verdict-gauge-fill"
                        style={{ width: `${getGaugePercent(acidityVal)}%` }}
                      />
                    </div>
                  </div>
                  <div className="gauge-tickers-row">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                  <div className="gauge-desc-line">
                    <strong>{cleanIntensity(acidityVal).toUpperCase()}</strong> • <span>{getStructureSubtitle('acidity', acidityVal).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Tannins Gauge */}
              <div className="verdict-gauge-row">
                <div className="gauge-icon-label">
                  <span className="gauge-icon">🍇</span>
                  <span className="gauge-title"><EditableText textKey="verdict.tanninsTitle" defaultText="TANNINS:" /></span>
                </div>
                <div className="gauge-control-wrap">
                  <div className="gauge-track-container">
                    <span
                      className="gauge-pointer"
                      style={{ left: `${getGaugePercent(tanninVal)}%` }}
                    >
                      ▼
                    </span>
                    <div className="verdict-gauge-track">
                      <div
                        className="verdict-gauge-fill"
                        style={{ width: `${getGaugePercent(tanninVal)}%` }}
                      />
                    </div>
                  </div>
                  <div className="gauge-tickers-row">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                  <div className="gauge-desc-line">
                    <strong>{cleanIntensity(tanninVal).toUpperCase()}</strong> • <span>{getStructureSubtitle('tannin', tanninVal, tanninTexture).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Food Pairings if present */}
            {pairingsList.length > 0 && (
              <>
                <div className="verdict-inner-divider" />
                <div className="verdict-pairings-col font-serif">
                  <div className="pairings-title">
                    <EditableText textKey="verdict.pairsWellWith" defaultText="PAIRS WELL WITH:" />
                  </div>
                  <div className="pairings-list-horizontal">
                    {pairingsList.map((item, pIdx) => (
                      <div key={pIdx} className="pairing-row">
                        <span className="pairing-icon">{item.icon}</span>
                        <span className="pairing-name">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------
            3. SOMMELIER NOTES ROW
           ---------------------------------------------------- */}
        <div className="verdict-notes-row font-serif">
          <div className="notes-header">
            <Quote size={12} color="#9e7a24" />
            <EditableText textKey="verdict.notesTitle" defaultText="SOMMELIER'S NOTES & PAIRINGS:" />
          </div>
          <div className="notes-body">
            {displayNotes ? `"${displayNotes}"` : '"Balanced red wine evaluation displaying harmonious structure, and lingering."'}
          </div>
        </div>

        {/* ----------------------------------------------------
            4. BOTTOM VFM (VALUE FOR MONEY) - SHOW ONLY GLASSES
           ---------------------------------------------------- */}
        <div className="verdict-vfm-footer-bar font-serif">
          <div className="vfm-footer-left">
            <span className="vfm-prefix"><EditableText textKey="verdict.vfmTitle" defaultText="VFM:" /></span>
            <div
              className="vfm-glasses-row"
              title={readOnly ? undefined : 'Click to rate Value For Money'}
            >
              {[1, 2, 3, 4, 5].map((gIndex) => {
                const isFilled = gIndex <= vfmScore;
                return (
                  <button
                    key={gIndex}
                    type="button"
                    className={`vfm-glass-btn ${isFilled ? 'filled' : 'empty'} ${readOnly ? 'read-only' : ''}`}
                    onClick={() => setVfm(gIndex)}
                    aria-label={`Set VFM ${gIndex} of 5`}
                  >
                    <svg viewBox="0 0 28 42" fill="currentColor">
                      <path d="M 4 4 C 4 22, 24 22, 24 4 Z" />
                      <rect x="12.5" y="21" width="3" height="15" />
                      <ellipse cx="14" cy="37" rx="10" ry="2.5" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
