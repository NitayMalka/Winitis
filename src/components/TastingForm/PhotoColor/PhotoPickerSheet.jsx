/** Modal sheet hosting the photo picker on top of the original ColorStep. */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import PhotoColorStep from './PhotoColorStep.jsx';

export default function PhotoPickerSheet({ open, onClose, onConfirm, t, returnFocusRef }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const ret = returnFocusRef?.current;
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener('keydown', onKey); ret?.focus?.(); };
  }, [open]);
  if (!open) return null;
  return (
    <div className="pcs-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pcs-sheet" role="dialog" aria-modal="true" aria-label="Pick colour from a photo" data-testid="photo-sheet">
        <button ref={closeRef} type="button" className="btn btn-outline btn-icon pcs-sheet-close" onClick={onClose} aria-label="Close photo picker"><X size={18} /></button>
        <PhotoColorStep onConfirm={onConfirm} t={t} />
      </div>
    </div>
  );
}
