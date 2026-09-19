import React, { useState, useRef } from 'react';
import GenericWineBottle from './GenericWineBottle';
import EditableText from '../TextEditor/EditableText';
import { useTexts } from '../../context/TextContext';
import { Camera, Image, RotateCcw, Share2, Save, Download, Printer, Sparkles, Check } from 'lucide-react';

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

// Text formatter for structural pillar subtitles
function getStructureSubtitle(type, levelStr = '', texture = '') {
  const str = String(levelStr);
  if (type === 'body') {
    if (str.includes('Full')) return 'Full-Bodied, Rich & Viscous';
    if (str.includes('Light')) return 'Light, Delicate & Airy';
    if (str.includes('+')) return 'Medium-Full, Balanced Weight';
    if (str.includes('-')) return 'Medium-Light, Refreshing';
    return 'Medium-Bodied, Harmonious';
  }
  if (type === 'acidity') {
    if (str.includes('High')) return 'Bright & Crisp, Mouth-Watering';
    if (str.includes('Low')) return 'Soft & Mellow, Gentle Lift';
    if (str.includes('+')) return 'Bright, Vibrant & Refreshing';
    if (str.includes('-')) return 'Mild & Supple Freshness';
    return 'Balanced, Clean & Refreshing';
  }
  if (type === 'tannin') {
    const texStr = texture ? `${texture}, ` : '';
    if (str.includes('High')) return `${texStr}Firm & Structured Grip`;
    if (str.includes('Low')) return `${texStr}Silky & Supple`;
    if (str.includes('+')) return `${texStr}Velvety, Well-Integrated`;
    if (str.includes('-')) return `${texStr}Soft & Approachable`;
    return `${texStr}Velvety, Balanced Backbone`;
  }
  return levelStr;
}

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

  // Note data with resilient fallbacks
  const wineName = wineNote.wineName || 'THE REVELATOR RED BLEND';
  const vintage = wineNote.vintage || '2018';
  const alcohol = wineNote.alcohol || '14.5% alc./vol.';
  const score = wineNote.conclusion?.score || 93;
  const price = wineNote.conclusion?.price || '$45 / £38';
  const colorHex = wineNote.color?.hex || '#5c133a';
  const colorName = wineNote.color?.name || 'Deep Ruby';
  const rimVariation = wineNote.color?.rimVariation || 'Violet hues';
  const intensity = wineNote.color?.intensity || 'Deep';

  const bodyVal = wineNote.palate?.body || 'Medium(+)';
  const acidityVal = wineNote.palate?.acidity || 'Medium(+)';
  const tanninVal = wineNote.palate?.tannin || 'Medium(+)';
  const tanninTexture = wineNote.palate?.tanninTexture || 'Velvety';

  const vfmScore = typeof wineNote.vfm === 'number' ? wineNote.vfm : 4;
  const bottleImage = wineNote.bottleImage || null;

  // Selected Aromas categorization
  const userAromas = wineNote.nose?.aromas || [
    'Blackcurrant & Ripe Plum',
    'Smoky Oak & Cedar Notes',
    'Elegant Vanilla & Spice Notes',
    'Faint Leather & Forest Floor'
  ];

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // No file size limit - read file of any size (10MB, 25MB, 50MB+)
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      const img = new window.Image();
      img.onload = () => {
        // Automatically optimize/downscale in-memory (max 1600px)
        // Keeps rendering super-fast and avoids browser memory pressure
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
        // Fallback to raw data url if canvas decode fails
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

  const handleSaveClick = () => {
    if (onSave) onSave();
    setIsSavedFlash(true);
    setTimeout(() => setIsSavedFlash(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Color description string
  const colorDesc = `${intensity} ${colorName.replace(' (Matched)', '')}, ${rimVariation}`;

  return (
    <div className="verdict-wrapper" style={{ width: '100%', maxWidth: '940px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Top Toolbar Controls: Theme Toggle & Bottle Photo Actions */}
      <div className="verdict-toolbar no-print" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${theme === 'parchment' ? 'btn-gold' : 'btn-outline'}`}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            onClick={() => setTheme('parchment')}
          >
            📜 <EditableText textKey="verdict.themeToggleParchment" defaultText="Editorial Parchment" />
          </button>
          <button
            type="button"
            className={`btn ${theme === 'dark' ? 'btn-gold' : 'btn-outline'}`}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            onClick={() => setTheme('dark')}
          >
            🌙 <EditableText textKey="verdict.themeToggleDark" defaultText="Dark Sommelier" />
          </button>

          {/* Separator */}
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />

          {/* Bottle Photo Controls (Outside the card, next to Dark Sommelier) */}
          {!readOnly && (
            <>
              {bottleImage ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={14} />
                    <span><EditableText textKey="verdict.changePhotoBtn" defaultText="Change Photo" /></span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    onClick={handleRemovePhoto}
                  >
                    <RotateCcw size={14} />
                    <span><EditableText textKey="verdict.removePhotoBtn" defaultText="Use Generic Bottle" /></span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={14} />
                  <span><EditableText textKey="verdict.uploadBottleBtn" defaultText="Upload Bottle Photo" /></span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ==========================================================
          THE ONE-SCREEN VERDICT SUMMARY CARD (MATCHING REFERENCE IMAGE)
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
            1. TOP HEADER BLOCK
           ---------------------------------------------------- */}
        <div className="verdict-header-row">
          
          {/* Left: Wine Title & Vintage & Alcohol */}
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
              </div>
              <div style={{ marginTop: '2px' }}>
                <span className="spec-label">
                  <EditableText textKey="verdict.alcoholLabel" defaultText="ALCOHOL:" />
                </span>{' '}
                <span className="spec-value">
                  {alcohol.includes('%') ? alcohol : `${alcohol}% ${t('verdict.alcoholSuffix', 'alc./vol.')}`}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Rosette Gold Medal Stamp (Points Score) */}
          <div className="verdict-medal-wrap">
            <div className="verdict-gold-medal">
              <div className="verdict-medal-inner">
                <span className="medal-score-number font-serif">{score}</span>
                <span className="medal-score-label font-serif">
                  <EditableText textKey="verdict.scorePoints" defaultText="POINTS" />
                  <br />
                  <EditableText textKey="verdict.scoreScore" defaultText="SCORE" />
                </span>
              </div>
            </div>
          </div>

          {/* Right: Price */}
          <div className="verdict-header-right font-serif">
            <span className="spec-label">
              <EditableText textKey="verdict.priceLabel" defaultText="PRICE:" />
            </span>
            <div className="verdict-price-tag">
              [{price || '$45 / £38'}]
            </div>
          </div>

        </div>

        {/* Thin Divider Line */}
        <div className="verdict-divider-line" />

        {/* ----------------------------------------------------
            2. CORE 3-COLUMN SECTIONS (BOTTLE | COLOR & AROMAS | STRUCTURE)
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
                  grape={wineNote.grape}
                  vintage={vintage}
                  region={wineNote.region || wineNote.country}
                  alcohol={alcohol}
                  wineColorHex={colorHex}
                />
              )}
            </div>
          </div>

          {/* COLUMN 2 (CENTER): COLOR SWATCH & AROMAS & FLAVORS */}
          <div className="verdict-center-column">
            
            {/* COLOR SECTION */}
            <div className="verdict-section-block">
              <h3 className="verdict-section-heading font-serif">
                <EditableText textKey="verdict.colorTitle" defaultText="COLOR:" />
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
                {colorDesc}
              </div>
            </div>

            {/* Separator Line */}
            <div className="verdict-inner-divider" />

            {/* AROMAS & FLAVORS SECTION */}
            <div className="verdict-section-block">
              <h3 className="verdict-section-heading font-serif">
                <EditableText textKey="verdict.aromasTitle" defaultText="AROMAS & FLAVORS:" />
              </h3>

              <div className="verdict-aromas-list font-serif">
                {userAromas.map((aroma, idx) => {
                  // Icon picker based on aroma keywords
                  const textLower = String(aroma).toLowerCase();
                  let icon = '🍇';
                  if (textLower.includes('oak') || textLower.includes('cedar') || textLower.includes('barrel') || textLower.includes('toast') || textLower.includes('smoke')) {
                    icon = '🪵';
                  } else if (textLower.includes('vanilla') || textLower.includes('spice') || textLower.includes('pepper') || textLower.includes('clove') || textLower.includes('cinnamon')) {
                    icon = '✳️';
                  } else if (textLower.includes('leather') || textLower.includes('earth') || textLower.includes('forest') || textLower.includes('mushroom') || textLower.includes('tobacco') || textLower.includes('leaves')) {
                    icon = '🍂';
                  } else if (textLower.includes('floral') || textLower.includes('violet') || textLower.includes('rose') || textLower.includes('lavender')) {
                    icon = '🌸';
                  }

                  return (
                    <div key={idx} className="verdict-aroma-row">
                      <span className="aroma-icon">{icon}</span>
                      <span className="aroma-text">{aroma}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* COLUMN 3 (RIGHT): STRUCTURAL GAUGES (BODY, ACIDITY, TANNINS) */}
          <div className="verdict-structure-column">
            
            {/* BODY */}
            <div className="verdict-gauge-group">
              <h3 className="verdict-section-heading font-serif">
                <EditableText textKey="verdict.bodyTitle" defaultText="BODY:" />
              </h3>
              
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

            {/* ACIDITY */}
            <div className="verdict-gauge-group">
              <h3 className="verdict-section-heading font-serif">
                <EditableText textKey="verdict.acidityTitle" defaultText="ACIDITY:" />
              </h3>

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

            {/* TANNINS */}
            <div className="verdict-gauge-group">
              <h3 className="verdict-section-heading font-serif">
                <EditableText textKey="verdict.tanninsTitle" defaultText="TANNINS:" />
              </h3>

              <div className="verdict-gauge-track">
                <div
                  className="verdict-gauge-fill"
                  style={{ width: `${getGaugePercent(tanninVal)}%` }}
                />
              </div>

              <div className="verdict-gauge-subtitle font-serif">
                {getStructureSubtitle('tannin', tanninVal, tanninTexture)}
              </div>
            </div>

          </div>

        </div>

        {/* ----------------------------------------------------
            3. BOTTOM VFM (VALUE FOR MONEY) CARTOUCHE / PLAQUE
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
