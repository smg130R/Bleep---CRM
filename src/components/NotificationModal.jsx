import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCheck, AlertTriangle, Info, CheckCircle, Zap, Loader } from 'lucide-react';

const typeIcons = { warning: AlertTriangle, success: CheckCircle, danger: AlertTriangle, ping: Zap, info: Info };
const typeColors = {
  warning: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  success: { bg: '#DCFCE7', border: '#16A34A', text: '#166534' },
  danger: { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },
  ping: { bg: '#EDE9FE', border: '#7C3AED', text: '#5B21B6' },
  info: { bg: '#DBEAFE', border: '#2563EB', text: '#1E40AF' },
};

const NotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnread(data.unread || 0);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnread(0);
      }
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const markRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
      padding: '5rem 2rem 0 0',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)',
        width: '420px', maxWidth: '95vw', maxHeight: '70vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
            {unread > 0 && (
              <span style={{
                background: 'var(--primary)', color: '#fff', borderRadius: '999px',
                padding: '1px 8px', fontSize: 11, fontWeight: 700,
              }}>{unread}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {unread > 0 && (
              <button onClick={markAllRead} className="btn-ghost" style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCheck size={14} /> Mark All Read
              </button>
            )}
            <button onClick={onClose} className="btn-ghost" style={{ padding: 4 }}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <Loader size={20} className="animate-spin" style={{ display: 'inline', marginRight: 8 }} />
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-tertiary)' }}>
              <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <div style={{ fontSize: 14 }}>No notifications yet</div>
            </div>
          ) : (
            notifications.map(n => {
              const Icon = typeIcons[n.type] || Info;
              const colors = typeColors[n.type] || typeColors.info;
              return (
                <div key={n.id} onClick={() => !n.isRead && markRead(n.id)} style={{
                  padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-light)',
                  display: 'flex', gap: 12, cursor: 'pointer',
                  background: n.isRead ? 'transparent' : 'var(--bg-main)',
                  transition: 'background 0.15s',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: colors.bg, color: colors.border,
                  }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
