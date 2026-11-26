import { useEffect, useRef, useState } from 'react';
import { BellIcon } from '../icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchNotifications, fetchUnreadCount, markAllNotificationsRead,
  markNotificationRead, selectNotifications,
} from '../../store/notificationsSlice';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// The unread badge + dropdown nav.js used to inject into the top bar.
export default function NotificationBell() {
  const dispatch = useAppDispatch();
  const {
    list: items, unreadCount: unread, listLoading, listError, unreadError, actionError,
  } = useAppSelector(selectNotifications);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  // Close when clicking anywhere outside the bell.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) dispatch(fetchNotifications());
  }

  function markAll(e) {
    e.stopPropagation();
    dispatch(markAllNotificationsRead());
  }

  function markOne(n) {
    if (n.read) return;
    dispatch(markNotificationRead(n.id));
  }

  return (
    <div ref={wrapRef} className="notification-bell" style={{ position: 'relative', marginRight: 16 }}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        title={unreadError || `${unread} unread notification${unread === 1 ? '' : 's'}`}
        style={{ position: 'relative', display: 'inline-flex', padding: 6, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }}
      >
        <BellIcon />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 10, minWidth: 14, textAlign: 'center' }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 42, right: 0, width: 340, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: 460, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Notifications</span>
            <button type="button" onClick={markAll} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '2px 6px' }}>
              Mark all read
            </button>
          </div>
          {unreadError && <div role="status" style={{ fontSize: 11, color: '#B91C1C', padding: '6px 12px' }}>Unread count unavailable: {unreadError}</div>}
          <div style={{ padding: 4, maxHeight: 380, overflowY: 'auto' }}>
            {listLoading && <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: 20 }}>Loading notifications…</div>}
            {!listLoading && listError && <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', padding: 20 }}>{listError}</div>}
            {!listLoading && !listError && items.length === 0 && <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '30px 16px' }}>🔔 No notifications</div>}
            {actionError && <div role="alert" style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', padding: 8 }}>{actionError}</div>}
            {!listLoading && !listError && items.map((n) => (
              <div
                key={n.id}
                onClick={() => markOne(n)}
                style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', background: n.read ? '#fff' : '#f8fafc', borderLeft: `3px solid ${n.read ? 'transparent' : '#2563eb'}`, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{n.title}</div>
                  {!n.read && <span style={{ width: 7, height: 7, background: '#2563eb', borderRadius: '50%', marginTop: 4, flexShrink: 0 }} />}
                </div>
                <div style={{ color: '#475569', fontSize: 12, marginTop: 3, lineHeight: 1.35 }}>{n.message}</div>
                <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 5 }}>{timeAgo(n.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
