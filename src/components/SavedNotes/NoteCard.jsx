import React from 'react';
import { Share2, Trash2, Calendar, MapPin, Eye, DollarSign } from 'lucide-react';
import EditableText from '../TextEditor/EditableText';
import { useTexts } from '../../context/TextContext';

export default function NoteCard({ note, onView, onShare, onDelete }) {
  const { t } = useTexts();
  const originStr = [note.region, note.country].filter(Boolean).join(', ') || 'Origin Unspecified';
  const priceStr = note.conclusion?.price || note.price;

  return (
    <div className="note-card">
      <div>
        <div className="note-header">
          <div>
            <div className="note-wine-title font-serif">{note.wineName || 'Red Wine Evaluation'}</div>
            {note.vintage && (
              <div style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', fontWeight: 600 }}>
                <EditableText textKey="cellar.vintagePrefix" defaultText="Vintage" /> {note.vintage}
              </div>
            )}
          </div>
          <div className="note-badge-score font-serif">
            {note.conclusion?.score ?? 90}
          </div>
        </div>

        <div className="note-subtext">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} color="#a395a8" />
            {originStr}
          </span>
          <span style={{ margin: '0 8px' }}>•</span>
          <span>{note.grape || 'Red Variety'}</span>
          {priceStr && (
            <>
              <span style={{ margin: '0 8px' }}>•</span>
              <span style={{ color: 'var(--gold-light)', fontWeight: 600 }}>{priceStr}</span>
            </>
          )}
        </div>

        {/* Color & Finish Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          <div className="note-color-indicator" style={{ marginBottom: 0 }}>
            <div 
              style={{ 
                width: '14px', 
                height: '14px', 
                borderRadius: '50%', 
                backgroundColor: note.color?.hex || '#7e1022',
                border: '1px solid rgba(255,255,255,0.4)' 
              }} 
            />
            <span>{note.color?.name || 'Ruby'} ({note.color?.intensity || 'Medium'})</span>
          </div>

          {note.palate?.finish && (
            <div className="note-color-indicator" style={{ marginBottom: 0, color: 'var(--gold-light)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <span><EditableText textKey="cellar.finishPrefix" defaultText="Finish:" /> {note.palate.finish}</span>
            </div>
          )}
        </div>

        {/* Nose & Aromas Preview */}
        {note.nose?.aromas?.length > 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <strong style={{ color: 'var(--text-gold)' }}>
              <EditableText textKey="cellar.aromasPrefix" defaultText="Aromas:" />{' '}
            </strong>
            {note.nose.aromas.slice(0, 4).join(', ')}
            {note.nose.aromas.length > 4 && '...'}
          </div>
        )}

        {/* Notes summary */}
        {note.conclusion?.notes && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontStyle: 'italic', marginBottom: '16px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            "{note.conclusion.notes}"
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
        <button 
          className="btn btn-outline" 
          style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
          onClick={() => onView(note)}
        >
          <Eye size={14} /> <EditableText textKey="cellar.viewBtn" defaultText="View" />
        </button>

        <button 
          className="btn btn-gold" 
          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
          onClick={() => onShare(note)}
          title={t('cellar.shareBtn', 'Share')}
        >
          <Share2 size={14} />
        </button>

        <button 
          className="btn btn-outline" 
          style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
          onClick={() => onDelete(note.id)}
          title={t('cellar.deleteBtn', 'Delete')}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
