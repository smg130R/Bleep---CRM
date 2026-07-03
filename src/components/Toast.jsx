import React, { useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const Toast = ({ message, isError, onClose }) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className={`toast show`} id="toast">
      <div className="toast-content">
        <div className="toast-icon">
          {isError ? (
            <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
          ) : (
            <CheckCircle size={20} style={{ color: 'var(--success)' }} />
          )}
        </div>
        <span className="toast-message" id="toast-message">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
