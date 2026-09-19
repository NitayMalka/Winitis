import React, { useState } from 'react';
import { useTexts } from '../../context/TextContext';
import { Edit3, FileText, Download, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export default function TextEditorFloatingBar() {
  const {
    isEditMode,
    setIsEditMode,
    setIsDrawerOpen,
    exportTextsJSON,
    hasCustomEdits
  } = useTexts();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [exportedFlash, setExportedFlash] = useState(false);

  const handleExport = () => {
    exportTextsJSON();
    setExportedFlash(true);
    setTimeout(() => setExportedFlash(false), 2200);
  };

  if (isCollapsed) {
    return (
      <button
        type="button"
        className="btn btn-gold"
        style={{
          position: 'fixed',
          bottom: '18px',
          right: '18px',
          zIndex: 9000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          borderRadius: '30px',
          padding: '8px 14px',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        onClick={() => setIsCollapsed(false)}
        title="Open Text Customizer Bar"
      >
        <Edit3 size={15} />
        <span>Text Customizer</span>
        <ChevronUp size={14} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '18px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9000,
        background: 'rgba(18, 8, 21, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid var(--gold-primary)',
        borderRadius: '32px',
        padding: '8px 16px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.7), 0 0 20px rgba(212,175,55,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '92vw',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}
    >
      {/* Title / Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '6px', borderRight: '1px solid rgba(212,175,55,0.25)' }}>
        <Sparkles size={15} color="var(--gold-primary)" />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-light)', whiteSpace: 'nowrap' }}>
          Text Customizer Mode
        </span>
        {hasCustomEdits && (
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', title: 'Custom edits active' }} />
        )}
      </div>

      {/* Button 1: Open All Texts Drawer */}
      <button
        type="button"
        className="btn btn-gold"
        style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '20px' }}
        onClick={() => setIsDrawerOpen(true)}
        title="Open drawer with all application texts categorized and searchable"
      >
        <FileText size={14} />
        <span>All Texts Drawer</span>
      </button>

      {/* Button 2: Toggle In-Place On-Screen Click-to-Edit */}
      <button
        type="button"
        className={`btn ${isEditMode ? 'btn-primary' : 'btn-outline'}`}
        style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '20px' }}
        onClick={() => setIsEditMode(prev => !prev)}
        title="Click directly on any text on screen to edit it in place"
      >
        <Edit3 size={14} />
        <span>{isEditMode ? 'On-Screen Edit: ON' : 'Click-to-Edit: OFF'}</span>
      </button>

      {/* Button 3: Export / Copy JSON */}
      <button
        type="button"
        className="btn btn-outline"
        style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '20px', borderColor: 'rgba(212,175,55,0.4)' }}
        onClick={handleExport}
        title="Download appTexts.json and copy to clipboard"
      >
        {exportedFlash ? <Check size={14} color="#4ade80" /> : <Download size={14} />}
        <span>{exportedFlash ? 'Exported!' : 'Export JSON'}</span>
      </button>

      {/* Collapse button */}
      <button
        type="button"
        onClick={() => setIsCollapsed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center'
        }}
        title="Minimize"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
