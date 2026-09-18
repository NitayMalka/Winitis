import React from 'react';
import { Award, Star, Share2, Save, Sparkles, CheckCircle2, DollarSign } from 'lucide-react';

export default function ConclusionStep({ conclusionData, updateConclusionData, onSave, onShare }) {
  const handleChange = (field, value) => {
    updateConclusionData({ ...conclusionData, [field]: value });
  };

  const qualityOptions = ['Faulty', 'Poor', 'Acceptable', 'Good', 'Very Good', 'Outstanding'];
  const drinkWindowOptions = [
    'Too young - needs aging',
    'Can drink now, but has potential for aging (5-10+ years)',
    'Drink now (at peak performance)',
    'Past its best / declining'
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title font-serif">
          <Award size={22} color="#d4af37" />
          Sommelier Conclusion & Rating
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-gold)', background: 'rgba(212,175,55,0.1)', padding: '4px 12px', borderRadius: '12px' }}>
          Step 5 of 5
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SCORE SLIDER (100-PT SCALE) */}
        <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-gold)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-gold)', fontWeight: 600, marginBottom: '4px' }}>
            Overall Sommelier Score (100-Point Scale)
          </div>
          <div className="font-serif" style={{ fontSize: '3.2rem', fontWeight: 900, color: 'var(--gold-light)', textShadow: '0 0 15px rgba(212,175,55,0.4)' }}>
            {conclusionData.score || 92} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <input 
            type="range" 
            min="70" 
            max="100" 
            value={conclusionData.score || 92} 
            onChange={(e) => handleChange('score', parseInt(e.target.value))}
            style={{ width: '80%', margin: '12px auto' }}
          />
        </div>

        {/* PRICE / ESTIMATED VALUE (Moved to Rating Section) */}
        <div className="form-group">
          <label className="form-label">Price / Estimated Value</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. $85 or €75"
            value={conclusionData.price || ''} 
            onChange={(e) => handleChange('price', e.target.value)} 
          />
        </div>

        {/* QUALITY ASSESSMENT */}
        <div>
          <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
            Quality Assessment Level
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
            {qualityOptions.map((q) => (
              <button
                key={q}
                type="button"
                className={`btn ${(conclusionData.quality || 'Very Good') === q ? 'btn-gold' : 'btn-outline'}`}
                style={{ padding: '10px 4px', fontSize: '0.8rem' }}
                onClick={() => handleChange('quality', q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* DRINK WINDOW */}
        <div className="form-group">
          <label className="form-label">Drink Window & Aging Readiness</label>
          <select 
            className="form-select"
            value={conclusionData.drinkWindow || drinkWindowOptions[1]}
            onChange={(e) => handleChange('drinkWindow', e.target.value)}
          >
            {drinkWindowOptions.map(dw => <option key={dw} value={dw}>{dw}</option>)}
          </select>
        </div>

        {/* PERSONAL NOTES */}
        <div className="form-group">
          <label className="form-label">Personal Sommelier Tasting Summary & Food Pairings</label>
          <textarea 
            className="form-textarea"
            placeholder="Write your personal tasting notes, pairing suggestions (e.g. Ribeye, Prime Rib, Aged Gouda), or decanting observations..."
            value={conclusionData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>

        {/* SAVE & SHARE ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
          <button className="btn btn-primary" style={{ flex: 2, padding: '14px', fontSize: '1rem' }} onClick={onSave}>
            <Save size={18} />
            <span>Save Note to Cellar</span>
          </button>
          
          <button className="btn btn-gold" style={{ flex: 1, padding: '14px', fontSize: '1rem' }} onClick={onShare}>
            <Share2 size={18} />
            <span>Share Note</span>
          </button>
        </div>

      </div>
    </div>
  );
}
