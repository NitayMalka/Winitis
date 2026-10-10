import React, { useState } from 'react';
import { shareWineNote, formatNoteText } from '../utils/share';
import { Share2, Copy, Check, X, Award, MapPin } from 'lucide-react';
import EditableText from './TextEditor/EditableText';
import { useTexts } from '../context/TextContext';

export default function ShareModal({ note, onClose }) {
  const { t, tr, lang } = useTexts();
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  if (!note) return null;

  const handleShareClick = async () => {
    const res = await shareWineNote(note, tr, lang);
    if (res.success) {
      setShareStatus(t('share.sharedSuccess', 'Shared successfully!'));
    } else {
      setShareStatus(t('share.copiedClipboard', 'Copied to clipboard'));
    }
  };

  const handleCopyText = async () => {
    const text = formatNoteText(note, tr, lang);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const originStr = [note.region, note.country].filter(Boolean).join(', ') || tr('N/A');
  const priceVal = note.conclusion?.price || note.price || tr('N/A');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
          <h3 className="font-serif" style={{ color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={20} color="#d4af37" />
            <EditableText textKey="share.modalTitle" defaultText="Share Wine Evaluation Card" />
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
                <EditableText textKey="share.brandBadge" defaultText="WINITIS SOMMELIER SELECTION" />
              </div>
              <h2 className="font-serif" style={{ fontSize: '1.5rem', color: '#ffffff', marginTop: '4px' }}>
                {note.wineName || tr('Red Wine Evaluation')}
              </h2>
              {note.vintage && (
                <div style={{ fontSize: '0.9rem', color: 'var(--gold-light)' }}>
                  <EditableText textKey="share.vintagePrefix" defaultText="Vintage" /> {note.vintage}
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
              {note.conclusion?.score ?? 92} <EditableText textKey="share.scoreMax" defaultText="/ 100" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div>
              <strong style={{ color: 'var(--text-main)' }}><EditableText textKey="share.originLabel" defaultText="Origin:" /></strong> {originStr}<br/>
              <strong style={{ color: 'var(--text-main)' }}><EditableText textKey="share.grapeLabel" defaultText="Grape:" /></strong> {note.grape || tr('Red Blend')}<br/>
              <strong style={{ color: 'var(--text-main)' }}><EditableText textKey="share.alcoholLabel" defaultText="Alcohol:" /></strong> {note.alcohol || '13.5%'}<br/>
              <strong style={{ color: 'var(--text-main)' }}><EditableText textKey="share.priceLabel" defaultText="Price:" /></strong> {priceVal}
            </div>
            <div>
              <strong style={{ color: 'var(--text-main)' }}><EditableText textKey="share.colorLabel" defaultText="Color:" /></strong> {tr(note.color?.name || 'Ruby')} <br/>
              <strong style={{ color: 'var(--text-main)' }}><EditableText textKey="share.bodyLabel" defaultText="Body:" /></strong> {tr(note.palate?.body || 'Medium')}<br/>
              <strong style={{ color: 'var(--text-main)' }}><EditableText textKey="share.tanninsLabel" defaultText="Tannins:" /></strong> {tr(note.palate?.tannin || 'Medium')}<br/>
              <strong style={{ color: 'var(--text-main)' }}><EditableText textKey="share.finishLabel" defaultText="Finish:" /></strong> {tr(note.palate?.finish || 'Medium')}
            </div>
          </div>

          {note.nose?.aromas?.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: 600 }}>
                <EditableText textKey="share.keyAromasTitle" defaultText="KEY AROMAS" />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#ffffff', marginTop: '4px' }}>
                {note.nose.aromas.map(a => tr(a)).join(' • ')}
              </div>
            </div>
          )}

          {note.conclusion?.notes && (
            <div dir="auto" style={{ marginTop: '14px', fontSize: '0.85rem', color: 'var(--gold-light)', fontStyle: 'italic' }}>
              "{note.conclusion.notes}"
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleShareClick}>
            <Share2 size={16} /> <EditableText textKey="share.nativeShareBtn" defaultText="Native Share" />
          </button>

          <button className="btn btn-gold" style={{ flex: 1 }} onClick={handleCopyText}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>
              {copied ? (
                <EditableText textKey="share.copiedTextBtn" defaultText="Copied Summary!" />
              ) : (
                <EditableText textKey="share.copyTextBtn" defaultText="Copy Text" />
              )}
            </span>
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
