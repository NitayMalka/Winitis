import React from 'react';
import VerdictStep from '../TastingForm/VerdictStep';
import { X } from 'lucide-react';

export default function VerdictModal({ note, onClose, onShare }) {
  if (!note) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 9500,
        background: 'rgba(5, 2, 8, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-content verdict-modal-window"
        style={{
          maxWidth: '980px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            type="button"
            className="btn btn-outline btn-icon"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <VerdictStep
          wineNote={note}
          updateWineNote={() => {}}
          onShare={() => {
            if (onShare) onShare(note);
          }}
          readOnly={true}
        />
      </div>
    </div>
  );
}
