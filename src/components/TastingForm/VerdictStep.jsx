import React, { useState, useRef, useEffect } from 'react';
import GenericWineBottle from './GenericWineBottle';
import EditableText from '../TextEditor/EditableText';
import {
  Camera, RotateCcw, Quote, Sun, Moon, Share2, Loader2, Check,
  Sliders, Smartphone
} from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import { useTexts } from '../../context/TextContext';
import { pushLiveSync, subscribeLiveSync } from '../../utils/liveSync';

const STORAGE_SPLIT_CONFIG_KEY = 'winitis_summary_split_config_v1';
const DEFAULT_SPLIT_CONFIG = { x: 24, y: 52 };

const getInitialSplitConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_SPLIT_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved split config:', e);
  }
  return DEFAULT_SPLIT_CONFIG;
};

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
  readOnly = false
}) {
  const { t } = useTexts();
  const fileInputRef = useRef(null);
  const cardRef = useRef(null);

  const [theme, setTheme] = useState('parchment'); // 'parchment' | 'dark'
  const [isSharingPhoto, setIsSharingPhoto] = useState(false);
  const [shareSuccessFlash, setShareSuccessFlash] = useState(false);

  // 3-Column Split Configuration: x = boundary 1 (Col 1 ↔ Col 2), y = boundary 2 (Col 2 ↔ Col 3)
  // [0 - x] = Col 1, [x - y] = Col 2, [y - z] = Col 3 where z = 100% (fixed)
  const [splitConfig, setSplitConfig] = useState(() => getInitialSplitConfig());

  // Subscribe to live sync events from iPhone or PC
  useEffect(() => {
    const unsubscribe = subscribeLiveSync((syncData) => {
      if (syncData.splitConfig) {
        setSplitConfig(syncData.splitConfig);
        try {
          localStorage.setItem(STORAGE_SPLIT_CONFIG_KEY, JSON.stringify(syncData.splitConfig));
        } catch (e) {}
      }
      if (syncData.theme) {
        setTheme(syncData.theme);
      }
      if (syncData.wineNote && updateWineNote) {
        updateWineNote(prev => ({
          ...prev,
          ...syncData.wineNote
        }));
      }
    });
    return unsubscribe;
  }, []);

  const updateSplit = (newSplit) => {
    setSplitConfig(newSplit);
    try {
      localStorage.setItem(STORAGE_SPLIT_CONFIG_KEY, JSON.stringify(newSplit));
    } catch (e) {
      console.warn('Failed to save split config:', e);
    }
    pushLiveSync({
      splitConfig: newSplit,
      wineNote,
      theme,
      step: 4
    });
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'parchment' ? 'dark' : 'parchment';
    setTheme(nextTheme);
    pushLiveSync({
      splitConfig,
      wineNote,
      theme: nextTheme,
      step: 4
    });
  };

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
        pushLiveSync({
          splitConfig,
          wineNote: updated,
          theme,
          step: 4
        });
      };

      img.onerror = () => {
        const updated = {
          ...wineNote,
          bottleImage: dataUrl,
          useGenericBottle: false
        };
        updateWineNote(updated);
        pushLiveSync({
          splitConfig,
          wineNote: updated,
          theme,
          step: 4
        });
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
    pushLiveSync({
      splitConfig,
      wineNote: updated,
      theme,
      step: 4
    });
  };

  const setVfm = (newVfm) => {
    if (readOnly) return;
    const updated = { ...wineNote, vfm: newVfm };
    updateWineNote(updated);
    pushLiveSync({
      splitConfig,
      wineNote: updated,
      theme,
      step: 4
    });
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
      console.warn('Navigator share failed, trying PNG download fallback:', err);
      if (cardRef.current) {
        try {
          const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
          const safeName = (wineName || 'wine').replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const fileName = `${safeName}_verdict.png`;
          const link = document.createElement('a');
          link.download = fileName;
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

  const wineTypeClean = (wineNote.type || 'red').toLowerCase();

  // Column widths calculations
  const col1Width = splitConfig.x;
  const col2Width = splitConfig.y - splitConfig.x;
  const col3Width = 100 - splitConfig.y;

  return (
    <div className="verdict-wrapper">
      
      {/* Top Toolbar Controls: Theme Toggle, Bottle Photo Actions, Share, Live Sync */}
      <div className="verdict-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Day / Night Theme Single Toggle Button */}
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '8px 10px', minWidth: '38px', height: '36px', justifyContent: 'center' }}
            onClick={handleToggleTheme}
            title={theme === 'parchment' ? 'Switch to Dark Theme' : 'Switch to Day / Parchment Theme'}
            aria-label="Toggle Day / Night theme"
          >
            {theme === 'parchment' ? <Sun size={18} color="#d4af37" /> : <Moon size={18} color="#d4af37" />}
          </button>

          {/* Separator */}
          <div style={{ width: '1px', height: '20px', background: 'rgba(212, 175, 55, 0.25)', margin: '0 2px' }} />

          {/* Bottle Photo Controls */}
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

          {/* Share Summary as Photo Button */}
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

          {/* Real-time Live Sync Indicator Badge */}
          <div
            className="live-sync-badge no-print"
            title="Real-time live sync: column split adjustments reflect immediately on iPhone"
          >
            <span className="live-sync-dot" />
            <Smartphone size={13} color="#4ade80" />
            <span className="live-sync-text">Live Sync</span>
          </div>

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
            gridTemplateColumns: `${col1Width}% ${col2Width}% ${col3Width}%`
          }}
        >
          {/* COLUMN 1 (LEFT): WINE BOTTLE */}
          <div className="verdict-col verdict-col-bottle">
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

          {/* COLUMN 3 (RIGHT): INTENSITY, DEVELOPMENT, PALATE BARS (NO HEADLINE), KEY ATTRIBUTES (NO HEADLINE) */}
          <div className="verdict-col verdict-col-details font-serif">
            
            {/* 1. Intensity & Development Strip */}
            <div className="verdict-nose-meta-strip font-serif">
              <div className="meta-line">
                <span className="meta-label"><EditableText textKey="verdict.intensityLabel" defaultText="INTENSITY:" /></span>{' '}
                <strong className="meta-val">{noseIntensityClean.toUpperCase()}</strong>
              </div>
              <div className="meta-divider-bullet">•</div>
              <div className="meta-line">
                <span className="meta-label"><EditableText textKey="verdict.developmentLabel" defaultText="DEVELOPMENT:" /></span>{' '}
                <strong className="meta-val">{cleanIntensity(noseDevelopment).toUpperCase()}</strong>
              </div>
            </div>

            {/* 2. Palate Bars (Without headline) */}
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
                </div>
              </div>
            </div>

            {/* 3. Key Attributes (Without headline) - 2x2 Pillars Grid */}
            <div className="verdict-palate-pillars-grid">
              {/* Sweetness */}
              <div className="palate-pillar-item">
                <div className="pillar-header-row">
                  <span className="pillar-label"><EditableText textKey="verdict.sweetnessTitle" defaultText="SWEETNESS:" /></span>
                  <span className="pillar-icon">💧</span>
                </div>
                <span className="pillar-val">{sweetnessVal.toUpperCase()}</span>
              </div>

              {/* Alcohol */}
              <div className="palate-pillar-item">
                <div className="pillar-header-row">
                  <span className="pillar-label"><EditableText textKey="verdict.alcoholLevelTitle" defaultText="ALCOHOL:" /></span>
                  <span className="pillar-icon">↗️</span>
                </div>
                <span className="pillar-val">{cleanIntensity(alcoholLevelVal.split(' ')[0]).toUpperCase()}</span>
              </div>

              {/* Flavor */}
              <div className="palate-pillar-item">
                <div className="pillar-header-row">
                  <span className="pillar-label"><EditableText textKey="verdict.flavorTitle" defaultText="FLAVOR:" /></span>
                  <span className="pillar-icon">🍄</span>
                </div>
                <span className="pillar-val">{flavorIntensityVal.toUpperCase()}</span>
              </div>

              {/* Finish */}
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

        {/* Thin Divider Line */}
        <div className="verdict-divider-line" />

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

      {/* ==========================================================
          COLUMN WIDTH SPLITTER & CONTROLLER ([0-x, x-y, y-z])
          Expose x, y below main container (z is fixed, z-y-x=0)
         ========================================================== */}
      {!readOnly && (
        <div className="column-split-controller no-print">
          <div className="split-controller-header">
          <div className="split-header-title-wrap">
            <Sliders size={16} color="#d4af37" />
            <span className="split-controller-title">Column Widths</span>
          </div>

          {/* List the width of the columns [0-x, x-y, y-z] */}
          <div className="split-intervals-list">
            <div className="split-interval-tag tag-col1">
              <span className="interval-range">[0 → x]</span>
              <span className="interval-label">Col 1 (Bottle):</span>
              <strong className="interval-val">{splitConfig.x}%</strong>
            </div>
            <div className="split-interval-tag tag-col2">
              <span className="interval-range">[x → y]</span>
              <span className="interval-label">Col 2 (Aromas):</span>
              <strong className="interval-val">{col2Width}%</strong>
            </div>
            <div className="split-interval-tag tag-col3">
              <span className="interval-range">[y → z]</span>
              <span className="interval-label">Col 3 (Details):</span>
              <strong className="interval-val">{col3Width}%</strong>
            </div>
            <div className="split-interval-tag tag-fixed">
              <span className="interval-range">Fixed Total</span>
              <span className="interval-label">z = 100%</span>
            </div>
          </div>
        </div>

        {/* Adjust x and y sliders */}
        <div className="split-sliders-row">
          {/* X Control */}
          <div className="split-control-group">
            <div className="split-control-header">
              <span className="split-param-label">
                Boundary <strong>x</strong> (Col 1 ↔ Col 2):
              </span>
              <span className="split-badge-num">x = {splitConfig.x}%</span>
            </div>
            <div className="split-slider-actions">
              <button
                type="button"
                className="btn-split-step"
                onClick={() => updateSplit({ ...splitConfig, x: Math.max(10, splitConfig.x - 1) })}
                disabled={splitConfig.x <= 10}
                title="Decrease x by 1%"
              >
                -1%
              </button>
              <input
                type="range"
                min="10"
                max={splitConfig.y - 5}
                step="1"
                value={splitConfig.x}
                onChange={(e) => updateSplit({ ...splitConfig, x: Number(e.target.value) })}
                className="split-slider-input"
              />
              <button
                type="button"
                className="btn-split-step"
                onClick={() => updateSplit({ ...splitConfig, x: Math.min(splitConfig.y - 5, splitConfig.x + 1) })}
                disabled={splitConfig.x >= splitConfig.y - 5}
                title="Increase x by 1%"
              >
                +1%
              </button>
            </div>
          </div>

          {/* Y Control */}
          <div className="split-control-group">
            <div className="split-control-header">
              <span className="split-param-label">
                Boundary <strong>y</strong> (Col 2 ↔ Col 3):
              </span>
              <span className="split-badge-num">y = {splitConfig.y}%</span>
            </div>
            <div className="split-slider-actions">
              <button
                type="button"
                className="btn-split-step"
                onClick={() => updateSplit({ ...splitConfig, y: Math.max(splitConfig.x + 5, splitConfig.y - 1) })}
                disabled={splitConfig.y <= splitConfig.x + 5}
                title="Decrease y by 1%"
              >
                -1%
              </button>
              <input
                type="range"
                min={splitConfig.x + 5}
                max="90"
                step="1"
                value={splitConfig.y}
                onChange={(e) => updateSplit({ ...splitConfig, y: Number(e.target.value) })}
                className="split-slider-input"
              />
              <button
                type="button"
                className="btn-split-step"
                onClick={() => updateSplit({ ...splitConfig, y: Math.min(90, splitConfig.y + 1) })}
                disabled={splitConfig.y >= 90}
                title="Increase y by 1%"
              >
                +1%
              </button>
            </div>
          </div>
        </div>

        {/* Presets and Reset */}
        <div className="split-presets-bar">
          <span className="presets-title">Presets:</span>
          <button
            type="button"
            className={`preset-btn ${splitConfig.x === 24 && splitConfig.y === 52 ? 'active' : ''}`}
            onClick={() => updateSplit({ x: 24, y: 52 })}
          >
            Default [24% | 28% | 48%]
          </button>
          <button
            type="button"
            className={`preset-btn ${splitConfig.x === 20 && splitConfig.y === 50 ? 'active' : ''}`}
            onClick={() => updateSplit({ x: 20, y: 50 })}
          >
            Narrow Bottle [20% | 30% | 50%]
          </button>
          <button
            type="button"
            className={`preset-btn ${splitConfig.x === 28 && splitConfig.y === 58 ? 'active' : ''}`}
            onClick={() => updateSplit({ x: 28, y: 58 })}
          >
            Wide Bottle [28% | 30% | 42%]
          </button>
          <button
            type="button"
            className="preset-btn btn-reset-split"
            onClick={() => updateSplit(DEFAULT_SPLIT_CONFIG)}
            title="Reset to default x=24%, y=52%"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>
      )}

    </div>
  );
}
