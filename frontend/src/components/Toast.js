// src/components/Toast.js
import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? 'var(--green)' : type === 'error' ? 'var(--red)' : 'var(--accent)';

  return (
    <div className="toast" style={{ background: bg }}>
      <span style={{ marginRight: 8 }}>
        {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
      </span>
      {message}
    </div>
  );
}
