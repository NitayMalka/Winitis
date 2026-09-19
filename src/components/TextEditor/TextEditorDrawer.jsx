import React, { useState } from 'react';
import { useTexts } from '../../context/TextContext';
import { X, Search, Copy, Download, RotateCcw, Check, Sparkles, Sliders, Edit3, HelpCircle } from 'lucide-react';

const CATEGORY_NAMES = {
  header: 'Header & App Branding',
  navigation: 'Wizard Stepper & Navigation',
  color: 'Step 1: Color Inspector',
  nose: 'Step 2: Nose & Aromas',
  palate: 'Step 3: Palate & Structure',
  conclusion: 'Step 4: Rating & Notes',
  wineInfo: 'Wine Identity Specs',
  verdict: 'Step 5: Verdict & Summary',
  cellar: 'Cellar Tasting Log',
  share: 'Share Wine Card Modal',
  guide: 'Sommelier Guide Modal',
  footer: 'App Footer'
};

export default function TextEditorDrawer() {
  const {
    texts,
    updateText,
    resetTexts,
    exportTextsJSON,
    isDrawerOpen,
    setIsDrawerOpen,
    isEditMode,
    setIsEditMode,
    toastMessage,
    hasCustomEdits
  } = useTexts();

  const [activeCategory, setActiveCategory] = useState('color');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isDrawerOpen) return null;

  // Flatten texts for searching or display by category
  const categories = Object.keys(texts);

  const getEntriesForCategory = (catKey) => {
    const obj = texts[catKey] || {};
    return Object.entries(obj).map(([subKey, val]) => ({
      path: `${catKey}.${subKey}`,
      key: subKey,
      val: val
    }));
  };

  const allEntries = categories.flatMap(cat => getEntriesForCategory(cat));
  const filteredEntries = searchTerm
    ? allEntries.filter(e =>
        e.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(e.val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : getEntriesForCategory(activeCategory);

  const handleCopyJSON = () => {
    exportTextsJSON();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 9999,
        background: 'rgba(5, 2, 8, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch'
      }}
      onClick={() => setIsDrawerOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          height: '100%',
          background: '#120815',
          borderLeft: '2px solid var(--gold-primary)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(212,175,55,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(184, 29, 64, 0.2) 0%, rgba(20, 10, 24, 0.9) 100%)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={20} color="var(--gold-primary)" />
              <h3 className="font-serif" style={{ color: 'var(--gold-light)', margin: 0, fontSize: '1.3rem' }}>
                App Texts Editor & Customizer
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Edit and rephrase any text across the app. Changes update live immediately.
            </p>
          </div>

          <button
            className="btn btn-outline btn-icon"
            onClick={() => setIsDrawerOpen(false)}
            style={{ borderColor: 'rgba(212,175,55,0.3)', color: 'var(--gold-light)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Informational Guidance Banner */}
        <div
          style={{
            padding: '12px 20px',
            background: 'rgba(212, 175, 55, 0.08)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '0.8rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gold)' }}>
            <Sparkles size={16} />
            <span>
              When done editing, click <strong>Export JSON</strong> or tell the assistant: <em>"I'm done editing"</em> to permanently integrate your phrases and deprecate this editor.
            </span>
          </div>

          <button
            type="button"
            className="btn btn-gold"
            style={{ padding: '4px 10px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
            onClick={handleCopyJSON}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Export JSON'}</span>
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} color="#a395a8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.82rem', height: '36px' }}
              placeholder="Search across all texts, keys, and phrases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={`btn ${isEditMode ? 'btn-gold' : 'btn-outline'}`}
            style={{ fontSize: '0.75rem', height: '36px', whiteSpace: 'nowrap' }}
            onClick={() => setIsEditMode(prev => !prev)}
            title="Toggle on-screen click-to-edit mode"
          >
            <Edit3 size={14} />
            <span>{isEditMode ? 'On-Screen Editing: ON' : 'On-Screen Editing: OFF'}</span>
          </button>

          {hasCustomEdits && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', height: '36px', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
              onClick={resetTexts}
              title="Reset all modifications back to baseline v0.1.0"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {/* Category Tabs (if not searching) */}
        {!searchTerm && (
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              padding: '10px 16px',
              gap: '6px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.2)'
            }}
          >
            {categories.map((catKey) => (
              <button
                key={catKey}
                type="button"
                className={`tag-pill ${activeCategory === catKey ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '5px 12px', whiteSpace: 'nowrap' }}
                onClick={() => setActiveCategory(catKey)}
              >
                {CATEGORY_NAMES[catKey] || catKey}
              </button>
            ))}
          </div>
        )}

        {/* Text List Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              No texts found matching "{searchTerm}"
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isLongText = typeof entry.val === 'string' && entry.val.length > 55;
              return (
                <div
                  key={entry.path}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(212, 175, 55, 0.15)',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--gold-light)', opacity: 0.85 }}>
                      {entry.path}
                    </span>
                  </div>

                  {isLongText ? (
                    <textarea
                      className="form-textarea"
                      rows={3}
                      style={{ fontSize: '0.85rem', width: '100%', resize: 'vertical' }}
                      value={entry.val}
                      onChange={(e) => updateText(entry.path, e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.85rem', width: '100%' }}
                      value={entry.val}
                      onChange={(e) => updateText(entry.path, e.target.value)}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(212,175,55,0.2)',
            background: 'rgba(10, 5, 12, 0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {toastMessage || 'Auto-saved in real-time to localStorage'}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
              onClick={handleCopyJSON}
            >
              <Download size={15} />
              <span>Download JSON</span>
            </button>

            <button
              type="button"
              className="btn btn-gold"
              style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              onClick={() => setIsDrawerOpen(false)}
            >
              <Check size={15} />
              <span>Done Viewing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
