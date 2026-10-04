import React, { useState, useRef } from 'react';
import GenericWineBottle from './GenericWineBottle';
import EditableText from '../TextEditor/EditableText';
import { Camera, RotateCcw, X, Quote } from 'lucide-react';
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
  readOnly = false,
  theme = 'dark'
}) {
  const { t } = useTexts();
  const fileInputRef = useRef(null);
  const cardRef = useRef(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

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

  // 1. Color Parameters
  const colorHex = wineNote.color?.hex || '#5c133a';
  const colorName = wineNote.color?.name || 'Deep Ruby';
  const colorIntensity = wineNote.color?.intensity || 'Deep';

  // 2. Nose Parameters
  const noseIntensity = wineNote.nose?.intensity || 'Medium(+)';
  const noseIntensityClean = cleanIntensity(noseIntensity);
  const noseDevelopment = wineNote.nose?.development || 'Youthful';
  const rawAromas = wineNote.nose?.aromas?.length ? wineNote.nose.aromas : [
    'Blackberry',
    'Blackcurrant',
    'Vanilla',
    'Cedar'
  ];
  const userAromas = rawAromas
    .map(a => cleanText(a))
    .filter(Boolean)
    .slice(0, 4)
    .map(a => a.length > 28 ? a.slice(0, 28).trim() : a);

  // 3. Palate & Structural Parameters
  const bodyVal = wineNote.palate?.body || 'Medium(+)';
  const acidityVal = wineNote.palate?.acidity || 'Medium(+)';
  const tanninVal = wineNote.palate?.tannin || 'Medium(+)';
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

  // 4. Rating & VFM
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

        const updated = {
          ...wineNote,
          bottleImage: optimizedDataUrl,
          useGenericBottle: false
        };
        updateWineNote(updated);
      };

      img.onerror = () => {
        const updated = {
          ...wineNote,
          bottleImage: dataUrl,
          useGenericBottle: false
        };
        updateWineNote(updated);
      };

      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    const updated = {
      ...wineNote,
      bottleImage: null,
      useGenericBottle: true
    };
    updateWineNote(updated);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const setVfm = (newVfm) => {
    if (readOnly) return;
    const updated = { ...wineNote, vfm: newVfm };
    updateWineNote(updated);
  };

  const wineTypeClean = (wineNote.type || 'red').toLowerCase();

  return (
    <div className="verdict-wrapper">
      
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
            1. TOP HEADER BLOCK: IDENTITY, SPECS & ROSETTE MEDAL (As it is now)
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
            2. MAIN BODY: 3 COLUMNS
               Left (Col 1): Wine Bottle [0 - x]
               Middle (Col 2): Aromas List (just list, no headline) [x - y]
               Right (Col 3): [intensity, development, palate bars (no headline), key attributes (no headline)] [y - z]
           ---------------------------------------------------- */}
        <div 
          className="verdict-3col-body"
          style={{
            gridTemplateColumns: '40fr 30fr 30fr'
          }}
        >
          {/* COLUMN 1 (LEFT): WINE BOTTLE */}
          <div className="verdict-col verdict-col-bottle">
            <div className="verdict-bottle-frame">
              {bottleImage ? (
                <div 
                  className="custom-bottle-img-wrap"
                  onClick={() => {
                    if (!readOnly) setShowPhotoOptions(true);
                  }}
                  style={{ cursor: readOnly ? 'default' : 'pointer', width: '100%', height: '100%' }}
                  title={readOnly ? undefined : "Click to change photo or switch to default bottle"}
                >
                  <img src={bottleImage} alt="Wine Bottle" className="custom-bottle-img" />
                </div>
              ) : (
                <div 
                  className="generic-wine-bottle-wrap"
                  onClick={() => {
                    if (!readOnly) fileInputRef.current?.click();
                  }}
                  style={{ cursor: readOnly ? 'default' : 'pointer', position: 'relative', width: '100%', height: '100%' }}
                  title={readOnly ? undefined : "Click to take or upload bottle photo"}
                >
                  <GenericWineBottle
                    wineType={wineTypeClean}
                    wineColorHex={colorHex}
                    wineName={wineName}
                    vintage={vintage}
                    appellation={originStr}
                    alcohol={alcohol}
                  />
                  {!readOnly && (
                    <div className="default-bottle-photo-badge no-print" title="Upload Bottle Photo">
                      <Camera size={18} color="#d4af37" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2 (MIDDLE): AROMAS LIST (Just list, no headline) */}
          <div className="verdict-col verdict-col-aromas">
            <div className="verdict-aromas-list-clean font-serif">
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

          {/* COLUMN 3 (RIGHT): PALATE BARS, INTENSITY & DEVELOPMENT, KEY ATTRIBUTES */}
          <div className="verdict-col verdict-col-details font-serif">
            
            {/* 1. Palate Bars (Top of column 3, without headline) */}
            <div className="verdict-palate-bars-group">
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
                      style={{ left: `${Math.min(96, Math.max(4, getGaugePercent(bodyVal)))}%` }}
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
                      style={{ left: `${Math.min(96, Math.max(4, getGaugePercent(acidityVal)))}%` }}
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
                      style={{ left: `${Math.min(96, Math.max(4, getGaugePercent(tanninVal)))}%` }}
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
                </div>
              </div>
            </div>

            {/* 2. Intensity & Development (Below the bars, 1 in a row - development under intensity) */}
            <div className="verdict-palate-pillars-grid verdict-nose-pillars-grid">
              <div className="palate-pillar-item">
                <div className="pillar-header-row">
                  <span className="pillar-icon">👃</span>
                  <span className="pillar-label"><EditableText textKey="verdict.intensityLabel" defaultText="INTENSITY:" /></span>
                </div>
                <span className="pillar-val">{noseIntensityClean.toUpperCase()}</span>
              </div>
              <div className="palate-pillar-item">
                <div className="pillar-header-row">
                  <span className="pillar-icon">🌱</span>
                  <span className="pillar-label"><EditableText textKey="verdict.developmentLabel" defaultText="DEVELOPMENT:" /></span>
                </div>
                <span className="pillar-val">{cleanIntensity(noseDevelopment).toUpperCase()}</span>
              </div>
            </div>

            {/* 3. Key Attributes (Below intensity & development, 1 in a row) */}
            <div className="verdict-palate-pillars-grid verdict-key-pillars-grid">
              {/* Sweetness */}
              <div className="palate-pillar-item">
                <div className="pillar-header-row">
                  <span className="pillar-icon">💧</span>
                  <span className="pillar-label"><EditableText textKey="verdict.sweetnessTitle" defaultText="SWEETNESS:" /></span>
                </div>
                <span className="pillar-val">{sweetnessVal.toUpperCase()}</span>
              </div>

              {/* Alcohol */}
              <div className="palate-pillar-item">
                <div className="pillar-header-row">
                  <span className="pillar-icon">↗️</span>
                  <span className="pillar-label"><EditableText textKey="verdict.alcoholLevelTitle" defaultText="ALCOHOL:" /></span>
                </div>
                <span className="pillar-val">{cleanIntensity(alcoholLevelVal.split(' ')[0]).toUpperCase()}</span>
              </div>

              {/* Flavor */}
              <div className="palate-pillar-item">
                <div className="pillar-header-row">
                  <span className="pillar-icon">🍄</span>
                  <span className="pillar-label"><EditableText textKey="verdict.flavorTitle" defaultText="FLAVOR:" /></span>
                </div>
                <span className="pillar-val">{flavorIntensityVal.toUpperCase()}</span>
              </div>

              {/* Finish */}
              <div className="palate-pillar-item">
                <div className="pillar-header-row">
                  <span className="pillar-icon">⏱️</span>
                  <span className="pillar-label"><EditableText textKey="verdict.finishTitle" defaultText="FINISH:" /></span>
                </div>
                <span className="pillar-val">{formatFinishDisplay().toUpperCase()}</span>
              </div>
            </div>

          </div>
        </div>

        {/* ----------------------------------------------------
            3. SOMMELIER NOTES ROW (As it is now)
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
            4. BOTTOM VFM (VALUE FOR MONEY) - SHOW ONLY GLASSES (As it is now)
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

      {/* Photo Options Modal: Choose if retake photo or switch to default bottle */}
      {showPhotoOptions && (
        <div 
          className="modal-overlay no-print"
          style={{
            zIndex: 9999,
            background: 'rgba(5, 2, 8, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowPhotoOptions(false)}
        >
          <div 
            className="modal-content"
            style={{
              maxWidth: '340px',
              width: '100%',
              background: '#160d18',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '16px',
              padding: '22px 20px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--gold-primary)', fontFamily: 'Cinzel, serif', fontWeight: 700 }}>
                Bottle Photo
              </h3>
              <button 
                type="button" 
                className="btn btn-outline"
                style={{ padding: '4px', minWidth: '28px', height: '28px', borderRadius: '50%', justifyContent: 'center' }}
                onClick={() => setShowPhotoOptions(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{
                  padding: '12px 14px',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '0.9rem',
                  borderColor: 'var(--gold-primary)',
                  color: 'var(--gold-light)'
                }}
                onClick={() => {
                  setShowPhotoOptions(false);
                  fileInputRef.current?.click();
                }}
              >
                <Camera size={19} color="#d4af37" />
                <span>Retake / Change Photo</span>
              </button>

              <button
                type="button"
                className="btn btn-outline"
                style={{
                  padding: '12px 14px',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '0.9rem'
                }}
                onClick={() => {
                  setShowPhotoOptions(false);
                  handleRemovePhoto();
                }}
              >
                <RotateCcw size={18} />
                <span>Switch to Default Bottle</span>
              </button>

              <button
                type="button"
                className="btn btn-outline"
                style={{
                  padding: '8px 14px',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  opacity: 0.75,
                  marginTop: '4px'
                }}
                onClick={() => setShowPhotoOptions(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
