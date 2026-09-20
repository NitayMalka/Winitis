import React from 'react';
import { Award, Wine } from 'lucide-react';
import EditableText from '../TextEditor/EditableText';
import { useTexts } from '../../context/TextContext';

export default function ConclusionStep({
  wineInfo,
  updateWineInfo,
  conclusionData,
  updateConclusionData
}) {
  const { t } = useTexts();

  const handleChange = (field, value) => {
    updateConclusionData({ ...conclusionData, [field]: value });
  };

  const handleWineInfoChange = (field, value) => {
    if (updateWineInfo) {
      updateWineInfo({ ...wineInfo, [field]: value });
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title font-serif">
          <Award size={22} color="#d4af37" />
          <EditableText textKey="conclusion.title" defaultText="Sommelier Conclusion & Rating" />
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* WINE IDENTITY & SPECS (Integrated into Rating Sector) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Wine size={18} color="#d4af37" />
            <h4 className="font-serif" style={{ fontSize: '1.05rem', color: 'var(--text-gold)', margin: 0 }}>
              <EditableText textKey="wineInfo.title" defaultText="Wine Identity & Specs" />
            </h4>
          </div>

          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                <EditableText textKey="wineInfo.wineNameLabel" defaultText="Wine Name *" />
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={wineInfo?.wineName || ''} 
                onChange={(e) => handleWineInfoChange('wineName', e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <EditableText textKey="wineInfo.vintageLabel" defaultText="Vintage Year" />
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={wineInfo?.vintage || ''} 
                onChange={(e) => handleWineInfoChange('vintage', e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <EditableText textKey="wineInfo.countryLabel" defaultText="Country" />
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={wineInfo?.country || ''} 
                onChange={(e) => handleWineInfoChange('country', e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <EditableText textKey="wineInfo.alcoholLabel" defaultText="Alcohol % (ABV)" />
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={wineInfo?.alcohol || ''} 
                onChange={(e) => handleWineInfoChange('alcohol', e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <EditableText textKey="conclusion.priceLabel" defaultText="Price / Estimated Value" />
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={conclusionData?.price || ''} 
                onChange={(e) => handleChange('price', e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* SCORE SLIDER (100-PT SCALE) */}
        <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-gold)', textAlign: 'center' }}>
          <div className="font-serif" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '32px', fontSize: '3.2rem', fontWeight: 900, color: 'var(--gold-light)', textShadow: '0 0 15px rgba(212,175,55,0.4)' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '1px' }}>
              <EditableText textKey="conclusion.scoreTitle" defaultText="Score" />
            </span>
            <span>{conclusionData?.score || 92}</span>
          </div>
          <input 
            type="range" 
            min="70" 
            max="100" 
            value={conclusionData?.score || 92} 
            onChange={(e) => handleChange('score', parseInt(e.target.value))}
            style={{ width: '80%', margin: '12px auto' }}
          />
        </div>

        {/* PERSONAL NOTES */}
        <div className="form-group">
          <label className="form-label">
            <EditableText textKey="conclusion.notesLabel" defaultText="Personal Sommelier Tasting Summary & Food Pairings" />
          </label>
          <textarea 
            className="form-textarea"
            value={conclusionData?.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>

      </div>
    </div>
  );
}
