import React, { createContext, useContext, useState, useEffect } from 'react';
import defaultTexts from '../content/appTexts.json';
import { HE_UI } from '../i18n/he';
import { getStoredLang, makeTr, LANG_KEY } from '../i18n/translate';

const TextContext = createContext(null);
const STORAGE_KEY = 'winitis_user_custom_texts_v1';

export function TextProvider({ children }) {
  const [texts, setTexts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return deepMerge(defaultTexts, parsed);
      }
    } catch (e) {
      console.warn('Failed to load saved custom texts:', e);
    }
    return defaultTexts;
  });

  // UI language. Display-only: switching never touches note data (notes keep English ids).
  const [lang, setLangState] = useState(getStoredLang);
  const setLang = (next) => {
    setLangState(next);
    try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
  };
  const tr = makeTr(lang);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    // Layout never mirrors: the document stays LTR in both languages; Hebrew direction is
    // handled per text run in CSS (unicode-bidi: plaintext), so only the text changes.
    html.dir = 'ltr';
    document.title = lang === 'he' ? 'Winitis | טעימות יין אדום' : 'Winitis | Red Wine Tasting PWA';
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) manifest.setAttribute('href', lang === 'he' ? '/manifest.he.json' : '/manifest.json');
  }, [lang]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Clean up any temporary custom texts key since edits are now permanently baked into defaultTexts
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }, []);

  const saveToStorage = (updated) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save custom texts to localStorage:', e);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateText = (path, value) => {
    setTexts(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let current = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      saveToStorage(copy);
      return copy;
    });
  };

  const resetTexts = () => {
    if (window.confirm('Reset all edited texts back to default 0.1.0 baseline?')) {
      localStorage.removeItem(STORAGE_KEY);
      setTexts(defaultTexts);
      showToast('All texts reset to default baseline');
    }
  };

  const exportTextsJSON = () => {
    const jsonStr = JSON.stringify(texts, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr);
      showToast('Texts JSON copied to clipboard!');
    }
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appTexts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTextsJSON = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      const merged = deepMerge(defaultTexts, parsed);
      setTexts(merged);
      saveToStorage(merged);
      showToast('Custom texts successfully imported!');
      return true;
    } catch (e) {
      alert('Invalid JSON format: ' + e.message);
      return false;
    }
  };

  const t = (path, fallbackOrParams, params) => {
    let fallback = typeof fallbackOrParams === 'string' ? fallbackOrParams : null;
    let interpolations = typeof fallbackOrParams === 'object' ? fallbackOrParams : params;

    const parts = path.split('.');
    let current = texts;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = null;
        break;
      }
    }

    let textVal = current !== null && current !== undefined ? current : fallback || path;
    if (lang === 'he') {
      let he = HE_UI;
      for (const part of parts) {
        he = he && typeof he === 'object' && part in he ? he[part] : undefined;
      }
      textVal = typeof he === 'string' ? he : (typeof textVal === 'string' ? tr(textVal) : textVal);
    }
    if (typeof textVal === 'string' && interpolations) {
      for (const [key, val] of Object.entries(interpolations)) {
        textVal = textVal.replace(new RegExp(`\\{\\s*${key}\\s*\\}`, 'g'), val);
      }
    }
    return textVal;
  };

  const hasCustomEdits = Boolean(localStorage.getItem(STORAGE_KEY));

  return (
    <TextContext.Provider value={{
      texts,
      t,
      tr,
      lang,
      setLang,
      updateText,
      resetTexts,
      exportTextsJSON,
      importTextsJSON,
      isEditMode,
      setIsEditMode,
      isDrawerOpen,
      setIsDrawerOpen,
      toastMessage,
      showToast,
      hasCustomEdits
    }}>
      {children}
    </TextContext.Provider>
  );
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source || {})) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export function useTexts() {
  const ctx = useContext(TextContext);
  if (!ctx) {
    throw new Error('useTexts must be used within a TextProvider');
  }
  return ctx;
}
