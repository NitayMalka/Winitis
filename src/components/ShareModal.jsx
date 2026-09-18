import React, { useState } from 'react';
import { shareWineNote, formatNoteText } from '../utils/share';
import { Share2, Copy, Check, X, Award, MapPin } from 'lucide-react';

export default function ShareModal({ note, onClose }) {
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  if (!note) return null;

  const handleShareClick = async () => {
    const res = await shareWineNote(note);
    if (res.success) {
      setShareStatus('Shared successfully!');
    } else {
      setShareStatus('Copied to clipboard');
    }
  };

  const handleCopyText = async () => {
    const text = formatNoteText(note);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const originStr = [note.region, note.country].filter(Boolean).join(', ') || 'N/A';
  const priceVal = note.conclusion?.price || note.price || 'N/A';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
          <h3 className="font-serif" style={{ color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={20} color="#d4af37" />
            Share Wine Evaluation Card
          </h3>
          <button className="btn btn-outline btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* High-End Styled Digital Tasting Card Preview */}
        <div 
          style={{ 
            background: 'linear-gradient(135deg, #1c0c1e 0%, #0a040b 100%)', 
            border: '2px solid var(--gold-primary)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '24px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            marginBottom: '20px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--gold-primary)' }}>
                WINITIS SOMMELIER SELECTION
              </div>
              <h2 className="font-serif" style={{ fontSize: '1.5rem', color: '#ffffff', marginTop: '4px' }}>
                {note.wineName || 'Red Wine Evaluation'}
              </h2>
              {note.vintage && (
                <div style={{ fontSize: '0.9rem', color: 'var(--gold-light)' }}>
                  Vintage {note.vintage}
                </div>
              )}
            </div>

            <div 
              className="font-serif"
              style={{ 
                background: 'linear-gradient(135deg, var(--gold-primary), var(--gold-dark))', 
                color: '#0f0910', 
                fontWeight: 900, 
                fontSize: '1.4rem', 
                padding: '8px 16px', 
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(212,175,55,0.3)'
              }}
            >
              {note.conclusion?.score || 92} / 100
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div>
              <strong style={{ color: 'var(--text-main)' }}>Origin:</strong> {originStr}<br/>
              <strong style={{ color: 'var(--text-main)' }}>Grape:</strong> {note.grape || 'Red Blend'}<br/>
              <strong style={{ color: 'var(--text-main)' }}>Alcohol:</strong> {note.alcohol || '13.5%'}<br/>
              <strong style={{ color: 'var(--text-main)' }}>Price:</strong> {priceVal}
            </div>
            <div>
              <strong style={{ color: 'var(--text-main)' }}>Color:</strong> {note.color?.name || 'Ruby'} <br/>
              <strong style={{ color: 'var(--text-main)' }}>Body:</strong> {note.palate?.body || 'Medium'}<br/>
              <strong style={{ color: 'var(--text-main)' }}>Tannins:</strong> {note.palate?.tannin || 'Medium'}<br/>
              <strong style={{ color: 'var(--text-main)' }}>Finish:</strong> {note.palate?.finish || 'Medium'}
            </div>
          </div>

          {note.nose?.aromas?.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: 600 }}>KEY AROMAS</div>
              <div style={{ fontSize: '0.85rem', color: '#ffffff', marginTop: '4px' }}>
                {note.nose.aromas.join(' • ')}
              </div>
            </div>
          )}

          {note.conclusion?.notes && (
            <div style={{ marginTop: '14px', fontSize: '0.85rem', color: 'var(--gold-light)', fontStyle: 'italic' }}>
              "{note.conclusion.notes}"
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleShareClick}>
            <Share2 size={16} /> Native Share
          </button>

          <button className="btn btn-gold" style={{ flex: 1 }} onClick={handleCopyText}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied Summary!' : 'Copy Text'}</span>
          </button>
        </div>

        {shareStatus && (
          <div style={{ textAlign: 'center', marginTop: '12px', color: 'var(--gold-light)', fontSize: '0.85rem' }}>
            {shareStatus}
          </div>
        )}
      </div>
    </div>
  );
}
