import React from 'react';
import { BookOpen, X, Info, Award, Flame, Droplets, Eye } from 'lucide-react';
import EditableText from './TextEditor/EditableText';
import { useTexts } from '../context/TextContext';

export default function QuickReferenceModal({ onClose }) {
  const { tr } = useTexts();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
          <h3 className="font-serif" style={{ color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="#d4af37" />
            <EditableText textKey="guide.modalTitle" defaultText="Sommelier Red Wine Tasting Guide (WSET Level 3/4)" />
          </h3>
          <button className="btn btn-outline btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <h4 style={{ color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Eye size={16} color="#d4af37" /> 
              <EditableText textKey="guide.section1Title" defaultText="1. Appearance & Color Inspection" />
            </h4>
            <p>
              <EditableText textKey="guide.section1Intro" defaultText="Hold glass at a 45° angle over the white reference surface. Observe:" />
            </p>
            <ul style={{ paddingInlineStart: '20px', marginTop: '6px', color: 'var(--text-muted)' }}>
              <li><strong>{tr('Purple / Violet')}:</strong> <EditableText textKey="guide.section1Purple" defaultText="Youthful reds with high pigment (Malbec, Syrah, Gamay)." /></li>
              <li><strong>{tr('Ruby')}:</strong> <EditableText textKey="guide.section1Ruby" defaultText="Classic red hue for standard youthful/mid-age wines." /></li>
              <li><strong>{tr('Garnet')}:</strong> <EditableText textKey="guide.section1Garnet" defaultText="Orange-red hue indicating age or naturally light skin (Pinot Noir, Nebbiolo)." /></li>
              <li><strong>{tr('Tawny / Brick')}:</strong> <EditableText textKey="guide.section1Tawny" defaultText="Brownish-amber tint showing mature tertiary development (10-20+ yrs)." /></li>
            </ul>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <h4 style={{ color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Flame size={16} color="#b81d40" /> 
              <EditableText textKey="guide.section2Title" defaultText="2. Tannin Structure & Palate Balance" />
            </h4>
            <p>
              <EditableText textKey="guide.section2Intro" defaultText="Tannins come from grape skins, seeds, and oak barrels. Evaluate astringency on your gums:" />
            </p>
            <ul style={{ paddingInlineStart: '20px', marginTop: '6px', color: 'var(--text-muted)' }}>
              <li><strong>{tr('Low Tannin')}:</strong> <EditableText textKey="guide.section2Low" defaultText="Smooth, soft sensation (Pinot Noir, Gamay)." /></li>
              <li><strong>{tr('Medium Tannin')}:</strong> <EditableText textKey="guide.section2Med" defaultText="Balanced, velvety structure (Merlot, Tempranillo)." /></li>
              <li><strong>{tr('High Tannin')}:</strong> <EditableText textKey="guide.section2High" defaultText="Grippy, drying sensation requiring aging or rich food pairing (Cabernet Sauvignon, Nebbiolo)." /></li>
            </ul>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <h4 style={{ color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Award size={16} color="#d4af37" /> 
              <EditableText textKey="guide.section3Title" defaultText="3. Quality Scale & Aging Potential" />
            </h4>
            <p>
              <EditableText textKey="guide.section3Text" defaultText="Quality is judged by BLIC: Balance, Length, Intensity, and Complexity." />
            </p>
          </div>

        </div>

        <button className="btn btn-gold" style={{ width: '100%', marginTop: '24px' }} onClick={onClose}>
          <EditableText textKey="guide.closeBtn" defaultText="Got it! Return to Tasting" />
        </button>
      </div>
    </div>
  );
}
