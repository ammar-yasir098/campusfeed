import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  UserCheck, 
  UserX, 
  Ban, 
  VolumeX, 
  EyeOff, 
  CheckCircle, 
  RefreshCw, 
  Globe, 
  AlertTriangle,
  Sparkles,
  Users,
  Award
} from 'lucide-react';
import { api, resolveImageUrl } from '../services/api';
import VerifiedBadge from './VerifiedBadge';

export default function AdminDashboard({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    suspendedUsers: 0,
    verifiedUsers: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers(searchQuery, statusFilter);
      setUsers(res.users || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to load user administration data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, statusFilter]);

  const handleStatusChange = async (userId, targetStatus) => {
    setActionLoadingId(userId);
    setFeedbackMsg({ type: '', text: '' });
    try {
      const res = await api.updateUserStatus(userId, targetStatus);
      setFeedbackMsg({ type: 'success', text: res.message || `User status updated to ${targetStatus}` });
      fetchUsers();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update user status' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleVerificationToggle = async (userId, currentVerifiedState) => {
    setActionLoadingId(userId);
    setFeedbackMsg({ type: '', text: '' });
    try {
      const res = await api.toggleUserVerification(userId, !currentVerifiedState);
      setFeedbackMsg({ type: 'success', text: res.message || 'User verification state updated' });
      fetchUsers();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update user verification' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleToggle = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    setActionLoadingId(userId);
    setFeedbackMsg({ type: '', text: '' });
    try {
      const res = await api.updateUserRole(userId, nextRole);
      setFeedbackMsg({ type: 'success', text: res.message || `User role set to ${nextRole}` });
      fetchUsers();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update user role' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'active':
        return { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' };
      case 'suspended':
        return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
      case 'banned':
        return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
      case 'muted':
        return { background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' };
      case 'shadowbanned':
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
      default:
        return { background: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1' };
    }
  };

  return (
    <div style={{ width: '100%', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ 
        padding: '1.75rem 2rem', 
        marginBottom: '2rem', 
        background: 'linear-gradient(135deg, #0f2942 0%, #1e3a8a 100%)',
        color: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 12px 30px rgba(15, 41, 66, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.12)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, color: '#93c5fd', marginBottom: '0.6rem' }}>
            <ShieldCheck size={16} />
            <span>CampusFeed Admin Security Control</span>
          </div>
          <h1 className="font-heading" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>
            User Lookup & Account Management
          </h1>
          <p style={{ fontSize: '0.92rem', color: '#cbd5e1', maxWidth: '600px', marginTop: '0.2rem' }}>
            Search users by ID, Email, IP Address, or Name. Issue account status enforcement (Ban, Suspend, Mute, Shadowban) and manage official verified blue check badges.
          </p>
        </div>

        <button 
          onClick={fetchUsers} 
          className="btn-secondary"
          style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(6px)' }}
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.2rem 1.4rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Total Registered</span>
            <Users size={18} color="#0f2942" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f2942', marginTop: '0.4rem' }}>
            {stats.totalUsers}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.2rem 1.4rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Active Accounts</span>
            <UserCheck size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '0.4rem' }}>
            {stats.activeUsers}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.2rem 1.4rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Enforced (Ban/Suspend)</span>
            <Ban size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', marginTop: '0.4rem' }}>
            {stats.bannedUsers + stats.suspendedUsers}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.2rem 1.4rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#2563eb', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Verified Accounts</span>
            <Award size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb', marginTop: '0.4rem' }}>
            {stats.verifiedUsers}
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMsg.text && (
        <div style={{ 
          background: feedbackMsg.type === 'error' ? '#fef2f2' : '#ecfdf5', 
          border: `1px solid ${feedbackMsg.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
          color: feedbackMsg.type === 'error' ? '#991b1b' : '#065f46',
          padding: '0.9rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          {feedbackMsg.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Search & Status Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text"
              className="input-field"
              placeholder="Search by User ID, Email, IP Address, or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.7rem', height: '44px', borderRadius: '10px' }}
            />
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {['all', 'active', 'suspended', 'banned', 'muted', 'shadowbanned'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  border: '1px solid',
                  borderColor: statusFilter === s ? '#0f2942' : '#cbd5e1',
                  background: statusFilter === s ? '#0f2942' : '#ffffff',
                  color: statusFilter === s ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {s}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* User Records Table Container */}
      <div className="glass-panel" style={{ background: '#ffffff', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="spin-icon" style={{ marginBottom: '0.5rem' }} />
            <p>Searching user records...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <Users size={36} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>No users found</h3>
            <p style={{ fontSize: '0.88rem' }}>No accounts matched query "{searchQuery}" with status filter "{statusFilter}".</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '1.1rem 1.25rem' }}>User Info</th>
                  <th style={{ padding: '1.1rem 1.25rem' }}>Email & Student ID</th>
                  <th style={{ padding: '1.1rem 1.25rem' }}>IP Address</th>
                  <th style={{ padding: '1.1rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '1.1rem 1.25rem' }}>Verification</th>
                  <th style={{ padding: '1.1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentUser && currentUser.id === u.id;
                  const isActionLoading = actionLoadingId === u.id;

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                      
                      {/* User Info */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div style={{ position: 'relative' }}>
                            {u.avatarUrl ? (
                              <img 
                                src={resolveImageUrl(u.avatarUrl)} 
                                alt={u.name} 
                                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                              />
                            ) : (
                              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f2942 0%, #1e40af 100%)', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</span>
                              {u.isVerified && (
                                <VerifiedBadge size={16} />
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: #{u.id}</span>
                              {u.role === 'admin' && (
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#eff6ff', color: '#1e40af', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                                  ADMIN
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email & Student ID */}
                      <td style={{ padding: '1rem 1.25rem', color: '#334155' }}>
                        <div>{u.email}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {u.studentId ? `Student ID: ${u.studentId}` : u.department || 'No department specified'}
                        </div>
                      </td>

                      {/* IP Address */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontFamily: 'monospace', color: '#475569' }}>
                          <Globe size={13} color="#94a3b8" />
                          <span>{u.lastLoginIp || '127.0.0.1'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          ...getStatusBadgeStyle(u.status)
                        }}>
                          {u.status}
                        </span>
                      </td>

                      {/* Manual Verification Badge Toggle */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <button
                          disabled={isActionLoading}
                          onClick={() => handleVerificationToggle(u.id, u.isVerified)}
                          style={{
                            background: u.isVerified ? '#eff6ff' : '#f8fafc',
                            border: `1px solid ${u.isVerified ? '#bfdbfe' : '#cbd5e1'}`,
                            color: u.isVerified ? '#1d4ed8' : '#64748b',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <CheckCircle size={14} color={u.isVerified ? '#2563eb' : '#94a3b8'} />
                          <span>{u.isVerified ? 'Verified' : 'Verify'}</span>
                        </button>
                      </td>

                      {/* Action Menu Buttons */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          
                          {/* Ban Action Button */}
                          {u.status !== 'banned' ? (
                            <button
                              disabled={isActionLoading || isSelf}
                              onClick={() => handleStatusChange(u.id, 'banned')}
                              title={isSelf ? "Cannot ban yourself" : "Ban account permanently"}
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fca5a5',
                                color: '#dc2626',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: isSelf ? 'not-allowed' : 'pointer',
                                opacity: isSelf ? 0.5 : 1
                              }}
                            >
                              Ban
                            </button>
                          ) : (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleStatusChange(u.id, 'active')}
                              style={{
                                background: '#ecfdf5',
                                border: '1px solid #6ee7b7',
                                color: '#059669',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Unban
                            </button>
                          )}

                          {/* Suspend Action Button */}
                          {u.status !== 'suspended' && u.status !== 'banned' && (
                            <button
                              disabled={isActionLoading || isSelf}
                              onClick={() => handleStatusChange(u.id, 'suspended')}
                              title="Suspend account temporarily"
                              style={{
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                color: '#d97706',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: isSelf ? 'not-allowed' : 'pointer',
                                opacity: isSelf ? 0.5 : 1
                              }}
                            >
                              Suspend
                            </button>
                          )}

                          {/* Mute Action Button */}
                          {u.status !== 'muted' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleStatusChange(u.id, 'muted')}
                              title="Mute user from posting or commenting"
                              style={{
                                background: '#f3e8ff',
                                border: '1px solid #d8b4fe',
                                color: '#7c3aed',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Mute
                            </button>
                          )}

                          {/* Shadowban Button */}
                          {u.status !== 'shadowbanned' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleStatusChange(u.id, 'shadowbanned')}
                              title="Shadowban user"
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Shadowban
                            </button>
                          )}

                          {/* Reactivate Button if not Active */}
                          {u.status !== 'active' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleStatusChange(u.id, 'active')}
                              title="Reactivate user"
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Activate
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
