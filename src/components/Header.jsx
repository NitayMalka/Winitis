import React, { useState, useEffect } from 'react';
import { Wine, ListFilter, Download, Sparkles, Save, Share2, Printer, Check } from 'lucide-react';
import EditableText from './TextEditor/EditableText';
import { useTexts } from '../context/TextContext';

export default function Header({
  currentView,
  setCurrentView,
  savedCount,
  onOpenGuide,
  onSave,
  onShare,
  onPrint
}) {
  const { t } = useTexts();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isSavedFlash, setIsSavedFlash] = useState(false);

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

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="brand-logo" onClick={() => setCurrentView('new')}>
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
              <EditableText textKey="header.brandSubtitle" defaultText="Red Wine Tasting PWA" />
            </div>
          </div>
        </div>

        <div className="nav-buttons">
          <button 
            className={`btn ${currentView === 'new' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCurrentView('new')}
          >
            <Wine size={16} />
            <span><EditableText textKey="header.newTasting" defaultText="New Tasting" /></span>
          </button>

          <button 
            className={`btn ${currentView === 'saved' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setCurrentView('saved')}
          >
            <ListFilter size={16} />
            <span>
              <EditableText 
                textKey="header.cellarLog" 
                defaultText={`Cellar Log (${savedCount})`} 
                interpolations={{ count: savedCount }} 
              />
            </span>
          </button>

          {/* Quick Action Symbols: Save, Share, Print (Symbol only, no text) */}
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
                title="Share Tasting Note"
                aria-label="Share"
                style={{ padding: '8px 10px', minWidth: '38px', justifyContent: 'center' }}
              >
                <Share2 size={16} />
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
    </header>
  );
}
