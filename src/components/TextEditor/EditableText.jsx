import React, { useState, useRef, useEffect } from 'react';
import { useTexts } from '../../context/TextContext';
import { Edit3, Check, X } from 'lucide-react';

export default function EditableText({
  textKey,
  defaultText = '',
  as: Component = 'span',
  className = '',
  style = {},
  multiline = false,
  interpolations = null,
  children
}) {
  const { t, updateText, isEditMode } = useTexts();
  const [isEditing, setIsEditing] = useState(false);
  const rawValue = t(textKey, defaultText);
  const [tempValue, setTempValue] = useState(rawValue);
  const inputRef = useRef(null);

  useEffect(() => {
    setTempValue(rawValue);
  }, [rawValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) inputRef.current.select();
    }
  }, [isEditing]);

  const displayedText = t(textKey, defaultText, interpolations);

  if (!isEditMode) {
    return <Component className={className} style={style}>{displayedText}</Component>;
  }

  const handleSave = (e) => {
    if (e) e.stopPropagation();
    updateText(textKey, tempValue);
    setIsEditing(false);
  };

  const handleCancel = (e) => {
    if (e) e.stopPropagation();
    setTempValue(rawValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave(e);
    } else if (e.key === 'Escape') {
      handleCancel(e);
    }
  };

  if (isEditing) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(212, 175, 55, 0.2)',
          padding: '2px 6px',
          borderRadius: '6px',
          border: '1px solid var(--gold-primary)',
          zIndex: 10,
          ...style
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {multiline ? (
          <textarea
            ref={inputRef}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            style={{
              background: '#120815',
              color: '#fff',
              border: '1px solid var(--gold-primary)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.85rem',
              width: '100%',
              minWidth: '220px'
            }}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              background: '#120815',
              color: '#fff',
              border: '1px solid var(--gold-primary)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              fontWeight: 'inherit',
              minWidth: '120px'
            }}
          />
        )}
        <button
          type="button"
          onClick={handleSave}
          style={{
            background: 'var(--gold-primary)',
            color: '#0f0910',
            border: 'none',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Save (Enter)"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Cancel (Esc)"
        >
          <X size={14} />
        </button>
      </span>
    );
  }

  return (
    <Component
      className={`${className} winitis-editable-text`}
      style={{
        cursor: 'pointer',
        position: 'relative',
        outline: '1px dashed rgba(212, 175, 55, 0.45)',
        outlineOffset: '2px',
        borderRadius: '3px',
        transition: 'all 0.15s ease',
        ...style
      }}
      title={`Click to edit: ${textKey}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {displayedText}
      <span className="winitis-editable-badge" style={{ pointerEvents: 'none', marginLeft: '4px', opacity: 0.65 }}>
        <Edit3 size={11} color="var(--gold-primary)" />
      </span>
    </Component>
  );
}
