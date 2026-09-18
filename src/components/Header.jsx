import React, { useState, useEffect } from 'react';
import { Wine, BookOpen, ListFilter, Download, Sparkles } from 'lucide-react';

export default function Header({ currentView, setCurrentView, savedCount, onOpenGuide }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

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
            <div className="brand-title font-serif">WINITIS</div>
            <div className="brand-subtitle">Red Wine Tasting PWA</div>
          </div>
        </div>

        <div className="nav-buttons">
          <button 
            className={`btn ${currentView === 'new' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCurrentView('new')}
          >
            <Wine size={16} />
            <span>New Tasting</span>
          </button>

          <button 
            className={`btn ${currentView === 'saved' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setCurrentView('saved')}
          >
            <ListFilter size={16} />
            <span>Cellar Log ({savedCount})</span>
          </button>

          <button className="btn btn-outline" onClick={onOpenGuide} title="Sommelier Guide">
            <BookOpen size={16} />
            <span style={{ display: 'none' }}>Guide</span>
          </button>

          {isInstallable && (
            <button className="btn btn-gold" onClick={handleInstallClick} title="Install App">
              <Download size={16} />
              <span>Install PWA</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
