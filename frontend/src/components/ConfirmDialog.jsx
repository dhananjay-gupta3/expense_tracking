import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({ open, title, message, detail, confirmLabel, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    cancelRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div
        className="dialog-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-icon">🗑️</div>
        <h3 id="dialog-title" className="dialog-title">
          {title}
        </h3>
        <p className="dialog-message">{message}</p>
        {detail && <div className="dialog-detail">{detail}</div>}

        <div className="dialog-actions">
          <button type="button" className="btn-dialog-cancel" onClick={onCancel} ref={cancelRef}>
            Cancel
          </button>
          <button type="button" className="btn-dialog-confirm" onClick={onConfirm}>
            {confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
