import React, { useState, useEffect, useRef } from 'react';
import { Wine, ListFilter, Download, Sparkles, Save, Share2, Printer, Check, Sun, Moon, Loader2 } from 'lucide-react';
import EditableText from './TextEditor/EditableText';
import { useTexts } from '../context/TextContext';

export default function Header({
  currentView,
  setCurrentView,
  savedCount,
  onOpenGuide,
  onSave,
  onShare,
  onPrint,
  theme = 'dark',
  onToggleTheme,
  isRefreshingTheme = false,
  isSharingPhoto = false,
  isSharePhotoSuccess = false
}) {
  const { t, isEditMode } = useTexts();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isSavedFlash, setIsSavedFlash] = useState(false);
  const [copiedToast, setCopiedToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleSaveClick = () => {
    if (onSave) onSave();
    setIsSavedFlash(true);
    setTimeout(() => setIsSavedFlash(false), 2000);
  };

  const handleBrandShareClick = async (e) => {
    if (isEditMode) return;
    e.stopPropagation();

    const textToCopy = "If you like it - tell your friends.. Winitis wine taste app https://winitis.vercel.app";
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      }
    } catch (err) {
      console.warn('Clipboard writeText failed:', err);
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
    }

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastKey(Date.now());
    setCopiedToast(textToCopy);

    toastTimeoutRef.current = setTimeout(() => {
      setCopiedToast(null);
    }, 3000);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div 
          className="brand-logo" 
          onClick={handleBrandShareClick}
          title="Click to copy app link and share"
          role="button"
          tabIndex={0}
        >
          <svg className="brand-icon" viewBox="0 0 512 512" fill="none">
            <path d="M 176 120 C 176 260, 336 260, 336 120 Z" fill="url(#wineGrad)"/>
            <path d="M 176 120 C 176 260, 336 260, 336 120 Z" stroke="#d4af37" strokeWidth="12"/>
            <line x1="256" y1="250" x2="256" y2="390" stroke="#d4af37" strokeWidth="14" strokeLinecap="round"/>
            <ellipse cx="256" cy="390" rx="70" ry="14" fill="none" stroke="#d4af37" strokeWidth="14"/>
            <defs>
              <linearGradient id="wineGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#b81d40"/>
                <stop offset="100%" stopColor="#5c133a"/>
              </linearGradient>
            </defs>
          </svg>
          <div>
            <div className="brand-title font-serif">
              <EditableText textKey="header.brandTitle" defaultText="WINITIS" />
            </div>
            <div className="brand-subtitle">
              <EditableText textKey="header.brandSubtitle" defaultText="by Nitay Malka" />
            </div>
          </div>
        </div>

        <div className="nav-buttons">
          {onToggleTheme && (
            <button 
              type="button"
              className="btn btn-outline"
              onClick={onToggleTheme}
              disabled={isRefreshingTheme}
              title={theme === 'dark' ? 'Night Mode (click to switch & refresh latest changes)' : 'Day Mode (click to switch & refresh latest changes)'}
              aria-label="Toggle Night/Day mode and refresh"
              style={{ padding: '8px 10px', minWidth: '38px', height: '38px', justifyContent: 'center' }}
            >
              {isRefreshingTheme ? (
                <Loader2 size={18} color="#d4af37" className="animate-spin" />
              ) : theme === 'dark' ? (
                <Moon size={18} color="#d4af37" />
              ) : (
                <Sun size={18} color="#d4af37" />
              )}
            </button>
          )}

          <button 
            className={`btn ${currentView === 'new' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCurrentView('new')}
            title={t('header.newTasting', 'New Tasting')}
            aria-label="New Tasting"
            style={{ padding: '8px 10px', minWidth: '38px', height: '38px', justifyContent: 'center' }}
          >
            <Wine size={18} />
          </button>

          <button 
            className={`btn ${currentView === 'saved' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setCurrentView('saved')}
            title={`${t('header.cellarLog', 'Cellar Log')} (${savedCount})`}
            aria-label={`Cellar Log (${savedCount})`}
            style={{ padding: '8px 10px', minWidth: '38px', height: '38px', justifyContent: 'center', position: 'relative' }}
          >
            <ListFilter size={18} />
            {savedCount > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--gold-primary)',
                  color: '#0f0910',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  minWidth: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  lineHeight: 1,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                }}
              >
                {savedCount}
              </span>
            )}
          </button>

          {/* Quick Action Symbols: Save, Share Photo, Print (Symbol only, no text) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '2px' }}>
            {onSave && (
              <button 
                type="button"
                className="btn btn-outline" 
                onClick={handleSaveClick}
                title="Save Tasting Note to Cellar"
                aria-label="Save"
                style={{
                  padding: '8px 10px',
                  minWidth: '38px',
                  justifyContent: 'center',
                  borderColor: isSavedFlash ? 'var(--gold-primary)' : undefined,
                  background: isSavedFlash ? 'rgba(212,175,55,0.2)' : undefined
                }}
              >
                {isSavedFlash ? <Check size={16} color="#d4af37" /> : <Save size={16} />}
              </button>
            )}

            {onShare && (
              <button 
                type="button"
                className="btn btn-outline" 
                onClick={onShare}
                disabled={isSharingPhoto}
                title="Share Summary as Photo"
                aria-label="Share Photo"
                style={{
                  padding: '8px 10px',
                  minWidth: '38px',
                  justifyContent: 'center',
                  borderColor: isSharePhotoSuccess ? 'var(--gold-primary)' : undefined,
                  background: isSharePhotoSuccess ? 'rgba(212,175,55,0.2)' : undefined
                }}
              >
                {isSharingPhoto ? (
                  <Loader2 size={16} className="spin-animate" color="#d4af37" />
                ) : isSharePhotoSuccess ? (
                  <Check size={16} color="#d4af37" />
                ) : (
                  <Share2 size={16} />
                )}
              </button>
            )}

            {onPrint && (
              <button 
                type="button"
                className="btn btn-outline" 
                onClick={onPrint}
                title="Print / Save PDF"
                aria-label="Print"
                style={{ padding: '8px 10px', minWidth: '38px', justifyContent: 'center' }}
              >
                <Printer size={16} />
              </button>
            )}
          </div>

          {isInstallable && (
            <button className="btn btn-gold" onClick={handleInstallClick} title="Install App">
              <Download size={16} />
              <span><EditableText textKey="header.installPwa" defaultText="Install PWA" /></span>
            </button>
          )}
        </div>
      </div>

      {/* 3s Fade-Away Copied Share Toast */}
      {copiedToast && (
        <div 
          key={toastKey}
          className="copied-toast-window font-serif"
          onClick={() => setCopiedToast(null)}
          title="Click to dismiss"
        >
          <div className="copied-toast-badge">
            <Check size={16} color="#4ade80" />
            <span>COPIED!</span>
          </div>
          <div className="copied-toast-text">
            {copiedToast}
          </div>
        </div>
      )}
    </header>
  );
}
