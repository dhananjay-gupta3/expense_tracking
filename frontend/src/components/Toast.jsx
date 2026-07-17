import { useEffect } from 'react';
import './Toast.css';

const DEFAULT_DURATION_MS = 3200;

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(onDismiss, toast.duration || DEFAULT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const handleAction = () => {
    toast.action.onAction();
    onDismiss();
  };

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <span className="toast-icon">{toast.type === 'error' ? '⚠️' : '✅'}</span>
      <span className="toast-message">{toast.message}</span>
      {toast.action && (
        <button type="button" className="toast-action" onClick={handleAction}>
          {toast.action.label}
        </button>
      )}
      <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

export default Toast;
