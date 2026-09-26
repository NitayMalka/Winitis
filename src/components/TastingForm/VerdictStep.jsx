import React, { useState, useRef } from 'react';
import GenericWineBottle from './GenericWineBottle';
import EditableText from '../TextEditor/EditableText';
import { Camera, RotateCcw, Quote, Sun, Moon, Share2, Loader2, Check, Sliders, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Eye, X } from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import { useTexts } from '../../context/TextContext';

// Default layout configuration
const DEFAULT_LAYOUT = {
  bottlePosition: 'left', // 'left' | 'right'
  tastingSectionsOrder: ['profileNotes', 'palate', 'keyAttributes'],
  profileNotesOrder: ['profile', 'nose'],
  palateGaugesOrder: ['body', 'acidity', 'tannins'],
  keyAttributesOrder: ['pillars', 'pairings'],
  notesGlassesOrder: ['notes', 'glasses'],
  scales: {
    wineTitle: 1,
    specs: 1,
    medal: 1,
    bottle: 1,
    profile: 1,
    nose: 1,
    palate: 1,
    body: 1,
    acidity: 1,
    tannins: 1,
    attrBar: 1,
    pillars: 1,
    pairings: 1,
    notes: 1,
    glasses: 1,
    vfmBar: 1
  },
  hidden: {}
};

const ITEM_LABELS = {
  wineTitle: 'Wine Title',
  specs: 'Vintage & Specs',
  medal: 'Rosette Medal',
  bottle: 'Wine Bottle',
  profileNotes: 'Profile & Tasting Notes',
  profile: 'Profile Info',
  nose: 'Nose & Aromas',
  palate: 'Palate & Structure',
  body: 'Body Gauge',
  acidity: 'Acidity Gauge',
  tannins: 'Tannins Gauge',
  attrBar: 'Attributes Color Bar',
  keyAttributes: 'Key Attributes Block',
  pillars: '4 Palate Pillars',
  pairings: 'Food Pairings',
  notesRow: "Notes & Glasses Row",
  notes: "Sommelier's Notes",
  glasses: '5 Wine Glasses',
  vfmBar: 'VFM Footer Bar'
};

const STORAGE_LAYOUT_KEY = 'winitis_verdict_custom_layout_v2';

const getInitialLayout = (note) => {
  if (note?.customLayout && typeof note.customLayout === 'object' && Object.keys(note.customLayout).length > 0) {
    return { ...DEFAULT_LAYOUT, ...note.customLayout };
  }
  try {
    const saved = localStorage.getItem(STORAGE_LAYOUT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_LAYOUT, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse saved layout:', e);
  }
  return DEFAULT_LAYOUT;
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

  // Custom Interactive Layout State
  const [layout, setLayout] = useState(() => getInitialLayout(wineNote));
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [showRestoreMenu, setShowRestoreMenu] = useState(false);

  const saveLayout = (newLayout) => {
    setLayout(newLayout);
    try {
      localStorage.setItem(STORAGE_LAYOUT_KEY, JSON.stringify(newLayout));
    } catch (e) {
      console.warn('Failed to save layout to localStorage:', e);
    }
    if (updateWineNote) {
      updateWineNote({
        ...wineNote,
        customLayout: newLayout
      });
    }
  };

  const handleResize = (delta) => {
    if (!selectedItemId) return;
    const currentScale = layout.scales?.[selectedItemId] ?? 1;
    const newScale = Math.max(0.6, Math.min(1.5, Math.round((currentScale + delta) * 10) / 10));
    saveLayout({
      ...layout,
      scales: {
        ...(layout.scales || {}),
        [selectedItemId]: newScale
      }
    });
  };

  const swapInArray = (arr, fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= arr.length) return arr;
    const copy = [...arr];
    const temp = copy[fromIdx];
    copy[fromIdx] = copy[toIdx];
    copy[toIdx] = temp;
    return copy;
  };

  const handleMove = (direction) => {
    if (!selectedItemId) return;
    const id = selectedItemId;

    if (id === 'bottle') {
      saveLayout({
        ...layout,
        bottlePosition: layout.bottlePosition === 'left' ? 'right' : 'left'
      });
      return;
    }

    if (['profileNotes', 'palate', 'keyAttributes'].includes(id)) {
      const arr = layout.tastingSectionsOrder || ['profileNotes', 'palate', 'keyAttributes'];
      const idx = arr.indexOf(id);
      const targetIdx = direction === 'prev' || direction === 'up' ? idx - 1 : idx + 1;
      saveLayout({
        ...layout,
        tastingSectionsOrder: swapInArray(arr, idx, targetIdx)
      });
      return;
    }

    if (['profile', 'nose'].includes(id)) {
      const arr = layout.profileNotesOrder || ['profile', 'nose'];
      const idx = arr.indexOf(id);
      const targetIdx = direction === 'prev' || direction === 'left' ? idx - 1 : idx + 1;
      saveLayout({
        ...layout,
        profileNotesOrder: swapInArray(arr, idx, targetIdx)
      });
      return;
    }

    if (['body', 'acidity', 'tannins'].includes(id)) {
      const arr = layout.palateGaugesOrder || ['body', 'acidity', 'tannins'];
      const idx = arr.indexOf(id);
      const targetIdx = direction === 'prev' || direction === 'up' ? idx - 1 : idx + 1;
      saveLayout({
        ...layout,
        palateGaugesOrder: swapInArray(arr, idx, targetIdx)
      });
      return;
    }

    if (['pillars', 'pairings'].includes(id)) {
      const arr = layout.keyAttributesOrder || ['pillars', 'pairings'];
      const idx = arr.indexOf(id);
      const targetIdx = direction === 'prev' || direction === 'left' ? idx - 1 : idx + 1;
      saveLayout({
        ...layout,
        keyAttributesOrder: swapInArray(arr, idx, targetIdx)
      });
      return;
    }

    if (['notes', 'glasses'].includes(id)) {
      const arr = layout.notesGlassesOrder || ['notes', 'glasses'];
      const idx = arr.indexOf(id);
      const targetIdx = direction === 'prev' || direction === 'left' ? idx - 1 : idx + 1;
      saveLayout({
        ...layout,
        notesGlassesOrder: swapInArray(arr, idx, targetIdx)
      });
      return;
    }
  };

  const getMoveConfig = (id) => {
    if (!id) return null;
    if (id === 'bottle') {
      return {
        type: 'horizontal',
        canMovePrev: layout.bottlePosition === 'right',
        canMoveNext: layout.bottlePosition === 'left',
        prevTitle: 'Move Left',
        nextTitle: 'Move Right'
      };
    }
    if (['profileNotes', 'palate', 'keyAttributes'].includes(id)) {
      const arr = layout.tastingSectionsOrder || ['profileNotes', 'palate', 'keyAttributes'];
      const idx = arr.indexOf(id);
      return {
        type: 'vertical',
        canMovePrev: idx > 0,
        canMoveNext: idx < arr.length - 1,
        prevTitle: 'Move Up',
        nextTitle: 'Move Down'
      };
    }
    if (['profile', 'nose'].includes(id)) {
      const arr = layout.profileNotesOrder || ['profile', 'nose'];
      const idx = arr.indexOf(id);
      return {
        type: 'horizontal',
        canMovePrev: idx > 0,
        canMoveNext: idx < arr.length - 1,
        prevTitle: 'Move Left',
        nextTitle: 'Move Right'
      };
    }
    if (['body', 'acidity', 'tannins'].includes(id)) {
      const arr = layout.palateGaugesOrder || ['body', 'acidity', 'tannins'];
      const idx = arr.indexOf(id);
      return {
        type: 'vertical',
        canMovePrev: idx > 0,
        canMoveNext: idx < arr.length - 1,
        prevTitle: 'Move Up',
        nextTitle: 'Move Down'
      };
    }
    if (['pillars', 'pairings'].includes(id)) {
      const arr = layout.keyAttributesOrder || ['pillars', 'pairings'];
      const idx = arr.indexOf(id);
      return {
        type: 'horizontal',
        canMovePrev: idx > 0,
        canMoveNext: idx < arr.length - 1,
        prevTitle: 'Move Left',
        nextTitle: 'Move Right'
      };
    }
    if (['notes', 'glasses'].includes(id)) {
      const arr = layout.notesGlassesOrder || ['notes', 'glasses'];
      const idx = arr.indexOf(id);
      return {
        type: 'horizontal',
        canMovePrev: idx > 0,
        canMoveNext: idx < arr.length - 1,
        prevTitle: 'Move Left',
        nextTitle: 'Move Right'
      };
    }
    return null;
  };

  const handleRemove = (id = selectedItemId) => {
    if (!id) return;
    saveLayout({
      ...layout,
      hidden: {
        ...(layout.hidden || {}),
        [id]: true
      }
    });
    setSelectedItemId(null);
  };

  const handleRestore = (id) => {
    const updatedHidden = { ...(layout.hidden || {}) };
    delete updatedHidden[id];
    saveLayout({
      ...layout,
      hidden: updatedHidden
    });
  };

  const handleResetLayout = () => {
    saveLayout(DEFAULT_LAYOUT);
    setSelectedItemId(null);
  };

  const getItemClass = (id, extraClasses = '') => {
    const classes = [extraClasses];
    if (isEditMode) {
      classes.push('verdict-item-editable');
      if (selectedItemId === id) {
        classes.push('verdict-item-selected');
      }
    }
    return classes.filter(Boolean).join(' ');
  };

  const getItemStyle = (id, baseStyle = {}) => {
    const scale = layout.scales?.[id] ?? 1;
    if (scale !== 1) {
      return {
        ...baseStyle,
        zoom: scale
      };
    }
    return baseStyle;
  };

  const handleItemClick = (e, id) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setSelectedItemId(prev => prev === id ? null : id);
  };

  const hiddenItemIds = Object.keys(layout.hidden || {}).filter(k => layout.hidden[k]);

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
    { icon: '🐟', label: 'Grilled Salmon' },
    { icon: '🧀', label: 'Goat Cheese' },
    { icon: '🍗', label: 'Roasted Poultry' }
  ] : [
    { icon: '🥩', label: 'Ribeye Steak' },
    { icon: '🧀', label: 'Aged Cheddar' },
    { icon: '🍖', label: 'Lamb Shanks' }
  ];

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

          {/* Separator */}
          {!readOnly && (
            <div style={{ width: '1px', height: '20px', background: 'rgba(212, 175, 55, 0.25)', margin: '0 2px' }} />
          )}

          {/* Edit Layout Toggle Button */}
          {!readOnly && (
            <button
              type="button"
              className={`btn ${isEditMode ? 'btn-primary' : 'btn-outline'}`}
              style={{
                padding: '8px 12px',
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '0.8rem',
                borderColor: isEditMode ? 'var(--gold-primary)' : undefined
              }}
              onClick={() => {
                if (isEditMode) {
                  setSelectedItemId(null);
                  setIsEditMode(false);
                } else {
                  setIsEditMode(true);
                }
              }}
              title={isEditMode ? "Finish editing layout" : "Customize & Edit Layout"}
            >
              <Sliders size={16} />
              <span>{isEditMode ? "Done" : "Edit Layout"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Edit Mode Instruction Banner */}
      {isEditMode && (
        <div className="verdict-edit-mode-banner no-print">
          <div className="edit-banner-info">
            <span className="edit-banner-dot" />
            <span>Tap any item on the card to <strong>resize</strong>, <strong>relocate</strong>, or <strong>remove</strong> it.</span>
          </div>
          <div className="edit-banner-actions">
            {hiddenItemIds.length > 0 && (
              <button
                type="button"
                className="edit-banner-btn"
                onClick={() => setShowRestoreMenu(prev => !prev)}
                title="Restore hidden components"
              >
                <Eye size={14} />
                <span>Restore ({hiddenItemIds.length})</span>
              </button>
            )}
            <button
              type="button"
              className="edit-banner-btn"
              onClick={handleResetLayout}
              title="Reset layout to default"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              className="edit-banner-btn edit-banner-btn-done"
              onClick={() => {
                setSelectedItemId(null);
                setIsEditMode(false);
              }}
            >
              <Check size={14} />
              <span>Done</span>
            </button>
          </div>

          {/* Restore Hidden Items Popover */}
          {showRestoreMenu && hiddenItemIds.length > 0 && (
            <div className="verdict-restore-popover">
              <div className="restore-popover-title">Hidden Components:</div>
              <div className="restore-popover-list">
                {hiddenItemIds.map(hiddenId => (
                  <button
                    key={hiddenId}
                    type="button"
                    className="restore-popover-item"
                    onClick={() => handleRestore(hiddenId)}
                  >
                    <span>{ITEM_LABELS[hiddenId] || hiddenId}</span>
                    <span className="restore-popover-badge">+ Restore</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Bar for Selected Item */}
      {isEditMode && selectedItemId && (
        <div className="verdict-edit-action-bar no-print">
          <div className="action-bar-label">
            <span className="action-bar-item-name">
              {ITEM_LABELS[selectedItemId] || selectedItemId}
            </span>
          </div>

          <div className="action-bar-separator" />

          {/* Scale / Resize Controls */}
          <div className="action-bar-group" title="Resize component">
            <span className="action-group-label">Size:</span>
            <button
              type="button"
              className="action-bar-btn"
              onClick={() => handleResize(-0.1)}
              disabled={(layout.scales?.[selectedItemId] ?? 1) <= 0.6}
              title="Scale down"
            >
              A-
            </button>
            <span className="action-bar-scale-val">
              {Math.round((layout.scales?.[selectedItemId] ?? 1) * 100)}%
            </span>
            <button
              type="button"
              className="action-bar-btn"
              onClick={() => handleResize(0.1)}
              disabled={(layout.scales?.[selectedItemId] ?? 1) >= 1.5}
              title="Scale up"
            >
              A+
            </button>
          </div>

          {/* Relocate Controls */}
          {(() => {
            const moveConfig = getMoveConfig(selectedItemId);
            if (!moveConfig) return null;
            return (
              <>
                <div className="action-bar-separator" />
                <div className="action-bar-group" title="Relocate component">
                  <span className="action-group-label">Move:</span>
                  <button
                    type="button"
                    className="action-bar-btn"
                    onClick={() => handleMove('prev')}
                    disabled={!moveConfig.canMovePrev}
                    title={moveConfig.prevTitle}
                  >
                    {moveConfig.type === 'vertical' ? <ArrowUp size={15} /> : <ArrowLeft size={15} />}
                  </button>
                  <button
                    type="button"
                    className="action-bar-btn"
                    onClick={() => handleMove('next')}
                    disabled={!moveConfig.canMoveNext}
                    title={moveConfig.nextTitle}
                  >
                    {moveConfig.type === 'vertical' ? <ArrowDown size={15} /> : <ArrowRight size={15} />}
                  </button>
                </div>
              </>
            );
          })()}

          <div className="action-bar-separator" />

          {/* Remove Control */}
          <button
            type="button"
            className="action-bar-btn action-bar-btn-danger"
            onClick={() => handleRemove(selectedItemId)}
            title="Remove from layout"
          >
            <Trash2 size={15} />
            <span>Remove</span>
          </button>

          {/* Deselect / Close button */}
          <button
            type="button"
            className="action-bar-btn action-bar-btn-close"
            onClick={() => setSelectedItemId(null)}
            title="Close selection"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ==========================================================
          THE 700PX ONE-SCREEN VERDICT SUMMARY CARD
         ========================================================== */}
      <div
        ref={cardRef}
        className={`verdict-card ${theme === 'dark' ? 'theme-dark' : 'theme-parchment'} ${isEditMode ? 'editing-mode' : ''}`}
        onClick={() => isEditMode && setSelectedItemId(null)}
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
        {(!layout.hidden?.wineTitle || !layout.hidden?.specs || !layout.hidden?.medal) && (
          <div className="verdict-header-row">
            
            {/* Left: Wine Title & Compact Specs */}
            <div className="verdict-header-left">
              {!layout.hidden?.wineTitle && (
                <h1
                  className={getItemClass('wineTitle', 'verdict-wine-title font-serif')}
                  style={getItemStyle('wineTitle')}
                  onClick={(e) => handleItemClick(e, 'wineTitle')}
                  title={isEditMode ? "Click to edit Wine Title" : undefined}
                >
                  {wineName}
                </h1>
              )}
              {!layout.hidden?.specs && (
                <div
                  className={getItemClass('specs', 'verdict-wine-specs font-serif')}
                  style={getItemStyle('specs')}
                  onClick={(e) => handleItemClick(e, 'specs')}
                  title={isEditMode ? "Click to edit Specs" : undefined}
                >
                  <span className="spec-item spec-vintage-origin">
                    {vintage} VINTAGE | {originStr.toUpperCase()}
                  </span>
                  <span className="spec-badge-item">
                    <span className="spec-mini-circle">%</span>
                    <span className="spec-label"><EditableText textKey="verdict.alcoholLabel" defaultText="ALCOHOL:" /></span>{' '}
                    <span className="spec-value">{alcohol.includes('%') ? alcohol : `${alcohol}%`}</span>
                  </span>
                  <span className="spec-badge-item">
                    <span className="spec-mini-circle">$</span>
                    <span className="spec-label"><EditableText textKey="verdict.priceLabel" defaultText="PRICE:" /></span>{' '}
                    <span className="spec-value verdict-price-tag">{price}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Center/Right: Rosette Gold Medal Stamp (Points Score) */}
            {!layout.hidden?.medal && (
              <div
                className={getItemClass('medal', 'verdict-medal-wrap')}
                style={getItemStyle('medal')}
                onClick={(e) => handleItemClick(e, 'medal')}
                title={isEditMode ? "Click to edit Medal" : undefined}
              >
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
            )}

          </div>
        )}

        {/* Thin Divider Line */}
        {(!layout.hidden?.wineTitle || !layout.hidden?.specs || !layout.hidden?.medal) && (
          <div className="verdict-divider-line" />
        )}

        {/* ----------------------------------------------------
            2. MAIN BODY GRID: BOTTLE + TASTING DATA
           ---------------------------------------------------- */}
        {(!layout.hidden?.bottle || !layout.hidden?.profileNotes || !layout.hidden?.palate || !layout.hidden?.keyAttributes) && (
          <div
            className="verdict-body-grid"
            style={{
              gridTemplateColumns: layout.hidden?.bottle
                ? '1fr'
                : layout.bottlePosition === 'right'
                  ? '1fr 140px'
                  : '140px 1fr'
            }}
          >
            {/* Render Bottle First if bottlePosition is left */}
            {layout.bottlePosition !== 'right' && !layout.hidden?.bottle && (
              <div
                className={getItemClass('bottle', 'verdict-bottle-column')}
                style={getItemStyle('bottle')}
                onClick={(e) => handleItemClick(e, 'bottle')}
                title={isEditMode ? "Click to edit Bottle" : undefined}
              >
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
            )}

            {/* COLUMN: TASTING DATA & SECTIONS */}
            {(!layout.hidden?.profileNotes || !layout.hidden?.palate || !layout.hidden?.keyAttributes) && (
              <div className="verdict-tasting-content">
                {(layout.tastingSectionsOrder || ['profileNotes', 'palate', 'keyAttributes']).map((sectionKey, sIdx, allSecs) => {
                  if (sectionKey === 'profileNotes') {
                    if (layout.hidden?.profileNotes) return null;
                    const hideProfile = layout.hidden?.profile;
                    const hideNose = layout.hidden?.nose;
                    if (hideProfile && hideNose) return null;

                    const pNotesOrder = layout.profileNotesOrder || ['profile', 'nose'];

                    return (
                      <React.Fragment key="profileNotes">
                        <div
                          className={getItemClass('profileNotes', 'verdict-profile-notes-row')}
                          style={getItemStyle('profileNotes', {
                            gridTemplateColumns: (hideProfile || hideNose) ? '1fr' : '1fr 1fr'
                          })}
                          onClick={(e) => handleItemClick(e, 'profileNotes')}
                          title={isEditMode ? "Click to edit Profile & Notes Section" : undefined}
                        >
                          {pNotesOrder.map(itemKey => {
                            if (itemKey === 'profile' && !hideProfile) {
                              return (
                                <div
                                  key="profile"
                                  className={getItemClass('profile', 'verdict-profile-col font-serif')}
                                  style={getItemStyle('profile')}
                                  onClick={(e) => handleItemClick(e, 'profile')}
                                  title={isEditMode ? "Click to edit Profile" : undefined}
                                >
                                  <h3 className="verdict-section-heading">
                                    <EditableText textKey="verdict.profileTitle" defaultText="PROFILE" />
                                  </h3>
                                  <div className="verdict-profile-list">
                                    <div className="profile-item">
                                      <span className="profile-icon">📅</span>
                                      <div className="profile-text">
                                        <span className="profile-label"><EditableText textKey="verdict.vintageLabel" defaultText="VINTAGE:" /></span>
                                        <strong className="profile-val">{vintage}</strong>
                                      </div>
                                    </div>
                                    <div className="profile-item">
                                      <span className="profile-icon">📍</span>
                                      <div className="profile-text">
                                        <span className="profile-label"><EditableText textKey="verdict.appellationLabel" defaultText="APPELLATION:" /></span>
                                        <strong className="profile-val">{originStr.toUpperCase()}</strong>
                                      </div>
                                    </div>
                                    <div className="profile-item">
                                      <span className="profile-icon">🏞️</span>
                                      <div className="profile-text">
                                        <span className="profile-label"><EditableText textKey="verdict.styleLabel" defaultText="STYLE:" /></span>
                                        <strong className="profile-val">{grape.toUpperCase()}</strong>
                                      </div>
                                    </div>
                                    <div className="profile-item">
                                      <span className="profile-icon">🍷</span>
                                      <div className="profile-text">
                                        <span className="profile-label"><EditableText textKey="verdict.alcoholLabel" defaultText="ALCOHOL:" /></span>
                                        <strong className="profile-val">{alcohol.includes('%') ? alcohol : `${alcohol}%`}</strong>
                                      </div>
                                    </div>
                                    <div className="profile-item">
                                      <span className="profile-icon">🏷️</span>
                                      <div className="profile-text">
                                        <span className="profile-label"><EditableText textKey="verdict.priceLabel" defaultText="PRICE:" /></span>
                                        <strong className="profile-val">{price}</strong>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            if (itemKey === 'nose' && !hideNose) {
                              return (
                                <div
                                  key="nose"
                                  className={getItemClass('nose', 'verdict-nose-col font-serif')}
                                  style={getItemStyle('nose')}
                                  onClick={(e) => handleItemClick(e, 'nose')}
                                  title={isEditMode ? "Click to edit Nose & Aromas" : undefined}
                                >
                                  <h3 className="verdict-section-heading">
                                    <EditableText textKey="verdict.tastingNotesTitle" defaultText="TASTING NOTES" />
                                  </h3>
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
                              );
                            }
                            return null;
                          })}
                        </div>
                        {sIdx < allSecs.length - 1 && <div className="verdict-inner-divider" />}
                      </React.Fragment>
                    );
                  }

                  if (sectionKey === 'palate') {
                    if (layout.hidden?.palate) return null;
                    const gaugesOrder = layout.palateGaugesOrder || ['body', 'acidity', 'tannins'];

                    return (
                      <React.Fragment key="palate">
                        <div
                          className={getItemClass('palate', 'verdict-palate-block font-serif')}
                          style={getItemStyle('palate')}
                          onClick={(e) => handleItemClick(e, 'palate')}
                          title={isEditMode ? "Click to edit Palate Block" : undefined}
                        >
                          <h3 className="verdict-section-heading" style={{ marginBottom: '6px' }}>
                            <EditableText textKey="palate.title" defaultText="PALATE & STRUCTURE" />
                          </h3>

                          {gaugesOrder.map(gaugeId => {
                            if (gaugeId === 'body' && !layout.hidden?.body) {
                              return (
                                <div
                                  key="body"
                                  className={getItemClass('body', 'verdict-gauge-row')}
                                  style={getItemStyle('body')}
                                  onClick={(e) => handleItemClick(e, 'body')}
                                  title={isEditMode ? "Click to edit Body Gauge" : undefined}
                                >
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
                              );
                            }

                            if (gaugeId === 'acidity' && !layout.hidden?.acidity) {
                              return (
                                <div
                                  key="acidity"
                                  className={getItemClass('acidity', 'verdict-gauge-row')}
                                  style={getItemStyle('acidity')}
                                  onClick={(e) => handleItemClick(e, 'acidity')}
                                  title={isEditMode ? "Click to edit Acidity Gauge" : undefined}
                                >
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
                                      <strong>{acidityClean.toUpperCase()}</strong> • <span>{getStructureSubtitle('acidity', acidityVal).toUpperCase()}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            if (gaugeId === 'tannins' && !layout.hidden?.tannins) {
                              return (
                                <div
                                  key="tannins"
                                  className={getItemClass('tannins', 'verdict-gauge-row')}
                                  style={getItemStyle('tannins')}
                                  onClick={(e) => handleItemClick(e, 'tannins')}
                                  title={isEditMode ? "Click to edit Tannins Gauge" : undefined}
                                >
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
                                      <strong>{tanninClean.toUpperCase()}</strong> • <span>{getStructureSubtitle('tannin', tanninVal, tanninTextureClean).toUpperCase()}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                        {sIdx < allSecs.length - 1 && <div className="verdict-inner-divider" />}
                      </React.Fragment>
                    );
                  }

                  if (sectionKey === 'keyAttributes') {
                    if (layout.hidden?.keyAttributes) return null;
                    const hidePillars = layout.hidden?.pillars;
                    const hidePairings = layout.hidden?.pairings;
                    const keyAttrOrder = layout.keyAttributesOrder || ['pillars', 'pairings'];

                    return (
                      <React.Fragment key="keyAttributes">
                        <div
                          className={getItemClass('keyAttributes', 'verdict-key-attributes-block font-serif')}
                          style={getItemStyle('keyAttributes')}
                          onClick={(e) => handleItemClick(e, 'keyAttributes')}
                          title={isEditMode ? "Click to edit Key Attributes Block" : undefined}
                        >
                          <h3 className="verdict-section-heading" style={{ marginBottom: '6px' }}>
                            <EditableText textKey="verdict.keyAttributesTitle" defaultText="KEY ATTRIBUTES" />
                          </h3>

                          {/* 4-Segment Colored Bar */}
                          {!layout.hidden?.attrBar && (
                            <div
                              className={getItemClass('attrBar', 'verdict-attributes-color-bar')}
                              style={getItemStyle('attrBar')}
                              onClick={(e) => handleItemClick(e, 'attrBar')}
                              title={isEditMode ? "Click to edit Attributes Color Bar" : undefined}
                            >
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
                          )}

                          {/* Bottom 2 Sub-Columns: 2x2 Pillars + Pairs Well With */}
                          {(!hidePillars || !hidePairings) && (
                            <div
                              className="verdict-attributes-details-row"
                              style={{
                                gridTemplateColumns: (hidePillars || hidePairings) ? '1fr' : '1.15fr 1fr'
                              }}
                            >
                              {keyAttrOrder.map(itemKey => {
                                if (itemKey === 'pillars' && !hidePillars) {
                                  return (
                                    <div
                                      key="pillars"
                                      className={getItemClass('pillars', 'verdict-palate-pillars-grid')}
                                      style={getItemStyle('pillars')}
                                      onClick={(e) => handleItemClick(e, 'pillars')}
                                      title={isEditMode ? "Click to edit Palate Pillars" : undefined}
                                    >
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
                                  );
                                }

                                if (itemKey === 'pairings' && !hidePairings) {
                                  return (
                                    <div
                                      key="pairings"
                                      className={getItemClass('pairings', 'verdict-pairings-col font-serif')}
                                      style={getItemStyle('pairings')}
                                      onClick={(e) => handleItemClick(e, 'pairings')}
                                      title={isEditMode ? "Click to edit Pairings" : undefined}
                                    >
                                      <div className="pairings-title">
                                        <EditableText textKey="verdict.pairsWellWith" defaultText="PAIRS WELL WITH:" />
                                      </div>
                                      <div className="pairings-list">
                                        {pairingsList.map((item, pIdx) => (
                                          <div key={pIdx} className="pairing-row">
                                            <span className="pairing-icon">{item.icon}</span>
                                            <span className="pairing-name">{item.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}

                        </div>
                        {sIdx < allSecs.length - 1 && <div className="verdict-inner-divider" />}
                      </React.Fragment>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* Render Bottle Second if bottlePosition is right */}
            {layout.bottlePosition === 'right' && !layout.hidden?.bottle && (
              <div
                className={getItemClass('bottle', 'verdict-bottle-column')}
                style={getItemStyle('bottle')}
                onClick={(e) => handleItemClick(e, 'bottle')}
                title={isEditMode ? "Click to edit Bottle" : undefined}
              >
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
            )}

          </div>
        )}

        {/* Thin Divider Line */}
        {(!layout.hidden?.bottle || !layout.hidden?.profileNotes || !layout.hidden?.palate || !layout.hidden?.keyAttributes) && 
         (!layout.hidden?.notesRow || !layout.hidden?.notes || !layout.hidden?.glasses) && (
          <div className="verdict-divider-line" />
        )}

        {/* ----------------------------------------------------
            3. SOMMELIER NOTES & 5 WINE GLASSES ROW
           ---------------------------------------------------- */}
        {!layout.hidden?.notesRow && (!layout.hidden?.notes || !layout.hidden?.glasses) && (
          <div
            className={getItemClass('notesRow', 'verdict-notes-glasses-row font-serif')}
            style={getItemStyle('notesRow', {
              gridTemplateColumns: (layout.hidden?.notes || layout.hidden?.glasses) ? '1fr' : '1fr auto'
            })}
            onClick={(e) => handleItemClick(e, 'notesRow')}
            title={isEditMode ? "Click to edit Notes & Glasses Row" : undefined}
          >
            {(layout.notesGlassesOrder || ['notes', 'glasses']).map(itemKey => {
              if (itemKey === 'notes' && !layout.hidden?.notes) {
                return (
                  <div
                    key="notes"
                    className={getItemClass('notes', 'verdict-notes-left')}
                    style={getItemStyle('notes')}
                    onClick={(e) => handleItemClick(e, 'notes')}
                    title={isEditMode ? "Click to edit Notes" : undefined}
                  >
                    <div className="notes-header">
                      <Quote size={12} color="#9e7a24" />
                      <EditableText textKey="verdict.notesTitle" defaultText="SOMMELIER'S NOTES & PAIRINGS:" />
                    </div>
                    <div className="notes-body">
                      {displayNotes ? `"${displayNotes}"` : '"Balanced red wine evaluation displaying harmonious structure, and lingering."'}
                    </div>
                  </div>
                );
              }

              if (itemKey === 'glasses' && !layout.hidden?.glasses) {
                return (
                  <div
                    key="glasses"
                    className={getItemClass('glasses', 'verdict-glasses-right')}
                    style={getItemStyle('glasses')}
                    onClick={(e) => handleItemClick(e, 'glasses')}
                    title={isEditMode ? "Click to edit Glasses" : undefined}
                  >
                    <div className="vfm-glasses-row" title={readOnly || isEditMode ? undefined : 'Click to rate Value For Money'}>
                      {[1, 2, 3, 4, 5].map((gIndex) => {
                        const isFilled = gIndex <= vfmScore;
                        return (
                          <button
                            key={gIndex}
                            type="button"
                            className={`vfm-glass-btn ${isFilled ? 'filled' : 'empty'} ${readOnly ? 'read-only' : ''}`}
                            onClick={() => !isEditMode && setVfm(gIndex)}
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
                );
              }
              return null;
            })}
          </div>
        )}

        {/* ----------------------------------------------------
            4. BOTTOM VFM (VALUE FOR MONEY) FOOTER BAR
           ---------------------------------------------------- */}
        {!layout.hidden?.vfmBar && (
          <div
            className={getItemClass('vfmBar', 'verdict-vfm-footer-bar font-serif')}
            style={getItemStyle('vfmBar')}
            onClick={(e) => handleItemClick(e, 'vfmBar')}
            title={isEditMode ? "Click to edit VFM Bar" : undefined}
          >
            <div className="vfm-footer-left">
              <span className="vfm-prefix"><EditableText textKey="verdict.vfmTitle" defaultText="VFM:" /></span>
              <span className="vfm-footer-divider">|</span>
              <span className="vfm-score-number">{vfmScore}/5</span>
            </div>
            <div className="vfm-footer-right">
              <EditableText
                textKey="verdict.vfmGlassesSub"
                defaultText={`${NUMBER_WORDS[vfmScore] || vfmScore} full glasses out of five`.toUpperCase()}
                interpolations={{ count: (NUMBER_WORDS[vfmScore] || vfmScore).toUpperCase() }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
