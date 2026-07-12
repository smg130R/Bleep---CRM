import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Zap, Info } from 'lucide-react';

const typeIcons = { warning: AlertTriangle, success: CheckCircle, danger: AlertTriangle, ping: Zap, info: Info };
const typeColors = {
  warning: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  success: { bg: '#DCFCE7', border: '#16A34A', text: '#166534' },
  danger: { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },
  ping: { bg: '#EDE9FE', border: '#7C3AED', text: '#5B21B6' },
  info: { bg: '#DBEAFE', border: '#2563EB', text: '#1E40AF' },
};

const FloatingNotification = () => {
  const [queue, setQueue] = useState([]);
  const lastIdRef = useRef(null);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      const all = data.notifications || [];
      const latest = all.find(n => !n.isRead);
      if (!latest) return;
      if (latest.id === lastIdRef.current) return;
      lastIdRef.current = latest.id;
      setQueue(prev => [...prev, latest]);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchLatest();
    const i = setInterval(fetchLatest, 15000);
    return () => clearInterval(i);
  }, [fetchLatest]);

  const dismiss = (id) => {
    setQueue(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    if (queue.length === 0) return;
    const t = setTimeout(() => setQueue(prev => prev.slice(1)), 5000);
    return () => clearTimeout(t);
  }, [queue]);

  if (queue.length === 0) return null;

  const n = queue[0];
  const Icon = typeIcons[n.type] || Info;
  const colors = typeColors[n.type] || typeColors.info;

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 9999,
      maxWidth: 380, width: '100%',
      animation: 'slideIn 0.3s ease-out',
    }}>
      <div style={{
        background: colors.bg, border: `1px solid ${colors.border}`,
        borderRadius: 12, padding: '12px 16px',
        display: 'flex', gap: 12, alignItems: 'flex-start',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: colors.bg, color: colors.border,
        }}>
          <Icon size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 2 }}>{n.title}</div>
          <div style={{ fontSize: 12, color: colors.text, opacity: 0.85, lineHeight: 1.4 }}>{n.body}</div>
        </div>
        <button onClick={() => dismiss(n.id)} className="btn-ghost" style={{ padding: 2, flexShrink: 0, color: colors.text, opacity: 0.5 }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default FloatingNotification;
