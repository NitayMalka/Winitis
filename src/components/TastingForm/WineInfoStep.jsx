import React from 'react';
import { Wine } from 'lucide-react';

export default function WineInfoStep({ wineInfo, updateWineInfo }) {
  const handleChange = (field, value) => {
    updateWineInfo({ ...wineInfo, [field]: value });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title font-serif">
          <Wine size={22} color="#d4af37" />
          Wine Identity & Specs
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-gold)', background: 'rgba(212,175,55,0.1)', padding: '4px 12px', borderRadius: '12px' }}>
          Step 1 of 5
        </span>
      </div>

      <div className="form-grid">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Wine Name *</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. Château Margaux Grand Cru 2016"
            value={wineInfo.wineName || ''} 
            onChange={(e) => handleChange('wineName', e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Primary Grape Variety</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. Cabernet Sauvignon"
            value={wineInfo.grape || ''} 
            onChange={(e) => handleChange('grape', e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Vintage Year</label>
          <input 
            type="number" 
            className="form-input" 
            placeholder="e.g. 2018"
            value={wineInfo.vintage || ''} 
            onChange={(e) => handleChange('vintage', e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Country</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. France, USA, Italy"
            value={wineInfo.country || ''} 
            onChange={(e) => handleChange('country', e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Region</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. Bordeaux, Margaux, Napa Valley"
            value={wineInfo.region || ''} 
            onChange={(e) => handleChange('region', e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Alcohol % (ABV)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. 14.5%"
            value={wineInfo.alcohol || ''} 
            onChange={(e) => handleChange('alcohol', e.target.value)} 
          />
        </div>
      </div>
    </div>
  );
}
