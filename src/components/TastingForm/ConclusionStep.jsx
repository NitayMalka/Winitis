import React, { useRef, useState } from 'react';
import { Award, Wine, Calendar, Globe, Flame, DollarSign } from 'lucide-react';
import EditableText from '../TextEditor/EditableText';
import { useTexts } from '../../context/TextContext';

const getScoreTier = (s) => {
  if (s === 0) return { label: 'Unworthy', color: '#ef4444' };
  if (s >= 96) return { label: 'Extraordinary', color: '#f59e0b' };
  if (s >= 90) return { label: 'Outstanding', color: '#d4af37' };
  if (s >= 85) return { label: 'Very Good', color: '#38bdf8' };
  if (s >= 80) return { label: 'Good', color: '#4ade80' };
  return { label: 'Mediocre', color: '#9ca3af' };
};

function VerticalScoreGauge({ score, onChange }) {
  const { tr } = useTexts();
  const isUnworthy = score === 0;
  const displayScore = isUnworthy ? 0 : Math.max(70, Math.min(100, score));
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // percentage from top: 100 pts -> 0% (top), 70 pts -> 100% (bottom)
  const pctFromTop = isUnworthy ? 100 : ((100 - displayScore) / (100 - 70)) * 100;

  const updateFromPointer = (clientY) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawY = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(rect.height, rawY));
    const ratio = clampedY / rect.height; // 0 = top (100), 1 = bottom (70)
    const newScore = Math.round(100 - ratio * 30);
    onChange(newScore);
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updateFromPointer(e.clientY);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (score === 0) onChange(70);
      else onChange(Math.min(100, score + 1));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (score > 70) onChange(Math.max(70, score - 1));
      else if (score === 70) onChange(0);
    }
  };

  const toggleUnworthy = () => {
    if (isUnworthy) {
      onChange(90);
    } else {
      onChange(0);
    }
  };

  const tier = getScoreTier(score);

  return (
    <div className="rating-score-col">
      {/* Top: Score Readout */}
      <div className="vertical-score-readout">
        <span className="score-label font-serif">
          <EditableText textKey="conclusion.scoreTitle" defaultText="Score" />
        </span>
        <span className={`score-number font-serif ${isUnworthy ? 'unworthy' : ''}`}>
          {score}
        </span>
        <span className={`score-tier-badge ${isUnworthy ? 'unworthy' : ''}`} style={{ color: tier.color }}>
          {tr(tier.label)}
        </span>
      </div>

      {/* Middle: Vertical Track */}
      <div
        ref={trackRef}
        className={`vertical-score-track ${isDragging ? 'dragging' : ''}`}
        tabIndex={0}
        role="slider"
        aria-label={tr('Wine Points Score')}
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        title={tr('Drag vertically to change score')}
        dir="ltr"
      >
        {/* Fill from bottom */}
        <div
          className="vertical-score-fill"
          style={{
            height: isUnworthy ? '0%' : `${100 - pctFromTop}%`
          }}
        />

        {/* Major Ticks */}
        <div className="vertical-score-ticks">
          <span style={{ top: '2%' }}>100</span>
          <span style={{ top: '33.3%' }}>90</span>
          <span style={{ top: '66.6%' }}>80</span>
          <span style={{ top: '98%' }}>70</span>
        </div>

        {/* Draggable Knob */}
        {!isUnworthy && (
          <div
            className={`vertical-score-thumb ${isDragging ? 'dragging' : ''}`}
            style={{
              top: `${pctFromTop}%`
            }}
          >
            <div className="thumb-grip-line" />
            <div className="thumb-grip-line" />
          </div>
        )}
      </div>

      {/* Bottom: Dedicated 0 score option for unworthy wines */}
      <button
        type="button"
        className={`unworthy-pill-btn ${isUnworthy ? 'active' : ''}`}
        onClick={toggleUnworthy}
        title={tr(isUnworthy ? 'Click to restore score' : 'Mark wine as defective or unworthy of scoring')}
      >
        <span className="unworthy-icon">{isUnworthy ? '✕' : '0'}</span>
        <span>
          <EditableText textKey="conclusion.unworthyBtn" defaultText="Unworthy (0)" />
        </span>
      </button>
    </div>
  );
}

export default function ConclusionStep({
  wineInfo,
  updateWineInfo,
  conclusionData,
  updateConclusionData
}) {
  const { tr } = useTexts();
  const currentScore = typeof conclusionData?.score === 'number' ? conclusionData.score : 92;

  const handleChange = (field, value) => {
    updateConclusionData({ ...conclusionData, [field]: value });
  };

  const handleWineInfoChange = (field, value) => {
    if (updateWineInfo) {
      updateWineInfo({ ...wineInfo, [field]: value });
    }
  };

  return (
    <div className="card rating-step-card">
      {/* Header */}
      <div className="card-header" style={{ marginBottom: '12px', paddingBottom: '8px' }}>
        <h3 className="card-title font-serif">
          <Award size={20} color="#d4af37" />
          <EditableText textKey="conclusion.title" defaultText="Sommelier Conclusion & Rating" />
        </h3>
      </div>

      {/* Side-by-Side Cockpit: Text Fields Left, Vertical Score Gauge Right */}
      <div className="rating-sector-layout">
        
        {/* LEFT COLUMN: TEXT FIELDS */}
        <div className="rating-fields-col">
          
          {/* Row 1: Wine Name */}
          <div className="compact-form-group">
            <label className="compact-form-label">
              <Wine size={12} color="#d4af37" />
              <EditableText textKey="wineInfo.wineNameLabel" defaultText="Wine Name *" />
            </label>
            <input 
              type="text" 
              className="compact-form-input" 
              value={wineInfo?.wineName || ''} 
              onChange={(e) => handleWineInfoChange('wineName', e.target.value.slice(0, 23))} 
              maxLength={23}
            />
          </div>

          {/* Row 2: Specs 2x2 Grid (Vintage, Country, Alcohol, Price) */}
          <div className="compact-specs-grid">
            <div className="compact-form-group">
              <label className="compact-form-label">
                <Calendar size={11} color="#d4af37" />
                <EditableText textKey="wineInfo.vintageLabel" defaultText="Vintage" />
              </label>
              <input 
                type="text" 
                className="compact-form-input" 
                value={wineInfo?.vintage || ''} 
                onChange={(e) => handleWineInfoChange('vintage', e.target.value)} 
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-form-label">
                <Globe size={11} color="#d4af37" />
                <EditableText textKey="wineInfo.countryLabel" defaultText="Country" />
              </label>
              <input 
                type="text" 
                className="compact-form-input" 
                value={wineInfo?.country || ''} 
                onChange={(e) => handleWineInfoChange('country', e.target.value)} 
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-form-label">
                <Flame size={11} color="#ef4444" />
                <EditableText textKey="wineInfo.alcoholLabel" defaultText="Alcohol %" />
              </label>
              <input 
                type="text" 
                className="compact-form-input" 
                value={wineInfo?.alcohol || ''} 
                onChange={(e) => handleWineInfoChange('alcohol', e.target.value)} 
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-form-label">
                <DollarSign size={11} color="#d4af37" />
                <EditableText textKey="conclusion.priceLabel" defaultText="Price" />
              </label>
              <input 
                type="text" 
                className="compact-form-input" 
                value={conclusionData?.price || ''} 
                onChange={(e) => handleChange('price', e.target.value)} 
              />
            </div>
          </div>

          {/* Row 3: Personal Sommelier Tasting Summary & Food Pairings */}
          <div className="compact-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="compact-form-label">
                <EditableText textKey="conclusion.notesLabel" defaultText="Personal Sommelier Summary & Food Pairings" />
              </label>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.8 }}>
                {(conclusionData?.notes || '').length}/160
              </span>
            </div>
            <textarea 
              className="compact-form-textarea"
              value={conclusionData?.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              maxLength={160}
              placeholder={tr('e.g. Elegant vintage with fine tannins, pairs with roasted duck...')}
            />
          </div>

        </div>

        {/* RIGHT COLUMN: VERTICAL SCORE GAUGE + UNWORTHY (0) OPTION */}
        <VerticalScoreGauge
          score={currentScore}
          onChange={(val) => handleChange('score', val)}
        />

      </div>
    </div>
  );
}
