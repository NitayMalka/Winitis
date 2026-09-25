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
  if (textLower.includes('vanilla') || textLower.includes('spice') || textLower.includes('pepper') || textLower.includes('clove') || textLower.includes('cinnamon')) {
    return '✳️';
  }
  if (textLower.includes('leather') || textLower.includes('earth') || textLower.includes('forest') || textLower.includes('mushroom') || textLower.includes('tobacco') || textLower.includes('leaves')) {
    return '🍂';
  }
  if (textLower.includes('floral') || textLower.includes('violet') || textLower.includes('rose') || textLower.includes('lavender')) {
    return '🌸';
  }
  if (textLower.includes('black') || textLower.includes('cassis') || textLower.includes('blackberry') || textLower.includes('blueberry') || textLower.includes('plum')) {
    return '🫐';
  }
  return '🍇';
};

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

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
  const [isSavedFlash, setIsSavedFlash] = useState(false);

  // Identity & Specs
  const wineName = wineNote.wineName || 'THE REVELATOR RED BLEND';
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
  const rimVariation = wineNote.color?.rimVariation || 'Violet hues';
  const colorIntensity = wineNote.color?.intensity || 'Deep';
  const clarity = wineNote.color?.clarity || 'Clear';

  const cleanColorName = colorName.replace(' (Matched)', '').trim();
  const hasIntensityInName = cleanColorName.toLowerCase().startsWith(colorIntensity.toLowerCase());
  const displayColorName = hasIntensityInName ? cleanColorName : `${colorIntensity} ${cleanColorName}`;
  const cleanRim = rimVariation ? rimVariation.replace(/rim variation/i, 'Rim').trim() : '';

  // 2. Nose Parameters (Sector 2)
  const noseIntensity = wineNote.nose?.intensity || 'Medium(+)';
  const noseIntensityClean = cleanIntensity(noseIntensity);
  const noseDevelopment = wineNote.nose?.development || 'Youthful';
  const rawAromas = wineNote.nose?.aromas || [
    'Blackcurrant & Ripe Plum',
    'Smoky Oak & Cedar Notes',
    'Elegant Vanilla & Spice Notes',
    'Faint Leather & Forest Floor'
  ];
  // Strip parentheses (e.g. "(Cassis)") and limit length for clean luxury presentation
  const userAromas = rawAromas
    .map(a => cleanText(a))
    .filter(Boolean)
    .slice(0, 5)
    .map(a => a.length > 28 ? a.slice(0, 28).trim() : a);

  // 3. Palate & Structural Parameters (Sector 2 - all 8 attributes)
  const bodyVal = wineNote.palate?.body || 'Medium(+)';
  const bodyClean = cleanIntensity(bodyVal);
  const acidityVal = wineNote.palate?.acidity || 'Medium(+)';
  const acidityClean = cleanIntensity(acidityVal);
  const tanninVal = wineNote.palate?.tannin || 'Medium(+)';
  const tanninClean = cleanIntensity(tanninVal);
  const tanninLevelClean = tanninClean;
  const tanninTexture = wineNote.palate?.tanninTexture || (tanninVal.match(/\(([^)]+)\)/)?.[1] || '');
  const tanninTextureClean = cleanText(tanninTexture);
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

  const [isSharingPhoto, setIsSharingPhoto] = useState(false);
  const [shareSuccessFlash, setShareSuccessFlash] = useState(false);

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
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
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
          (Matches Sector 1 Color Inspector 700px Screen Size)
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
          
          {/* Left: Wine Title & Specs (Vintage, Origin, Alcohol, Price) */}
          <div className="verdict-header-left">
            <h1 className="verdict-wine-title font-serif">
              {wineName}
            </h1>
            <div className="verdict-wine-specs font-serif">
              <div>
                <span className="spec-label">
                  <EditableText textKey="verdict.vintageLabel" defaultText="VINTAGE:" />
                </span>{' '}
                <span className="spec-value">{vintage}</span>
                <span className="spec-bullet"> • </span>
                <span className="spec-value">{grape}</span>
                <span className="spec-bullet"> • </span>
                <span className="spec-value">{originStr}</span>
              </div>
              <div style={{ marginTop: '2px' }}>
                <span className="spec-label">
                  <EditableText textKey="verdict.alcoholLabel" defaultText="ALCOHOL:" />
                </span>{' '}
                <span className="spec-value">
                  {alcohol.includes('%') ? alcohol : `${alcohol}% ${t('verdict.alcoholSuffix', 'alc./vol.')}`}
                </span>
                <span className="spec-bullet"> • </span>
                <span className="spec-label">
                  <EditableText textKey="verdict.priceLabel" defaultText="PRICE:" />
                </span>{' '}
                <span className="spec-value verdict-price-tag">{price}</span>
              </div>
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
            2. CORE 3-COLUMN SECTIONS (BOTTLE | COLOR & NOSE | PALATE)
           ---------------------------------------------------- */}
        <div className="verdict-body-grid">
          
          {/* COLUMN 1 (LEFT): WINE BOTTLE PRESENTATION */}
          <div className="verdict-bottle-column">
            <div className="verdict-bottle-frame">
              {bottleImage ? (
                <div className="custom-bottle-img-wrap">
                  <img
                    src={bottleImage}
                    alt={wineName}
                    className="custom-bottle-img"
                  />
                </div>
              ) : (
                <GenericWineBottle
                  wineName={wineName}
                  grape={grape}
                  vintage={vintage}
                  region={originStr}
                  alcohol={alcohol}
                  wineColorHex={colorHex}
                />
              )}
            </div>
          </div>

          {/* COLUMN 2 (CENTER): SIGHT & PALATE STRUCTURE */}
          <div className="verdict-center-column">
            
            {/* COLOR & CLARITY SECTION (SECTOR 1 RANKINGS) */}
            <div className="verdict-section-block">
              <h3 className="verdict-section-heading font-serif">
                <EditableText textKey="verdict.colorTitle" defaultText="COLOR & CLARITY:" />
              </h3>

              {/* Rounded Rectangle Color Swatch */}
              <div
                className="verdict-color-swatch"
                style={{
                  backgroundColor: colorHex,
                  background: `linear-gradient(135deg, ${colorHex} 0%, rgba(20, 5, 12, 0.95) 100%)`
                }}
              >
                <div className="color-swatch-sheen" />
              </div>

              <div className="verdict-color-desc font-serif">
                <strong>{displayColorName}</strong>
                {(cleanRim || clarity) && (
                  <span className="verdict-subtext"> • {[cleanRim, clarity].filter(Boolean).join(' • ')}</span>
                )}
              </div>
            </div>

            {/* Separator Line */}
            <div className="verdict-inner-divider" />

            {/* PALATE & STRUCTURAL SECTION (SECTOR 2 PALATE ATTRIBUTES) */}
            <div className="verdict-section-block verdict-palate-block">
              <h3 className="verdict-section-heading font-serif" style={{ marginBottom: '4px' }}>
                <EditableText textKey="palate.title" defaultText="PALATE & STRUCTURAL" />:
              </h3>

              {/* 1. BODY GAUGE */}
              <div className="verdict-gauge-group">
                <div className="verdict-gauge-label font-serif">
                  <span><EditableText textKey="verdict.bodyTitle" defaultText="BODY:" /></span>
                  <span className="gauge-val">{bodyClean}</span>
                </div>
                <div className="verdict-gauge-track">
                  <div
                    className="verdict-gauge-fill"
                    style={{ width: `${getGaugePercent(bodyVal)}%` }}
                  />
                </div>
                <div className="verdict-gauge-subtitle font-serif">
                  {getStructureSubtitle('body', bodyVal)}
                </div>
              </div>

              {/* 2. ACIDITY GAUGE */}
              <div className="verdict-gauge-group">
                <div className="verdict-gauge-label font-serif">
                  <span><EditableText textKey="verdict.acidityTitle" defaultText="ACIDITY:" /></span>
                  <span className="gauge-val">{acidityClean}</span>
                </div>
                <div className="verdict-gauge-track">
                  <div
                    className="verdict-gauge-fill"
                    style={{ width: `${getGaugePercent(acidityVal)}%` }}
                  />
                </div>
                <div className="verdict-gauge-subtitle font-serif">
                  {getStructureSubtitle('acidity', acidityVal)}
                </div>
              </div>

              {/* 3. TANNINS GAUGE (LEVEL & TEXTURE) */}
              <div className="verdict-gauge-group">
                <div className="verdict-gauge-label font-serif">
                  <span><EditableText textKey="verdict.tanninsTitle" defaultText="TANNINS:" /></span>
                  <span className="gauge-val">{tanninClean}</span>
                </div>
                <div className="verdict-gauge-track">
                  <div
                    className="verdict-gauge-fill"
                    style={{ width: `${getGaugePercent(tanninVal)}%` }}
                  />
                </div>
                <div className="verdict-gauge-subtitle font-serif">
                  {getStructureSubtitle('tannin', tanninVal, tanninTextureClean)}
                </div>
              </div>

              {/* 4. PALATE ATTRIBUTES PILLARS (SWEETNESS, ALCOHOL, FLAVOR, FINISH) */}
              <div className="verdict-palate-pillars-grid">
                
                <div className="palate-pillar-item font-serif">
                  <span className="pillar-label">
                    <EditableText textKey="verdict.sweetnessTitle" defaultText="SWEETNESS:" />
                  </span>
                  <span className="pillar-val">{sweetnessVal}</span>
                </div>

                <div className="palate-pillar-item font-serif">
                  <span className="pillar-label">
                    <EditableText textKey="verdict.alcoholLevelTitle" defaultText="ALCOHOL:" />
                  </span>
                  <span className="pillar-val">{cleanIntensity(alcoholLevelVal.split(' ')[0])}</span>
                </div>

                <div className="palate-pillar-item font-serif">
                  <span className="pillar-label">
                    <EditableText textKey="verdict.flavorTitle" defaultText="FLAVOR:" />
                  </span>
                  <span className="pillar-val">{flavorIntensityVal}</span>
                </div>

                <div className="palate-pillar-item font-serif">
                  <span className="pillar-label">
                    <EditableText textKey="verdict.finishTitle" defaultText="FINISH:" />
                  </span>
                  <span className="pillar-val">{formatFinishDisplay()}</span>
                </div>

              </div>
            </div>

          </div>

          {/* COLUMN 3 (RIGHT): NOSE & AROMAS SHOWCASE */}
          <div className="verdict-aromas-column">
            
            <div className="verdict-section-block">
              <h3 className="verdict-section-heading font-serif">
                <EditableText textKey="verdict.noseTitle" defaultText="NOSE & AROMAS:" />
              </h3>

              {/* Nose Intensity & Development Badges */}
              <div className="verdict-nose-badges">
                <span className="verdict-pill-badge">
                  <EditableText textKey="verdict.intensityLabel" defaultText="Intensity:" /> <strong>{noseIntensityClean}</strong>
                </span>
                <span className="verdict-pill-badge">
                  <EditableText textKey="verdict.developmentLabel" defaultText="Development:" /> <strong>{cleanIntensity(noseDevelopment)}</strong>
                </span>
              </div>

              {/* Selected Aromas Showcase */}
              <div className="verdict-aromas-list font-serif">
                {userAromas.length > 0 ? (
                  userAromas.map((aroma, idx) => (
                    <div key={idx} className="verdict-aroma-row">
                      <span className="aroma-icon">{getAromaIcon(aroma)}</span>
                      <span className="aroma-text">{aroma}</span>
                    </div>
                  ))
                ) : (
                  <div className="verdict-aroma-row" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                    <span className="aroma-icon">🍇</span>
                    <span className="aroma-text">No specific aromas selected</span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* ----------------------------------------------------
            3. SOMMELIER NOTES & FOOD PAIRINGS CARTOUCHE
           ---------------------------------------------------- */}
        <div className="verdict-notes-cartouche font-serif">
          <div className="notes-cartouche-header">
            <Quote size={11} color="#d4af37" />
            <EditableText textKey="verdict.notesTitle" defaultText="SOMMELIER NOTES & PAIRINGS:" />
          </div>
          <div className="notes-cartouche-text">
            {displayNotes ? `"${displayNotes}"` : '"Balanced red wine evaluation displaying expressive terroir, harmonious structure, and lingering finish."'}
          </div>
        </div>

        {/* ----------------------------------------------------
            4. BOTTOM VFM (VALUE FOR MONEY) CARTOUCHE
           ---------------------------------------------------- */}
        <div className="verdict-vfm-cartouche font-serif">
          <div className="vfm-inner-box">
            
            {/* VFM: Prefix */}
            <div className="vfm-prefix font-serif">
              <EditableText textKey="verdict.vfmTitle" defaultText="VFM:" />
            </div>

            {/* Hairline Divider */}
            <div className="vfm-v-divider" />

            {/* Score & 5 Wine Glasses */}
            <div className="vfm-content-area">
              <div className="vfm-score-row">
                <span className="vfm-score-number">{vfmScore}/5</span>
                
                {/* 5 Interactive Wine Glass Silhouettes */}
                <div className="vfm-glasses-row" title={readOnly ? undefined : 'Click to rate Value For Money'}>
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
                        {/* Wine Glass Silhouette SVG */}
                        <svg viewBox="0 0 28 42" fill="currentColor">
                          {/* Bowl with Liquid */}
                          <path d="M 4 4 C 4 22, 24 22, 24 4 Z" />
                          {/* Stem */}
                          <rect x="12.5" y="21" width="3" height="15" />
                          {/* Base */}
                          <ellipse cx="14" cy="37" rx="10" ry="2.5" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Verbal Subtitle */}
              <div className="vfm-subtitle font-serif">
                <EditableText
                  textKey="verdict.vfmGlassesSub"
                  defaultText={`[${NUMBER_WORDS[vfmScore] || vfmScore} full glasses out of five]`}
                  interpolations={{ count: NUMBER_WORDS[vfmScore] || vfmScore }}
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
