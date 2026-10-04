import React, { useState, useRef, useEffect } from 'react';
import GenericWineBottle from './GenericWineBottle';
import EditableText from '../TextEditor/EditableText';
import {
  Camera, RotateCcw, Quote, Sun, Moon, Share2, Loader2, Check,
  Sliders, Move, Maximize2, Minimize2, Eye, EyeOff,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowLeftRight, Smartphone
} from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import { useTexts } from '../../context/TextContext';
import { pushLiveSync, subscribeLiveSync } from '../../utils/liveSync';

const STORAGE_ADVANCED_LAYOUT_KEY = 'winitis_verdict_advanced_layout_v2';

const DEFAULT_ADVANCED_LAYOUT = {
  card: { height: 700 },
  items: {},
  hidden: {}
};

export const EDITABLE_ITEMS = [
  { id: 'card', label: 'Overall Summary Card', icon: '🃏', group: 'Card Container' },
  { id: 'header', label: 'Header Row', icon: '👑', group: 'Header' },
  { id: 'wineTitle', label: 'Wine Title', icon: '🏷️', group: 'Header' },
  { id: 'specs', label: 'Specs Line', icon: '📋', group: 'Header' },
  { id: 'medal', label: 'Points Rosette Medal', icon: '🏅', group: 'Header' },
  { id: 'leftColumn', label: 'Left Column', icon: '📐', group: 'Left Column' },
  { id: 'bottle', label: 'Wine Bottle', icon: '🍾', group: 'Left Column' },
  { id: 'keyAttributes', label: 'Key Attributes Block', icon: '✨', group: 'Left Column' },
  { id: 'pillars', label: '2x2 Pillars Grid', icon: '🏛️', group: 'Pillars' },
  { id: 'pillarSweetness', label: 'Sweetness Pillar', icon: '💧', group: 'Pillars' },
  { id: 'pillarAlcohol', label: 'Alcohol Pillar', icon: '🌡️', group: 'Pillars' },
  { id: 'pillarFlavor', label: 'Flavor Pillar', icon: '🍄', group: 'Pillars' },
  { id: 'pillarFinish', label: 'Finish Pillar', icon: '⏱️', group: 'Pillars' },
  { id: 'tastingContent', label: 'Right Tasting Column', icon: '📊', group: 'Right Column' },
  { id: 'tastingNotes', label: 'Tasting Notes Block', icon: '👃', group: 'Right Column' },
  { id: 'noseMeta', label: 'Nose & Aromas Info', icon: '📝', group: 'Right Column' },
  { id: 'aromasList', label: 'Aromas List', icon: '🍇', group: 'Right Column' },
  { id: 'palate', label: 'Palate & Structure Block', icon: '🍷', group: 'Right Column' },
  { id: 'bodyGauge', label: 'Body Gauge', icon: '🍷', group: 'Palate' },
  { id: 'acidityGauge', label: 'Acidity Gauge', icon: '🍋', group: 'Palate' },
  { id: 'tanninsGauge', label: 'Tannins Gauge', icon: '🍇', group: 'Palate' },
  { id: 'sommelierNotes', label: "Sommelier's Notes Box", icon: '💬', group: 'Footer' },
  { id: 'vfmBar', label: 'VFM Glasses Bar', icon: '🍷', group: 'Footer' }
];

const getInitialLayout = (note) => {
  if (note?.customLayout && typeof note.customLayout === 'object' && Object.keys(note.customLayout).length > 0) {
    return note.customLayout;
  }
  try {
    const saved = localStorage.getItem(STORAGE_ADVANCED_LAYOUT_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to parse saved layout:', e);
  }
  return DEFAULT_ADVANCED_LAYOUT;
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

  // Advanced Layout Editor State
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('bottle');
  const [nudgeStep, setNudgeStep] = useState(5); // 1, 5, or 15 px
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [layout, setLayout] = useState(() => getInitialLayout(wineNote));
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Subscribe to live sync events from iPhone or PC
  useEffect(() => {
    const unsubscribe = subscribeLiveSync((syncData) => {
      if (syncData.layout) {
        setLayout(syncData.layout);
        try {
          localStorage.setItem(STORAGE_ADVANCED_LAYOUT_KEY, JSON.stringify(syncData.layout));
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
      setLastSyncTime(new Date());
    });
    return unsubscribe;
  }, []);

  // Broadcast current state when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      pushLiveSync({
        layout,
        wineNote: {
          ...wineNote,
          customLayout: layout
        },
        theme,
        step: 4
      });
    }
  }, [isEditMode]);

  const saveLayout = (newLayout) => {
    setLayout(newLayout);
    try {
      localStorage.setItem(STORAGE_ADVANCED_LAYOUT_KEY, JSON.stringify(newLayout));
    } catch (e) {
      console.warn('Failed to save layout:', e);
    }
    const updatedNote = {
      ...wineNote,
      customLayout: newLayout
    };
    if (updateWineNote) {
      updateWineNote(updatedNote);
    }
    // Broadcast real-time change to iPhone
    pushLiveSync({
      layout: newLayout,
      wineNote: updatedNote,
      theme,
      step: 4
    });
    setLastSyncTime(new Date());
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'parchment' ? 'dark' : 'parchment';
    setTheme(nextTheme);
    pushLiveSync({
      layout,
      wineNote: {
        ...wineNote,
        customLayout: layout
      },
      theme: nextTheme,
      step: 4
    });
  };

  const updateSelectedItem = (changes) => {
    if (!selectedItemId) return;
    const currentItem = layout.items?.[selectedItemId] || {};
    const updated = {
      ...layout,
      items: {
        ...(layout.items || {}),
        [selectedItemId]: {
          ...currentItem,
          ...changes
        }
      }
    };
    saveLayout(updated);
  };

  const handleNudge = (prop, delta) => {
    if (!selectedItemId) return;
    const currentItem = layout.items?.[selectedItemId] || {};
    const currentVal = currentItem[prop] || 0;
    updateSelectedItem({ [prop]: currentVal + delta });
  };

  const handleNudgeDim = (prop, delta) => {
    if (!selectedItemId) return;
    const currentItem = layout.items?.[selectedItemId] || {};
    const currentVal = currentItem[prop];
    let nextVal;
    if (currentVal === undefined || currentVal === 'auto') {
      const defaultVal = prop === 'height' ? 80 : 150;
      nextVal = Math.max(10, defaultVal + delta);
    } else {
      nextVal = Math.max(10, currentVal + delta);
    }
    updateSelectedItem({ [prop]: nextVal });
  };

  const handleNudgeMargin = (prop, delta) => {
    if (!selectedItemId) return;
    const currentItem = layout.items?.[selectedItemId] || {};
    const currentVal = currentItem[prop] || 0;
    updateSelectedItem({ [prop]: currentVal + delta });
  };

  const handleNudgeScale = (delta) => {
    if (!selectedItemId) return;
    const currentItem = layout.items?.[selectedItemId] || {};
    const currentScale = currentItem.scale || 1;
    const nextScale = Math.max(0.4, Math.min(2.0, Math.round((currentScale + delta) * 100) / 100));
    updateSelectedItem({ scale: nextScale });
  };

  const handleNudgeFontSize = (delta) => {
    if (!selectedItemId) return;
    const currentItem = layout.items?.[selectedItemId] || {};
    const currentSize = currentItem.fontSize !== undefined ? currentItem.fontSize : 1.0;
    const nextSize = Math.max(0.4, Math.min(2.5, Math.round((currentSize + delta) * 100) / 100));
    updateSelectedItem({ fontSize: nextSize });
  };

  const handleToggleHide = () => {
    if (!selectedItemId) return;
    const isHidden = !!layout.hidden?.[selectedItemId];
    const updated = {
      ...layout,
      hidden: {
        ...(layout.hidden || {}),
        [selectedItemId]: !isHidden
      }
    };
    saveLayout(updated);
  };

  const handleResetItem = () => {
    if (!selectedItemId) return;
    const newItems = { ...(layout.items || {}) };
    delete newItems[selectedItemId];
    const newHidden = { ...(layout.hidden || {}) };
    delete newHidden[selectedItemId];
    const updated = {
      ...layout,
      items: newItems,
      hidden: newHidden
    };
    saveLayout(updated);
  };

  const handleResetAll = () => {
    if (window.confirm("Reset all custom layout settings (heights, positions, sizes) to default?")) {
      saveLayout(DEFAULT_ADVANCED_LAYOUT);
    }
  };

  const handleNudgeCard = (prop, delta) => {
    const cardConfig = layout.card || {};
    let nextVal;
    if (prop === 'height') {
      const current = cardConfig.height || 700;
      nextVal = Math.max(450, Math.min(1400, current + delta));
    } else if (prop === 'padding') {
      const current = cardConfig.padding ?? 16;
      nextVal = Math.max(4, Math.min(40, current + delta));
    } else if (prop === 'scale') {
      const current = cardConfig.scale || 1;
      nextVal = Math.max(0.5, Math.min(1.5, Math.round((current + delta) * 100) / 100));
    }
    const updated = {
      ...layout,
      card: {
        ...(layout.card || {}),
        [prop]: nextVal
      }
    };
    saveLayout(updated);
  };

  const getItemStyle = (id, baseStyle = {}) => {
    const isHidden = layout.hidden?.[id];
    if (isHidden) {
      return { ...baseStyle, display: 'none' };
    }

    const itemConfig = layout.items?.[id] || {};
    const style = { ...baseStyle };

    // Scale / Zoom
    if (itemConfig.scale && itemConfig.scale !== 1) {
      style.transform = `${style.transform || ''} scale(${itemConfig.scale})`.trim();
      style.transformOrigin = itemConfig.transformOrigin || 'center center';
    }

    // Location / Nudge (X and Y offset)
    if (itemConfig.offsetX || itemConfig.offsetY) {
      style.position = 'relative';
      if (itemConfig.offsetX) style.left = `${itemConfig.offsetX}px`;
      if (itemConfig.offsetY) style.top = `${itemConfig.offsetY}px`;
    }

    // Height
    if (itemConfig.height !== undefined && itemConfig.height !== null && itemConfig.height !== '') {
      style.height = typeof itemConfig.height === 'number' ? `${itemConfig.height}px` : itemConfig.height;
    }
    if (itemConfig.maxHeight !== undefined && itemConfig.maxHeight !== null && itemConfig.maxHeight !== '') {
      style.maxHeight = typeof itemConfig.maxHeight === 'number' ? `${itemConfig.maxHeight}px` : itemConfig.maxHeight;
    }
    if (itemConfig.minHeight !== undefined && itemConfig.minHeight !== null && itemConfig.minHeight !== '') {
      style.minHeight = typeof itemConfig.minHeight === 'number' ? `${itemConfig.minHeight}px` : itemConfig.minHeight;
    }

    // Width
    if (itemConfig.width !== undefined && itemConfig.width !== null && itemConfig.width !== '') {
      style.width = typeof itemConfig.width === 'number' ? `${itemConfig.width}px` : itemConfig.width;
      style.maxWidth = typeof itemConfig.width === 'number' ? `${itemConfig.width}px` : itemConfig.width;
    }

    // Margins
    if (itemConfig.marginTop !== undefined) style.marginTop = `${itemConfig.marginTop}px`;
    if (itemConfig.marginBottom !== undefined) style.marginBottom = `${itemConfig.marginBottom}px`;
    if (itemConfig.marginLeft !== undefined) style.marginLeft = `${itemConfig.marginLeft}px`;
    if (itemConfig.marginRight !== undefined) style.marginRight = `${itemConfig.marginRight}px`;

    // Font size
    if (itemConfig.fontSize !== undefined && itemConfig.fontSize !== '') {
      style.fontSize = typeof itemConfig.fontSize === 'number' ? `${itemConfig.fontSize}rem` : itemConfig.fontSize;
    }

    return style;
  };

  const getCardStyle = () => {
    const cardConfig = layout.card || {};
    const style = {};
    if (cardConfig.height) {
      style.height = `${cardConfig.height}px`;
      style.minHeight = `${cardConfig.height}px`;
      style.maxHeight = `${cardConfig.height}px`;
    }
    if (cardConfig.padding !== undefined) {
      style.padding = `${cardConfig.padding}px`;
    }
    if (cardConfig.scale && cardConfig.scale !== 1) {
      style.transform = `scale(${cardConfig.scale})`;
      style.transformOrigin = 'top center';
    }
    return style;
  };

  const getItemClass = (id, baseClass = '') => {
    const classes = [baseClass];
    if (isEditMode) {
      classes.push('adv-editable-item');
      if (selectedItemId === id) {
        classes.push('adv-item-selected');
      }
    }
    return classes.filter(Boolean).join(' ');
  };

  const handleItemClick = (e, id) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setSelectedItemId(id);
  };

  const renderItemBadge = (id) => {
    if (!isEditMode || selectedItemId !== id) return null;
    const def = EDITABLE_ITEMS.find(i => i.id === id);
    if (!def) return null;
    return (
      <span className="adv-selected-badge no-print">
        {def.icon} {def.label}
      </span>
    );
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
  const userAromas = rawAromas
    .map(a => cleanText(a))
    .filter(Boolean)
    .slice(0, 4)
    .map(a => a.length > 28 ? a.slice(0, 28).trim() : a);

  // 3. Palate & Structural Parameters (Sector 2 - all 8 attributes)
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

  const wineTypeClean = (wineNote.type || 'red').toLowerCase();
  const currentItem = layout.items?.[selectedItemId] || {};

  return (
    <div className="verdict-wrapper">
      
      {/* Top Toolbar Controls: Theme Toggle, Bottle Photo Actions, Share & Advanced Edit Toggle */}
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

          {/* Separator */}
          {!readOnly && (
            <div style={{ width: '1px', height: '20px', background: 'rgba(212, 175, 55, 0.25)', margin: '0 2px' }} />
          )}

          {/* Advanced Edit Mode Button */}
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
                setIsEditMode(prev => !prev);
                if (!isEditMode && !selectedItemId) {
                  setSelectedItemId('bottle');
                }
              }}
              title={isEditMode ? "Finish Layout Editing" : "Advanced Layout Editor (Heights, Locations, Sizes)"}
            >
              <Sliders size={16} />
              <span>{isEditMode ? "Exit Edit" : "Advanced Edit"}</span>
            </button>
          )}

          {/* Real-time Live Sync Indicator Badge */}
          <div
            className="live-sync-badge no-print"
            title="Real-time live sync: any layout, size or position change updates immediately on iPhone"
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
        className={`verdict-card ${theme === 'dark' ? 'theme-dark' : 'theme-parchment'} ${getItemClass('card')}`}
        style={{ ...getCardStyle(), ...getItemStyle('card') }}
        onClick={(e) => handleItemClick(e, 'card')}
      >
        {renderItemBadge('card')}

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
        <div
          className={getItemClass('header', 'verdict-header-row')}
          style={getItemStyle('header')}
          onClick={(e) => handleItemClick(e, 'header')}
        >
          {renderItemBadge('header')}
          
          {/* Left: Wine Title & Compact Specs */}
          <div className="verdict-header-left">
            <h1
              className={getItemClass('wineTitle', 'verdict-wine-title font-serif')}
              style={getItemStyle('wineTitle')}
              onClick={(e) => handleItemClick(e, 'wineTitle')}
            >
              {renderItemBadge('wineTitle')}
              {wineName}
            </h1>
            <div
              className={getItemClass('specs', 'verdict-wine-specs font-serif')}
              style={getItemStyle('specs')}
              onClick={(e) => handleItemClick(e, 'specs')}
            >
              {renderItemBadge('specs')}
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
          <div
            className={getItemClass('medal', 'verdict-medal-wrap')}
            style={getItemStyle('medal')}
            onClick={(e) => handleItemClick(e, 'medal')}
          >
            {renderItemBadge('medal')}
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
          <div
            className={getItemClass('leftColumn', 'verdict-left-column')}
            style={getItemStyle('leftColumn')}
            onClick={(e) => handleItemClick(e, 'leftColumn')}
          >
            {renderItemBadge('leftColumn')}
            <div
              className={getItemClass('bottle', 'verdict-bottle-column')}
              style={getItemStyle('bottle')}
              onClick={(e) => handleItemClick(e, 'bottle')}
            >
              {renderItemBadge('bottle')}
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

            {/* Key Attributes Block (Pillars) placed below bottle */}
            <div
              className={getItemClass('keyAttributes', 'verdict-key-attributes-block font-serif')}
              style={getItemStyle('keyAttributes')}
              onClick={(e) => handleItemClick(e, 'keyAttributes')}
            >
              {renderItemBadge('keyAttributes')}
              <div className="verdict-section-heading" style={{ marginBottom: '4px', textAlign: 'center' }}>
                <EditableText textKey="verdict.keyAttributesTitle" defaultText="KEY ATTRIBUTES" />
              </div>

              {/* 2x2 Palate Pillars */}
              <div
                className={getItemClass('pillars', 'verdict-palate-pillars-grid')}
                style={getItemStyle('pillars')}
                onClick={(e) => handleItemClick(e, 'pillars')}
              >
                {renderItemBadge('pillars')}
                
                {/* Sweetness */}
                <div
                  className={getItemClass('pillarSweetness', 'palate-pillar-item')}
                  style={getItemStyle('pillarSweetness')}
                  onClick={(e) => handleItemClick(e, 'pillarSweetness')}
                >
                  {renderItemBadge('pillarSweetness')}
                  <div className="pillar-header-row">
                    <span className="pillar-label"><EditableText textKey="verdict.sweetnessTitle" defaultText="SWEETNESS:" /></span>
                    <span className="pillar-icon">💧</span>
                  </div>
                  <span className="pillar-val">{sweetnessVal.toUpperCase()}</span>
                </div>

                {/* Alcohol */}
                <div
                  className={getItemClass('pillarAlcohol', 'palate-pillar-item')}
                  style={getItemStyle('pillarAlcohol')}
                  onClick={(e) => handleItemClick(e, 'pillarAlcohol')}
                >
                  {renderItemBadge('pillarAlcohol')}
                  <div className="pillar-header-row">
                    <span className="pillar-label"><EditableText textKey="verdict.alcoholLevelTitle" defaultText="ALCOHOL:" /></span>
                    <span className="pillar-icon">↗️</span>
                  </div>
                  <span className="pillar-val">{cleanIntensity(alcoholLevelVal.split(' ')[0]).toUpperCase()}</span>
                </div>

                {/* Flavor */}
                <div
                  className={getItemClass('pillarFlavor', 'palate-pillar-item')}
                  style={getItemStyle('pillarFlavor')}
                  onClick={(e) => handleItemClick(e, 'pillarFlavor')}
                >
                  {renderItemBadge('pillarFlavor')}
                  <div className="pillar-header-row">
                    <span className="pillar-label"><EditableText textKey="verdict.flavorTitle" defaultText="FLAVOR:" /></span>
                    <span className="pillar-icon">🍄</span>
                  </div>
                  <span className="pillar-val">{flavorIntensityVal.toUpperCase()}</span>
                </div>

                {/* Finish */}
                <div
                  className={getItemClass('pillarFinish', 'palate-pillar-item')}
                  style={getItemStyle('pillarFinish')}
                  onClick={(e) => handleItemClick(e, 'pillarFinish')}
                >
                  {renderItemBadge('pillarFinish')}
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
          <div
            className={getItemClass('tastingContent', 'verdict-tasting-content')}
            style={getItemStyle('tastingContent')}
            onClick={(e) => handleItemClick(e, 'tastingContent')}
          >
            {renderItemBadge('tastingContent')}

            {/* SUB-SECTION 1: Tasting Notes (Nose & Aromas) */}
            <div
              className={getItemClass('tastingNotes', 'verdict-tasting-notes-block font-serif')}
              style={getItemStyle('tastingNotes')}
              onClick={(e) => handleItemClick(e, 'tastingNotes')}
            >
              {renderItemBadge('tastingNotes')}
              <h3 className="verdict-section-heading">
                <EditableText textKey="verdict.tastingNotesTitle" defaultText="TASTING NOTES" />
              </h3>

              <div className="verdict-nose-content-row">
                <div
                  className={getItemClass('noseMeta', 'verdict-nose-meta-wrap')}
                  style={getItemStyle('noseMeta')}
                  onClick={(e) => handleItemClick(e, 'noseMeta')}
                >
                  {renderItemBadge('noseMeta')}
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

                <div
                  className={getItemClass('aromasList', 'verdict-aromas-list font-serif')}
                  style={getItemStyle('aromasList')}
                  onClick={(e) => handleItemClick(e, 'aromasList')}
                >
                  {renderItemBadge('aromasList')}
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
            <div
              className={getItemClass('palate', 'verdict-palate-block font-serif')}
              style={getItemStyle('palate')}
              onClick={(e) => handleItemClick(e, 'palate')}
            >
              {renderItemBadge('palate')}
              <h3 className="verdict-section-heading" style={{ marginBottom: '6px' }}>
                <EditableText textKey="palate.title" defaultText="PALATE & STRUCTURE" />
              </h3>

              {/* Body Gauge */}
              <div
                className={getItemClass('bodyGauge', 'verdict-gauge-row')}
                style={getItemStyle('bodyGauge')}
                onClick={(e) => handleItemClick(e, 'bodyGauge')}
              >
                {renderItemBadge('bodyGauge')}
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
              <div
                className={getItemClass('acidityGauge', 'verdict-gauge-row')}
                style={getItemStyle('acidityGauge')}
                onClick={(e) => handleItemClick(e, 'acidityGauge')}
              >
                {renderItemBadge('acidityGauge')}
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
              <div
                className={getItemClass('tanninsGauge', 'verdict-gauge-row')}
                style={getItemStyle('tanninsGauge')}
                onClick={(e) => handleItemClick(e, 'tanninsGauge')}
              >
                {renderItemBadge('tanninsGauge')}
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
          </div>
        </div>

        {/* ----------------------------------------------------
            3. SOMMELIER NOTES ROW
           ---------------------------------------------------- */}
        <div
          className={getItemClass('sommelierNotes', 'verdict-notes-row font-serif')}
          style={getItemStyle('sommelierNotes')}
          onClick={(e) => handleItemClick(e, 'sommelierNotes')}
        >
          {renderItemBadge('sommelierNotes')}
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
        <div
          className={getItemClass('vfmBar', 'verdict-vfm-footer-bar font-serif')}
          style={getItemStyle('vfmBar')}
          onClick={(e) => handleItemClick(e, 'vfmBar')}
        >
          {renderItemBadge('vfmBar')}
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
          ADVANCED LAYOUT EDITOR INSPECTOR PANEL
         ========================================================== */}
      {isEditMode && (
        <div className="adv-inspector-panel no-print">
          
          {/* Top Bar Header */}
          <div className="adv-inspector-header">
            <div className="adv-header-left">
              <Sliders size={16} color="#d4af37" />
              <span className="adv-header-title">Inspector</span>
              
              {/* Item Selector Dropdown */}
              <select
                className="adv-item-select"
                value={selectedItemId || ''}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                {Array.from(new Set(EDITABLE_ITEMS.map(i => i.group))).map(groupName => (
                  <optgroup key={groupName} label={groupName}>
                    {EDITABLE_ITEMS.filter(i => i.group === groupName).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.icon} {item.label} {layout.hidden?.[item.id] ? '(Hidden)' : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <span className="adv-live-tag" title="Connected to iPhone: real-time updates active">
                <span className="live-sync-dot" /> iPhone Synced
              </span>
            </div>

            <div className="adv-header-right">
              {/* Hide / Show Toggle */}
              {selectedItemId !== 'card' && (
                <button
                  type="button"
                  className={`adv-tool-btn ${layout.hidden?.[selectedItemId] ? 'btn-danger' : ''}`}
                  onClick={handleToggleHide}
                  title={layout.hidden?.[selectedItemId] ? "Show element" : "Hide element"}
                >
                  {layout.hidden?.[selectedItemId] ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{layout.hidden?.[selectedItemId] ? 'Hidden' : 'Visible'}</span>
                </button>
              )}

              {/* Reset Selected Item */}
              <button
                type="button"
                className="adv-tool-btn"
                onClick={handleResetItem}
                title="Reset selected element to default"
              >
                <RotateCcw size={13} />
                <span>Reset Item</span>
              </button>

              {/* Minimize / Expand Toggle */}
              <button
                type="button"
                className="adv-tool-btn adv-btn-icon"
                onClick={() => setIsInspectorCollapsed(prev => !prev)}
                title={isInspectorCollapsed ? "Expand Inspector Panel" : "Minimize Inspector Panel"}
              >
                {isInspectorCollapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>

              {/* Done Button */}
              <button
                type="button"
                className="adv-tool-btn adv-btn-done"
                onClick={() => setIsEditMode(false)}
                title="Exit Edit Mode"
              >
                <Check size={15} />
                <span>Done</span>
              </button>
            </div>
          </div>

          {/* Inspector Body (Hidden if Collapsed) */}
          {!isInspectorCollapsed && (
            <div className="adv-inspector-body">
              <div className="adv-controls-grid">

                {/* Overall Card Controls */}
                {selectedItemId === 'card' ? (
                  <div className="adv-card-controls-row">
                    <div className="adv-control-box">
                      <span className="adv-box-label">Card Height</span>
                      <div className="adv-btn-stepper">
                        <button type="button" onClick={() => handleNudgeCard('height', -10)}>-10</button>
                        <span className="adv-value-pill">{layout.card?.height || 700}px</span>
                        <button type="button" onClick={() => handleNudgeCard('height', 10)}>+10</button>
                      </div>
                    </div>
                    <div className="adv-control-box">
                      <span className="adv-box-label">Card Padding</span>
                      <div className="adv-btn-stepper">
                        <button type="button" onClick={() => handleNudgeCard('padding', -2)}>-2</button>
                        <span className="adv-value-pill">{layout.card?.padding ?? 16}px</span>
                        <button type="button" onClick={() => handleNudgeCard('padding', 2)}>+2</button>
                      </div>
                    </div>
                    <div className="adv-control-box">
                      <span className="adv-box-label">Overall Scale</span>
                      <div className="adv-btn-stepper">
                        <button type="button" onClick={() => handleNudgeCard('scale', -0.05)}>-</button>
                        <span className="adv-value-pill">{Math.round((layout.card?.scale || 1) * 100)}%</span>
                        <button type="button" onClick={() => handleNudgeCard('scale', 0.05)}>+</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 1. LOCATION (Nudge X & Y) */}
                    <div className="adv-control-column">
                      <div className="adv-col-header">
                        <Move size={14} color="#d4af37" />
                        <span>Location (Position)</span>
                        <div className="adv-step-chips">
                          {[1, 5, 15].map(s => (
                            <button
                              key={s}
                              type="button"
                              className={`adv-chip ${nudgeStep === s ? 'active' : ''}`}
                              onClick={() => setNudgeStep(s)}
                            >
                              {s}px
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="adv-dpad-container">
                        <div className="adv-dpad-row">
                          <button
                            type="button"
                            className="adv-dpad-btn"
                            onClick={() => handleNudge('offsetY', -nudgeStep)}
                            title={`Nudge Up by ${nudgeStep}px`}
                          >
                            <ChevronUp size={16} />
                          </button>
                        </div>
                        <div className="adv-dpad-row adv-dpad-middle">
                          <button
                            type="button"
                            className="adv-dpad-btn"
                            onClick={() => handleNudge('offsetX', -nudgeStep)}
                            title={`Nudge Left by ${nudgeStep}px`}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            className="adv-dpad-center"
                            onClick={() => updateSelectedItem({ offsetX: 0, offsetY: 0 })}
                            title="Reset position offset to (0, 0)"
                          >
                            <span>X:{currentItem.offsetX || 0}, Y:{currentItem.offsetY || 0}</span>
                          </button>
                          <button
                            type="button"
                            className="adv-dpad-btn"
                            onClick={() => handleNudge('offsetX', nudgeStep)}
                            title={`Nudge Right by ${nudgeStep}px`}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                        <div className="adv-dpad-row">
                          <button
                            type="button"
                            className="adv-dpad-btn"
                            onClick={() => handleNudge('offsetY', nudgeStep)}
                            title={`Nudge Down by ${nudgeStep}px`}
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2. HEIGHTS & DIMENSIONS */}
                    <div className="adv-control-column">
                      <div className="adv-col-header">
                        <ArrowUpDown size={14} color="#d4af37" />
                        <span>Heights & Spacing</span>
                      </div>

                      <div className="adv-dimension-fields">
                        {/* Custom Height */}
                        <div className="adv-field-row">
                          <span className="adv-field-label">Height:</span>
                          <div className="adv-btn-stepper">
                            <button type="button" onClick={() => handleNudgeDim('height', -nudgeStep)}>-{nudgeStep}</button>
                            <span className="adv-value-pill">
                              {currentItem.height !== undefined ? `${currentItem.height}px` : 'Auto'}
                            </span>
                            <button type="button" onClick={() => handleNudgeDim('height', nudgeStep)}>+{nudgeStep}</button>
                            {currentItem.height !== undefined && (
                              <button type="button" className="adv-btn-tiny" onClick={() => updateSelectedItem({ height: undefined })}>✕</button>
                            )}
                          </div>
                        </div>

                        {/* Custom Width */}
                        <div className="adv-field-row">
                          <span className="adv-field-label">Width:</span>
                          <div className="adv-btn-stepper">
                            <button type="button" onClick={() => handleNudgeDim('width', -nudgeStep)}>-{nudgeStep}</button>
                            <span className="adv-value-pill">
                              {currentItem.width !== undefined ? `${currentItem.width}px` : 'Auto'}
                            </span>
                            <button type="button" onClick={() => handleNudgeDim('width', nudgeStep)}>+{nudgeStep}</button>
                            {currentItem.width !== undefined && (
                              <button type="button" className="adv-btn-tiny" onClick={() => updateSelectedItem({ width: undefined })}>✕</button>
                            )}
                          </div>
                        </div>

                        {/* Margin Top */}
                        <div className="adv-field-row">
                          <span className="adv-field-label">Margin Top:</span>
                          <div className="adv-btn-stepper">
                            <button type="button" onClick={() => handleNudgeMargin('marginTop', -2)}>-2</button>
                            <span className="adv-value-pill">
                              {currentItem.marginTop ?? 0}px
                            </span>
                            <button type="button" onClick={() => handleNudgeMargin('marginTop', 2)}>+2</button>
                          </div>
                        </div>

                        {/* Margin Bottom */}
                        <div className="adv-field-row">
                          <span className="adv-field-label">Margin Bottom:</span>
                          <div className="adv-btn-stepper">
                            <button type="button" onClick={() => handleNudgeMargin('marginBottom', -2)}>-2</button>
                            <span className="adv-value-pill">
                              {currentItem.marginBottom ?? 0}px
                            </span>
                            <button type="button" onClick={() => handleNudgeMargin('marginBottom', 2)}>+2</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. SIZE & SCALE */}
                    <div className="adv-control-column">
                      <div className="adv-col-header">
                        <Maximize2 size={14} color="#d4af37" />
                        <span>Size & Scale</span>
                      </div>

                      <div className="adv-dimension-fields">
                        {/* Scale Factor */}
                        <div className="adv-field-row">
                          <span className="adv-field-label">Scale:</span>
                          <div className="adv-btn-stepper">
                            <button type="button" onClick={() => handleNudgeScale(-0.05)}>-5%</button>
                            <span className="adv-value-pill">
                              {Math.round((currentItem.scale || 1) * 100)}%
                            </span>
                            <button type="button" onClick={() => handleNudgeScale(0.05)}>+5%</button>
                          </div>
                        </div>

                        {/* Scale Slider */}
                        <div className="adv-slider-row">
                          <input
                            type="range"
                            min="0.5"
                            max="1.8"
                            step="0.05"
                            value={currentItem.scale || 1}
                            onChange={(e) => updateSelectedItem({ scale: parseFloat(e.target.value) })}
                            className="adv-range-slider"
                          />
                        </div>

                        {/* Font Size */}
                        <div className="adv-field-row">
                          <span className="adv-field-label">Text Size:</span>
                          <div className="adv-btn-stepper">
                            <button type="button" onClick={() => handleNudgeFontSize(-0.05)}>A-</button>
                            <span className="adv-value-pill">
                              {currentItem.fontSize !== undefined ? `${currentItem.fontSize}rem` : 'Default'}
                            </span>
                            <button type="button" onClick={() => handleNudgeFontSize(0.05)}>A+</button>
                            {currentItem.fontSize !== undefined && (
                              <button type="button" className="adv-btn-tiny" onClick={() => updateSelectedItem({ fontSize: undefined })}>✕</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Inspector Footer Bar */}
              <div className="adv-inspector-footer">
                <button
                  type="button"
                  className="adv-footer-btn-reset-all"
                  onClick={handleResetAll}
                  title="Reset all customized positions, heights and sizes back to default"
                >
                  <RotateCcw size={13} />
                  <span>Reset All Elements</span>
                </button>
                <span className="adv-hint">
                  💡 Tip: Click any element directly on the card to inspect and adjust it.
                </span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
