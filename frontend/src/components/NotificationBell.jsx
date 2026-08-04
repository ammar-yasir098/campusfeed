import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BellOff, CheckCheck, Trash2,
  ThumbsUp, MessageCircle, Megaphone, X, ChevronRight, Sparkles, ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

// Modern Icon Badge per notification type
const NotifIcon = ({ type }) => {
  const styles = {
    like: {
      bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      border: '#93c5fd',
      icon: <ThumbsUp size={15} color="#1d4ed8" />
    },
    comment: {
      bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      border: '#6ee7b7',
      icon: <MessageCircle size={15} color="#047857" />
    },
    announcement: {
      bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '#fcd34d',
      icon: <Megaphone size={15} color="#b45309" />
    },
    takedown: {
      bg: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
      border: '#f87171',
      icon: <ShieldAlert size={15} color="#991b1b" />
    },
  };
  const s = styles[type] || styles.announcement;
  return (
    <div className="notif-icon-badge" style={{
      width: '38px',
      height: '38px',
      borderRadius: '12px',
      background: s.bg,
      border: `1px solid ${s.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    }}>
      {s.icon}
    </div>
  );
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function NotificationBell({ currentUser }) {
  const navigate = useNavigate();

  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const [filter, setFilter]               = useState('all'); // 'all' | 'unread'

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Notification fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Poll every 30s
  useEffect(() => {
    if (!currentUser) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close panel on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const handleClearAll = async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  // Click notification → mark read, close panel, navigate to post
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) { console.error(err); }
    }
    if (notif.postId) {
      setOpen(false);
      navigate(`/posts/${notif.postId}`);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  if (!currentUser) return null;

  return (
    <>
      {/* ── Bell Trigger Button ─────────────────────────────────────── */}
      <button
        onClick={() => { setOpen(true); fetchNotifications(); }}
        title="Notifications"
        className="notif-bell-trigger-btn"
        style={{
          position: 'relative',
          background: open ? '#eff6ff' : '#f8fafc',
          border: '1px solid',
          borderColor: open ? '#93c5fd' : '#cbd5e1',
          borderRadius: '12px',
          padding: '0.55rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          color: open ? '#1d4ed8' : '#334155',
          boxShadow: open ? '0 2px 10px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            fontSize: '0.65rem', fontWeight: 800,
            minWidth: '19px', height: '19px',
            borderRadius: '9999px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #ffffff',
            boxShadow: '0 2px 6px rgba(220,38,38,0.4)',
            animation: 'pulseBadge 2s infinite',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Portal for Backdrop & Drawer (Renders directly under <body> to escape parent CSS traps) ── */}
      {createPortal(
        <>
          {/* Backdrop Overlay */}
          {open && (
            <div
              onClick={() => setOpen(false)}
              className="notif-backdrop"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 99998,
                animation: 'fadeInOverlay 0.25s ease',
              }}
            />
          )}

          {/* Right-Side Premium Drawer */}
          <div
            className="notif-drawer-container"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              height: '100vh',
              width: '410px',
              maxWidth: '100vw',
              background: '#ffffff',
              boxShadow: '-10px 0 50px rgba(15, 23, 42, 0.25)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              transform: open ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >

            {/* Panel Header */}
            <div
              className="notif-header-panel"
              style={{
                background: 'linear-gradient(135deg, #0f2942 0%, #1e3a8a 100%)',
                padding: '1.25rem 1.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                flexShrink: 0,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Top Row: Title & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)', flexShrink: 0
                  }}>
                    <Bell size={18} color="#93c5fd" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                      Notifications
                    </h3>
                    <span className="notif-subtitle" style={{ fontSize: '0.72rem', color: '#93c5fd', opacity: 0.9 }}>
                      Stay updated with campus activity
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      title="Mark all as read"
                      className="notif-action-btn"
                      style={{
                        background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px', padding: '0.4rem 0.6rem',
                        cursor: 'pointer', color: '#93c5fd',
                        fontSize: '0.72rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                    >
                      <CheckCheck size={14} />
                      <span className="btn-text">Read All</span>
                    </button>
                  )}

                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      title="Clear all notifications"
                      className="notif-action-btn"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px', padding: '0.4rem 0.55rem',
                        cursor: 'pointer', color: '#fca5a5',
                        display: 'flex', alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                  <button
                    onClick={() => setOpen(false)}
                    title="Close Panel"
                    style={{
                      background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px', padding: '0.4rem 0.55rem',
                      cursor: 'pointer', color: '#ffffff',
                      display: 'flex', alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.25rem', borderRadius: '10px' }}>
                <button
                  onClick={() => setFilter('all')}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: filter === 'all' ? '#ffffff' : 'transparent',
                    color: filter === 'all' ? '#0f2942' : '#93c5fd',
                    boxShadow: filter === 'all' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  All Activity ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: filter === 'unread' ? '#ffffff' : 'transparent',
                    color: filter === 'unread' ? '#0f2942' : '#93c5fd',
                    boxShadow: filter === 'unread' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  Unread ({unreadCount})
                </button>
              </div>
            </div>

            {/* Notification List Container */}
            <div className="notif-list-container" style={{ overflowY: 'auto', flex: 1, padding: '1rem', background: '#f8fafc', WebkitOverflowScrolling: 'touch' }}>
              {loading && notifications.length === 0 ? (
                <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  <Sparkles size={24} color="#3b82f6" className="spin-icon" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: 600 }}>Fetching notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div style={{
                  padding: '3.5rem 1.5rem',
                  textAlign: 'center',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  marginTop: '0.5rem'
                }}>
                  <div style={{
                    width: '58px', height: '58px', borderRadius: '50%',
                    background: '#eff6ff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 1.1rem auto',
                    border: '1px solid #bfdbfe'
                  }}>
                    <BellOff size={26} color="#2563eb" />
                  </div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.02rem', color: '#0f2942', margin: '0 0 0.35rem 0' }}>
                    {filter === 'unread' ? 'No unread notifications' : 'No activity yet'}
                  </h4>
                  <p style={{ fontSize: '0.83rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    {filter === 'unread'
                      ? 'You are all caught up! Switch to "All Activity" to view past updates.'
                      : 'When someone likes your post or comments on your announcement, it will show up here.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredNotifications.map((notif) => {
                    const isUnread = !notif.isRead;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className="notif-card-item"
                        style={{
                          display: 'flex',
                          gap: '0.8rem',
                          padding: '0.95rem 1rem',
                          borderRadius: '14px',
                          background: isUnread ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                          border: '1px solid',
                          borderColor: isUnread ? '#bfdbfe' : '#e2e8f0',
                          boxShadow: isUnread
                            ? '0 4px 14px rgba(37, 99, 235, 0.08)'
                            : '0 2px 6px rgba(0, 0, 0, 0.02)',
                          cursor: notif.postId ? 'pointer' : 'default',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Left Accent Bar for Unread */}
                        {isUnread && (
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                          }} />
                        )}

                        <NotifIcon type={notif.type} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '0.86rem',
                            color: '#0f2942',
                            fontWeight: isUnread ? 700 : 500,
                            lineHeight: 1.45,
                            margin: 0,
                            wordBreak: 'break-word',
                          }}>
                            {notif.message}
                          </p>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '0.45rem'
                          }}>
                            <span style={{
                              fontSize: '0.72rem',
                              color: '#64748b',
                              fontWeight: 600,
                            }}>
                              {timeAgo(notif.createdAt)}
                            </span>

                            {notif.postId && (
                              <span style={{
                                fontSize: '0.72rem',
                                color: '#2563eb',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.12rem'
                              }}>
                                View Post <ChevronRight size={13} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Panel Footer */}
            {notifications.length > 0 && (
              <div style={{
                padding: '0.8rem 1.1rem',
                borderTop: '1px solid #e2e8f0',
                background: '#ffffff',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                  {filteredNotifications.length} of {notifications.length} items
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#1d4ed8',
                    background: '#eff6ff',
                    padding: '0.18rem 0.5rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    border: '1px solid #bfdbfe'
                  }}>
                    {unreadCount} pending
                  </span>
                )}
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulseBadge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Mobile Adjustments (<= 600px) */
        @media (max-width: 600px) {
          .notif-drawer-container {
            width: 100% !important;
            max-width: 100vw !important;
          }
          .notif-header-panel {
            padding: 1rem 1rem !important;
            gap: 0.75rem !important;
          }
          .notif-subtitle {
            display: none !important;
          }
          .notif-action-btn .btn-text {
            display: none !important;
          }
          .notif-action-btn {
            padding: 0.4rem 0.5rem !important;
          }
          .notif-list-container {
            padding: 0.75rem !important;
          }
        }
      `}</style>
    </>
  );
}
