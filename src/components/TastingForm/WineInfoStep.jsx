import React from 'react';
import { Wine } from 'lucide-react';
import EditableText from '../TextEditor/EditableText';
import { useTexts } from '../../context/TextContext';

export default function WineInfoStep({ wineInfo, updateWineInfo }) {
  const { t } = useTexts();

  const handleChange = (field, value) => {
    updateWineInfo({ ...wineInfo, [field]: value });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title font-serif">
          <Wine size={22} color="#d4af37" />
          <EditableText textKey="wineInfo.title" defaultText="Wine Identity & Specs" />
        </h3>
      </div>

      <div className="form-grid">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">
            <EditableText textKey="wineInfo.wineNameLabel" defaultText="Wine Name *" />
          </label>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('wineInfo.wineNamePlaceholder', 'e.g. Château Margaux Grand Cru 2016')}
            value={wineInfo.wineName || ''} 
            onChange={(e) => handleChange('wineName', e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <EditableText textKey="wineInfo.grapeLabel" defaultText="Primary Grape Variety" />
          </label>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('wineInfo.grapePlaceholder', 'e.g. Cabernet Sauvignon')}
            value={wineInfo.grape || ''} 
            onChange={(e) => handleChange('grape', e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <EditableText textKey="wineInfo.vintageLabel" defaultText="Vintage Year" />
          </label>
          <input 
            type="number" 
            className="form-input" 
            placeholder={t('wineInfo.vintagePlaceholder', 'e.g. 2018')}
            value={wineInfo.vintage || ''} 
            onChange={(e) => handleChange('vintage', e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <EditableText textKey="wineInfo.countryLabel" defaultText="Country" />
          </label>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('wineInfo.countryPlaceholder', 'e.g. France, USA, Italy')}
            value={wineInfo.country || ''} 
            onChange={(e) => handleChange('country', e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <EditableText textKey="wineInfo.regionLabel" defaultText="Region" />
          </label>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('wineInfo.regionPlaceholder', 'e.g. Bordeaux, Margaux, Napa Valley')}
            value={wineInfo.region || ''} 
            onChange={(e) => handleChange('region', e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <EditableText textKey="wineInfo.alcoholLabel" defaultText="Alcohol % (ABV)" />
          </label>
          <input 
            type="text" 
            className="form-input" 
            placeholder={t('wineInfo.alcoholPlaceholder', 'e.g. 14.5%')}
            value={wineInfo.alcohol || ''} 
            onChange={(e) => handleChange('alcohol', e.target.value)} 
          />
        </div>
      </div>
    </div>
  );
}
