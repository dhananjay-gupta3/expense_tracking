import { useEffect } from 'react';
import './Toast.css';

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(onDismiss, 3200);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <span className="toast-icon">{toast.type === 'error' ? '⚠️' : '✅'}</span>
      <span className="toast-message">{toast.message}</span>
      <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

export default Toast;
