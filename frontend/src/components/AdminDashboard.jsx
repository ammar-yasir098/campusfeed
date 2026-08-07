import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  Sparkles,
  Users,
  Award,
  ChevronDown,
  Clock,
  Flag,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  Play
} from 'lucide-react';
import { api, resolveImageUrl } from '../services/api';
import MediaLightboxModal from './MediaLightboxModal';
import VerifiedBadge from './VerifiedBadge';

function AdminVideoPlayer({ videoUrl, thumbnailUrl, onEnlarge }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoUrl) return;

    const handleFullscreenIntercept = () => {
      if (document.fullscreenElement === videoEl || document.webkitFullscreenElement === videoEl) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        onEnlarge(resolveImageUrl(videoUrl));
      }
    };

    videoEl.addEventListener('fullscreenchange', handleFullscreenIntercept);
    videoEl.addEventListener('webkitbeginfullscreen', handleFullscreenIntercept);
    return () => {
      videoEl.removeEventListener('fullscreenchange', handleFullscreenIntercept);
      videoEl.removeEventListener('webkitbeginfullscreen', handleFullscreenIntercept);
    };
  }, [videoUrl, onEnlarge]);

  const handleStartPlay = (e) => {
    if (e) e.stopPropagation();
    setIsPlaying(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.preload = 'auto';
        videoRef.current.play().catch(() => {});
      }
    }, 50);
  };

  return (
    <div style={{ position: 'relative', marginTop: '0.75rem', borderRadius: '0px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#0f172a' }}>
      {!isPlaying && thumbnailUrl ? (
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleStartPlay}>
          <img
            src={resolveImageUrl(thumbnailUrl)}
            alt="Video thumbnail"
            style={{
              width: '100%',
              maxHeight: '260px',
              objectFit: 'cover',
              display: 'block',
              borderRadius: '0px'
            }}
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={resolveImageUrl(videoUrl)}
          controls
          autoPlay={isPlaying}
          preload={thumbnailUrl ? "auto" : "metadata"}
          onLoadedMetadata={(e) => {
            if (e.target && !isPlaying && !thumbnailUrl) {
              e.target.currentTime = 0.1;
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          style={{
            width: '100%',
            maxHeight: '260px',
            display: 'block',
            borderRadius: '0px',
            cursor: isPlaying ? 'default' : 'pointer'
          }}
          onClick={(e) => {
            if (!isPlaying) handleStartPlay(e);
          }}
        />
      )}

      {!isPlaying && (
        <button
          type="button"
          onClick={handleStartPlay}
          className="modern-play-btn"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255, 255, 255, 0.4)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            zIndex: 10,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          title="Play Video"
        >
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.5)'
          }}>
            <Play size={20} style={{ marginLeft: '3px' }} fill="#ffffff" color="#ffffff" />
          </div>
        </button>
      )}
    </div>
  );
}

export default function AdminDashboard({ currentUser }) {
  const [activeMedia, setActiveMedia] = useState(null);
  const [adminTab, setAdminTab] = useState('users'); // 'users' | 'reports'

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    suspendedUsers: 0,
    verifiedUsers: 0
  });

  // Reports Queue State
  const [reports, setReports] = useState([]);
  const [groupedReports, setGroupedReports] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [uniquePostsCount, setUniquePostsCount] = useState(0);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportActionId, setReportActionId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });
  const [openMenuUserId, setOpenMenuUserId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target && typeof e.target.closest === 'function') {
        if (!e.target.closest('.action-menu-container')) {
          setOpenMenuUserId(null);
        }
      } else {
        setOpenMenuUserId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

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

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.getAdminReports();
      setReports(res.reports || []);
      setGroupedReports(res.groupedReports || []);
      setPendingCount(res.pendingCount || 0);
      setUniquePostsCount(res.uniquePostsCount || (res.groupedReports ? res.groupedReports.length : 0));
    } catch (err) {
      console.error('Failed to fetch admin reports queue:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDismissSingleReport = async (reportId) => {
    setReportActionId(reportId);
    setFeedbackMsg({ type: '', text: '' });
    try {
      await api.dismissReport(reportId);
      setFeedbackMsg({ type: 'success', text: 'Report notice dismissed successfully.' });
      fetchReports();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to dismiss report.' });
    } finally {
      setReportActionId(null);
    }
  };

  const handleDismissAllPostReports = async (postId) => {
    setReportActionId(postId);
    setFeedbackMsg({ type: '', text: '' });
    try {
      const res = await api.dismissAllPostReports(postId);
      setFeedbackMsg({ type: 'success', text: res.message || 'All report notices for this post cleared.' });
      fetchReports();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to dismiss post reports.' });
    } finally {
      setReportActionId(null);
    }
  };

  const handleTakedownGroupedPost = async (postId, mainReason) => {
    const reason = window.prompt(
      'Enter administrative feedback / reason for taking down this reported post:',
      `This post was taken down by UMT Admin following student reports for: ${mainReason || 'Violating Community Guidelines'}.`
    );
    if (reason === null) return;

    setReportActionId(postId);
    setFeedbackMsg({ type: '', text: '' });
    try {
      await api.takedownPost(postId, reason);
      setFeedbackMsg({ type: 'success', text: 'Post taken down and reports status set to actioned!' });
      fetchReports();
      fetchUsers();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to process post takedown.' });
    } finally {
      setReportActionId(null);
    }
  };

  const handleDeleteGroupedPost = async (postId) => {
    if (!window.confirm("Are you sure you want to permanently delete this post? This action cannot be undone.")) {
      return;
    }

    setReportActionId(postId);
    setFeedbackMsg({ type: '', text: '' });
    try {
      await api.deletePost(postId);
      setFeedbackMsg({ type: 'success', text: 'Post deleted permanently!' });
      fetchReports();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to delete post.' });
    } finally {
      setReportActionId(null);
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
      <div className="glass-panel admin-header-banner" style={{
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
      <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel admin-kpi-card" style={{ padding: '1.2rem 1.4rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Total Registered</span>
            <Users size={18} color="#0f2942" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f2942', marginTop: '0.4rem' }}>
            {stats.totalUsers}
          </div>
        </div>

        <div className="glass-panel admin-kpi-card" style={{ padding: '1.2rem 1.4rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Active Accounts</span>
            <UserCheck size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '0.4rem' }}>
            {stats.activeUsers}
          </div>
        </div>

        <div className="glass-panel admin-kpi-card" style={{ padding: '1.2rem 1.4rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Enforced</span>
            <Ban size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', marginTop: '0.4rem' }}>
            {stats.bannedUsers + stats.suspendedUsers}
          </div>
        </div>

        <div className="glass-panel admin-kpi-card" style={{ padding: '1.2rem 1.4rem', background: '#ffffff' }}>
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

      {/* Admin Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setAdminTab('users')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: adminTab === 'users' ? '#0f2942' : '#ffffff',
            color: adminTab === 'users' ? '#ffffff' : '#64748b',
            boxShadow: adminTab === 'users' ? '0 4px 12px rgba(15, 41, 66, 0.2)' : '0 2px 6px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <Users size={18} />
          <span>User Accounts Roster</span>
        </button>

        <button
          onClick={() => setAdminTab('reports')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: adminTab === 'reports' ? '#dc2626' : '#ffffff',
            color: adminTab === 'reports' ? '#ffffff' : '#64748b',
            boxShadow: adminTab === 'reports' ? '0 4px 12px rgba(220, 38, 38, 0.25)' : '0 2px 6px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <Flag size={18} />
          <span>Reported Posts Queue</span>
          {uniquePostsCount > 0 && (
            <span 
              title={`${pendingCount} total report notices across ${uniquePostsCount} posts`}
              style={{
                background: adminTab === 'reports' ? '#ffffff' : '#dc2626',
                color: adminTab === 'reports' ? '#dc2626' : '#ffffff',
                padding: '0.1rem 0.55rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              {uniquePostsCount}
            </span>
          )}
        </button>
      </div>

      {adminTab === 'reports' ? (
        <div className="glass-panel" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f2942' }}>
                🚩 Reported Posts Moderation Queue
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748b', marginTop: '0.2rem' }}>
                Review flagged content submitted by students. Take administrative action or dismiss false reports.
              </p>
            </div>
            <button className="btn-secondary" onClick={fetchReports} style={{ fontSize: '0.85rem' }}>
              <RefreshCw size={15} className={loadingReports ? 'spin-icon' : ''} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {loadingReports ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading reported posts queue...</div>
          ) : groupedReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
              <ShieldCheck size={44} color="#059669" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f2942', marginBottom: '0.3rem' }}>All Clear! No Pending Reports</h4>
              <p style={{ fontSize: '0.88rem' }}>There are currently no reported posts waiting for moderation review.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {groupedReports.map((item) => (
                <div key={item.postId} style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '1.4rem',
                  background: '#ffffff',
                  boxShadow: '0 4px 15px rgba(15, 23, 42, 0.05)'
                }}>
                  {/* Card Header: Post Author + Category + Total Reports Count Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {item.post?.author?.avatarUrl ? (
                        <img src={resolveImageUrl(item.post.author.avatarUrl)} alt={item.post.author.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f2942', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                          {item.post?.author?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f2942' }}>
                          Post Author: {item.post?.author?.name || 'Unknown Student'} <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>(ID: {item.post?.userId})</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Posted: {item.post?.createdAt ? new Date(item.post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge badge-${(item.post?.category || 'General').replace(/ & /g, '-').replace(/ /g, '-')}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
                        {item.post?.category || 'General'}
                      </span>

                      <div style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fca5a5',
                        padding: '0.3rem 0.85rem',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        <Flag size={14} />
                        <span>{item.reportCount} {item.reportCount === 1 ? 'Report' : 'Reports'} Filed</span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content Preview Box */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem', marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f2942', marginBottom: '0.4rem' }}>
                      {item.post?.title || 'Untitled Post'}
                    </h4>
                    {item.post?.content && (
                      <p style={{ fontSize: '0.88rem', color: '#334155', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                        {item.post.content.length > 300 ? `${item.post.content.slice(0, 300)}...` : item.post.content}
                      </p>
                    )}
                    {item.post?.imageUrl && (
                      <div 
                        onClick={() => setActiveMedia({ type: 'image', src: resolveImageUrl(item.post.imageUrl) })}
                        title="Click to view full-size photo"
                        style={{ marginTop: '0.75rem', borderRadius: '0px', overflow: 'hidden', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                      >
                        <img src={resolveImageUrl(item.post.imageUrl)} alt="Reported Media" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block', borderRadius: '0px', transition: 'transform 0.2s ease' }} />
                      </div>
                    )}
                    {item.post?.videoUrl && (
                      <AdminVideoPlayer 
                        videoUrl={item.post.videoUrl} 
                        thumbnailUrl={item.post.thumbnailUrl}
                        onEnlarge={(src) => setActiveMedia({ type: 'video', src })} 
                      />
                    )}
                  </div>

                  {/* Student Reports List Section */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={14} color="#64748b" />
                      <span>Student Complaints ({item.reporters.length}):</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {item.reporters.map((rep) => (
                        <div key={rep.reportId} style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '0.65rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                            {rep.reporter?.avatarUrl ? (
                              <img src={resolveImageUrl(rep.reporter.avatarUrl)} alt={rep.reporter.name} style={{ width: '26px', height: '26px', borderRadius: '50%' }} />
                            ) : (
                              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#3b82f6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                                {rep.reporter?.name?.charAt(0) || 'U'}
                              </div>
                            )}
                            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b' }}>
                              {rep.reporter?.name || 'Student'} <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 400 }}>({rep.reporter?.email})</span>
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {new Date(rep.createdAt).toLocaleString()}
                            </span>

                            <span style={{
                              background: rep.reason === 'Harassment' ? '#fee2e2' : rep.reason === 'Spam' ? '#ffedd5' : '#f3e8ff',
                              color: rep.reason === 'Harassment' ? '#991b1b' : rep.reason === 'Spam' ? '#9a3412' : '#6b21a8',
                              border: `1px solid ${rep.reason === 'Harassment' ? '#fca5a5' : rep.reason === 'Spam' ? '#fed7aa' : '#d8b4fe'}`,
                              padding: '0.15rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 800
                            }}>
                              {rep.reason.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Admin Card Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleDismissAllPostReports(item.postId)}
                      disabled={reportActionId === item.postId}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.84rem', color: '#475569' }}
                    >
                      <CheckCircle2 size={15} />
                      <span>Dismiss Reports</span>
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => handleTakedownGroupedPost(item.postId, item.reporters[0]?.reason)}
                      disabled={reportActionId === item.postId}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.84rem', color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
                    >
                      <AlertCircle size={15} />
                      <span>Take Down Post</span>
                    </button>

                    <button
                      className="btn-primary"
                      onClick={() => handleDeleteGroupedPost(item.postId)}
                      disabled={reportActionId === item.postId}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.84rem', background: '#dc2626' }}
                    >
                      <Trash2 size={15} />
                      <span>Delete Permanently</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search & Status Filter Bar */}
      <div className="glass-panel admin-filter-bar" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#ffffff' }}>
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
          <div className="admin-filter-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
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

      {/* User Records Section (Desktop Table + Mobile Cards) */}
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
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="admin-desktop-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '1.1rem 1.25rem' }}>User Info</th>
                    <th style={{ padding: '1.1rem 1.25rem' }}>Email & Student ID</th>
                    <th style={{ padding: '1.1rem 1.25rem' }}>IP Address</th>
                    <th style={{ padding: '1.1rem 1.25rem' }}>Status</th>
                    <th style={{ padding: '1.1rem 1.25rem' }}>Verification</th>
                    <th style={{ padding: '1.1rem 1.25rem', textAlign: 'center' }}>Action</th>
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
                                {u.isVerified && <VerifiedBadge size={16} />}
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

                        {/* Single Action Dropdown Menu */}
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <div className="action-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              disabled={isActionLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuUserId(prev => prev === u.id ? null : u.id);
                              }}
                              style={{
                                background: openMenuUserId === u.id ? '#eff6ff' : '#ffffff',
                                border: `1px solid ${openMenuUserId === u.id ? '#bfdbfe' : '#cbd5e1'}`,
                                color: openMenuUserId === u.id ? '#1d4ed8' : '#334155',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                transition: 'all 0.15s ease',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                              }}
                            >
                              <span>Actions</span>
                              <ChevronDown 
                                size={14} 
                                style={{ 
                                  transform: openMenuUserId === u.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.15s ease'
                                }} 
                              />
                            </button>

                            {openMenuUserId === u.id && (
                              <div 
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 'calc(100% + 6px)',
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '10px',
                                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
                                  padding: '0.35rem',
                                  minWidth: '165px',
                                  zIndex: 100,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.2rem',
                                  textAlign: 'left'
                                }}
                              >
                                {u.status !== 'banned' ? (
                                  <button
                                    disabled={isActionLoading || isSelf}
                                    onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'banned'); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', background: 'transparent', color: isSelf ? '#94a3b8' : '#dc2626', fontSize: '0.82rem', fontWeight: 600, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                                  >
                                    <Ban size={15} color={isSelf ? '#94a3b8' : '#dc2626'} />
                                    <span>Ban User</span>
                                  </button>
                                ) : (
                                  <button
                                    disabled={isActionLoading}
                                    onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'active'); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', background: 'transparent', color: '#059669', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    <UserCheck size={15} color="#059669" />
                                    <span>Unban User</span>
                                  </button>
                                )}

                                {u.status !== 'suspended' && u.status !== 'banned' && (
                                  <button
                                    disabled={isActionLoading || isSelf}
                                    onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'suspended'); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', background: 'transparent', color: isSelf ? '#94a3b8' : '#d97706', fontSize: '0.82rem', fontWeight: 600, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                                  >
                                    <Clock size={15} color={isSelf ? '#94a3b8' : '#d97706'} />
                                    <span>Suspend User</span>
                                  </button>
                                )}

                                {u.status !== 'muted' && (
                                  <button
                                    disabled={isActionLoading}
                                    onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'muted'); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', background: 'transparent', color: '#7c3aed', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    <VolumeX size={15} color="#7c3aed" />
                                    <span>Mute User</span>
                                  </button>
                                )}

                                {u.status !== 'shadowbanned' && (
                                  <button
                                    disabled={isActionLoading}
                                    onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'shadowbanned'); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', background: 'transparent', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    <EyeOff size={15} color="#475569" />
                                    <span>Shadowban</span>
                                  </button>
                                )}

                                {u.status !== 'active' && (
                                  <button
                                    disabled={isActionLoading}
                                    onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'active'); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', background: 'transparent', color: '#1d4ed8', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    <UserCheck size={15} color="#1d4ed8" />
                                    <span>Activate Account</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW — Native Clean Mobile Cards */}
            <div className="admin-mobile-cards" style={{ display: 'none', padding: '0.85rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {users.map((u) => {
                  const isSelf = currentUser && currentUser.id === u.id;
                  const isActionLoading = actionLoadingId === u.id;

                  return (
                    <div 
                      key={u.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '1rem',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      {/* Top Row: User Avatar, Name, Role & Status Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {u.avatarUrl ? (
                            <img
                              src={resolveImageUrl(u.avatarUrl)}
                              alt={u.name}
                              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                            />
                          ) : (
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f2942 0%, #1e40af 100%)', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{u.name}</span>
                              {u.isVerified && <VerifiedBadge size={15} />}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                              <span>ID: #{u.id}</span>
                              {u.role === 'admin' && (
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#eff6ff', color: '#1e40af', padding: '0.05rem 0.35rem', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                                  ADMIN
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          textTransform: 'uppercase',
                          ...getStatusBadgeStyle(u.status)
                        }}>
                          {u.status}
                        </span>
                      </div>

                      {/* Middle Details: Email & IP */}
                      <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{u.email}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{u.studentId ? `ID: ${u.studentId}` : u.department || ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.74rem', fontFamily: 'monospace' }}>
                          <Globe size={12} color="#94a3b8" />
                          <span>IP: {u.lastLoginIp || '127.0.0.1'}</span>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '0.2rem' }}>
                        <button
                          disabled={isActionLoading}
                          onClick={() => handleVerificationToggle(u.id, u.isVerified)}
                          style={{
                            background: u.isVerified ? '#eff6ff' : '#ffffff',
                            border: `1px solid ${u.isVerified ? '#bfdbfe' : '#cbd5e1'}`,
                            color: u.isVerified ? '#1d4ed8' : '#64748b',
                            padding: '0.4rem 0.85rem',
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
                          <span>{u.isVerified ? 'Verified' : 'Verify Badge'}</span>
                        </button>

                        <div className="action-menu-container" style={{ position: 'relative' }}>
                          <button
                            disabled={isActionLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuUserId(prev => prev === u.id ? null : u.id);
                            }}
                            style={{
                              background: '#0f2942',
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.4rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <span>Manage Actions</span>
                            <ChevronDown size={13} />
                          </button>

                          {openMenuUserId === u.id && (
                            <div 
                              style={{
                                position: 'absolute',
                                right: 0,
                                bottom: 'calc(100% + 6px)',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
                                padding: '0.35rem',
                                minWidth: '160px',
                                zIndex: 100,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.2rem'
                              }}
                            >
                              {u.status !== 'banned' ? (
                                <button
                                  disabled={isActionLoading || isSelf}
                                  onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'banned'); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: 'none', background: 'transparent', color: isSelf ? '#94a3b8' : '#dc2626', fontSize: '0.78rem', fontWeight: 600 }}
                                >
                                  <Ban size={14} color={isSelf ? '#94a3b8' : '#dc2626'} />
                                  <span>Ban User</span>
                                </button>
                              ) : (
                                <button
                                  disabled={isActionLoading}
                                  onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'active'); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: 'none', background: 'transparent', color: '#059669', fontSize: '0.78rem', fontWeight: 600 }}
                                >
                                  <UserCheck size={14} color="#059669" />
                                  <span>Unban User</span>
                                </button>
                              )}

                              {u.status !== 'suspended' && u.status !== 'banned' && (
                                <button
                                  disabled={isActionLoading || isSelf}
                                  onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'suspended'); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: 'none', background: 'transparent', color: isSelf ? '#94a3b8' : '#d97706', fontSize: '0.78rem', fontWeight: 600 }}
                                >
                                  <Clock size={14} color={isSelf ? '#94a3b8' : '#d97706'} />
                                  <span>Suspend</span>
                                </button>
                              )}

                              {u.status !== 'muted' && (
                                <button
                                  disabled={isActionLoading}
                                  onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'muted'); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: 'none', background: 'transparent', color: '#7c3aed', fontSize: '0.78rem', fontWeight: 600 }}
                                >
                                  <VolumeX size={14} color="#7c3aed" />
                                  <span>Mute</span>
                                </button>
                              )}

                              {u.status !== 'shadowbanned' && (
                                <button
                                  disabled={isActionLoading}
                                  onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'shadowbanned'); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: 'none', background: 'transparent', color: '#475569', fontSize: '0.78rem', fontWeight: 600 }}
                                >
                                  <EyeOff size={14} color="#475569" />
                                  <span>Shadowban</span>
                                </button>
                              )}

                              {u.status !== 'active' && (
                                <button
                                  disabled={isActionLoading}
                                  onClick={() => { setOpenMenuUserId(null); handleStatusChange(u.id, 'active'); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px', border: 'none', background: 'transparent', color: '#1d4ed8', fontSize: '0.78rem', fontWeight: 600 }}
                                >
                                  <UserCheck size={14} color="#1d4ed8" />
                                  <span>Activate Account</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )}

      {/* Embedded Responsive CSS for Admin Dashboard Mobile View */}
      <style>{`
        @media (max-width: 768px) {
          .admin-desktop-table {
            display: none !important;
          }
          .admin-mobile-cards {
            display: block !important;
          }
          .admin-header-banner {
            padding: 1.25rem 1rem !important;
            margin-bottom: 1.2rem !important;
            border-radius: 14px !important;
          }
          .admin-header-banner p {
            display: none !important;
          }
          .admin-header-banner h1 {
            font-size: 1.35rem !important;
          }
          .admin-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.65rem !important;
            margin-bottom: 1.2rem !important;
          }
          .admin-kpi-card {
            padding: 0.85rem 1rem !important;
          }
          .admin-kpi-card div:last-child {
            font-size: 1.4rem !important;
            margin-top: 0.2rem !important;
          }
          .admin-filter-bar {
            padding: 0.85rem !important;
          }
          .admin-filter-pills {
            display: flex !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
            padding-bottom: 0.2rem !important;
            width: 100% !important;
            -webkit-overflow-scrolling: touch;
          }
          .admin-filter-pills button {
            flex-shrink: 0 !important;
            padding: 0.35rem 0.75rem !important;
            font-size: 0.76rem !important;
          }
        }
      `}</style>

      {/* Admin Media Lightbox Modal */}
      <MediaLightboxModal 
        media={activeMedia} 
        onClose={() => setActiveMedia(null)} 
      />

    </div>
  );
}

