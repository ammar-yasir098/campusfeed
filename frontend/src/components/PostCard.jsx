import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageSquare, Bookmark, Trash2, Send, Clock, BarChart2, CheckCircle2, AlertCircle, Info, ShieldAlert, Flag, X, MoreVertical, Maximize2, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, resolveImageUrl } from '../services/api';
import VerifiedBadge from './VerifiedBadge';
import MediaLightboxModal from './MediaLightboxModal';

export default function PostCard({ post, currentUser, onDeletePost, onRequireAuth, defaultShowComments = false }) {
  const [postData, setPostData] = useState(post);
  const [activeMedia, setActiveMedia] = useState(null);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  const [isLiked, setIsLiked] = useState(
    post.likes ? post.likes.some(l => l.userId === currentUser?.id) : false
  );
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  const [isBookmarked, setIsBookmarked] = useState(() => {
    if (typeof post.isBookmarked === 'boolean') return post.isBookmarked;
    if (post.bookmarks && Array.isArray(post.bookmarks) && currentUser?.id) {
      return post.bookmarks.some(b => b.userId === currentUser.id);
    }
    return false;
  });

  // Post Menu & Report State
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showReportReasons, setShowReportReasons] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportToast, setReportToast] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target && typeof e.target.closest === 'function') {
        if (!e.target.closest('.post-menu-container')) {
          setShowPostMenu(false);
          setShowReportReasons(false);
        }
      } else {
        setShowPostMenu(false);
        setShowReportReasons(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (typeof post.isBookmarked === 'boolean') {
      setIsBookmarked(post.isBookmarked);
    } else if (post.bookmarks && Array.isArray(post.bookmarks) && currentUser?.id) {
      setIsBookmarked(post.bookmarks.some(b => b.userId === currentUser.id));
    }
  }, [post.isBookmarked, post.bookmarks, currentUser?.id]);

  const [showComments, setShowComments] = useState(defaultShowComments);

  // Intercept native video control bar maximize button to open 60-80% glassmorphic lightbox modal
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !post?.videoUrl) return;

    const handleFullscreenIntercept = (e) => {
      if (document.fullscreenElement === videoEl || document.webkitFullscreenElement === videoEl) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        setActiveMedia({ type: 'video', src: resolveImageUrl(post.videoUrl) });
      }
    };

    videoEl.addEventListener('fullscreenchange', handleFullscreenIntercept);
    videoEl.addEventListener('webkitbeginfullscreen', handleFullscreenIntercept);
    return () => {
      videoEl.removeEventListener('fullscreenchange', handleFullscreenIntercept);
      videoEl.removeEventListener('webkitbeginfullscreen', handleFullscreenIntercept);
    };
  }, [post?.videoUrl]);

  const handleStartVideoPlay = (e) => {
    if (e) e.stopPropagation();
    setIsVideoPlaying(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.preload = 'auto';
        videoRef.current.play().catch(() => {});
      }
    }, 50);
  };
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingCommentsList, setLoadingCommentsList] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);

  // Poll state
  const [pollState, setPollState] = useState(post.poll || null);
  const [voting, setVoting] = useState(false);
  const [voteAlert, setVoteAlert] = useState(null);

  // Format creation time relative string
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOwner = currentUser && (currentUser.id === postData.userId || currentUser.id === postData.author?.id);
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canDelete = isOwner;

  const handleDeleteOrTakedown = async () => {
    onDeletePost(postData.id);
  };

  // Handle Report Post
  const handleReportPost = async (reason) => {
    if (!currentUser) {
      onRequireAuth('submit reports');
      return;
    }
    setShowPostMenu(false);
    setShowReportReasons(false);
    try {
      const res = await api.reportPost(postData.id, reason);
      setReportSubmitted(true);
      setReportToast({ type: 'success', text: res.message || 'Report submitted successfully' });
      alert(`Report Submitted Successfully\n\nReason: ${reason}\n${res.message || 'Thank you for helping keep the campus community safe. Campus moderators will review this report in the Admin Dashboard.'}`);
      setTimeout(() => setReportToast(null), 5000);
    } catch (err) {
      setReportToast({ type: 'error', text: err.message || 'Failed to submit report' });
      alert(`Report Submission Failed: ${err.message || 'Unable to process your report at this time. Please try again.'}`);
      setTimeout(() => setReportToast(null), 5000);
    }
  };

  // Handle Like Toggle
  const handleToggleLike = async () => {
    if (!currentUser) {
      onRequireAuth('like posts');
      return;
    }
    try {
      const res = await api.toggleLike(postData.id);
      setIsLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch (err) {
      console.error('Like toggle failed:', err);
    }
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = async () => {
    if (!currentUser) {
      onRequireAuth('save bookmarks');
      return;
    }
    try {
      const res = await api.toggleBookmark(postData.id);
      setIsBookmarked(res.bookmarked);
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  // Handle Poll Vote
  const handleVoteOption = async (optionId) => {
    if (!currentUser) {
      onRequireAuth('vote in polls');
      return;
    }
    if (pollState?.userVotedOptionId) {
      setVoteAlert({ type: 'info', message: 'You have already voted in this poll.' });
      setTimeout(() => setVoteAlert(null), 3500);
      return;
    }
    if (voting) return;

    setVoting(true);
    try {
      const res = await api.votePoll(postData.id, optionId);
      setPollState(res.poll);
      setVoteAlert({ type: 'success', message: 'Vote Recorded Successfully! Your choice has been saved.' });
      setTimeout(() => setVoteAlert(null), 4000);
    } catch (err) {
      setVoteAlert({ type: 'error', message: err.message || 'Failed to record vote' });
      setTimeout(() => setVoteAlert(null), 4000);
    } finally {
      setVoting(false);
    }
  };

  // Auto-load comments if opened from PostDetailView (defaultShowComments=true)
  useEffect(() => {
    if (defaultShowComments && !commentsLoaded) {
      setLoadingCommentsList(true);
      api.getComments(postData.id)
        .then(res => {
          setComments(res.comments || []);
          setCommentsLoaded(true);
        })
        .catch(err => console.error('Failed to auto-load comments:', err))
        .finally(() => setLoadingCommentsList(false));
    }
  }, [defaultShowComments]);

  // Handle Fetch & Toggle Comments
  const handleToggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);

    if (nextShow && !commentsLoaded) {
      setLoadingCommentsList(true);
      try {
        const res = await api.getComments(postData.id);
        setComments(res.comments || []);
        setCommentsLoaded(true);
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setLoadingCommentsList(false);
      }
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth('post comments');
      return;
    }
    if (!newCommentText.trim()) return;

    setLoadingComment(true);
    try {
      const res = await api.addComment(postData.id, newCommentText);
      setComments([...comments, res.comment]);
      setCommentCount(commentCount + 1);
      setNewCommentText('');
      setCommentsLoaded(true);
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setLoadingComment(false);
    }
  };

  return (
    <article className="glass-panel glass-panel-hover" style={{ marginBottom: '1rem', padding: '1.15rem 1.25rem', background: '#ffffff' }}>

      {/* Header: Author info & Category badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid rgb(241, 245, 249)', paddingBottom: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {postData.author?.avatarUrl ? (
            <img
              src={resolveImageUrl(postData.author.avatarUrl)}
              alt={postData.author.name}
              onClick={() => setActiveMedia({ type: 'image', src: resolveImageUrl(postData.author.avatarUrl), alt: postData.author.name })}
              title="Click to view full-size avatar"
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
            />
          ) : (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#ffffff'
            }}>
              {postData.author?.name ? postData.author.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                {postData.author?.name || 'Anonymous Student'}
              </h4>
              {postData.author?.isVerified && (
                <VerifiedBadge size={16} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <Clock size={11} />
              <span>{formatTime(postData.createdAt)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {postData.poll && (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap',
              lineHeight: 1
            }}>
              <BarChart2 size={12} color="#2563eb" />
              <span>POLL</span>
            </span>
          )}
          <span className={`badge badge-${(postData.category || 'General').replace(/ & /g, '-').replace(/ /g, '-')}`} style={{ fontSize: '0.68rem', padding: '0.18rem 0.55rem' }}>
            {postData.category || 'General'}
          </span>

          {(isOwner || !postData.isTakedown) && (
            <div className="post-menu-container" style={{ position: 'relative' }}>
              <button
                className="btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!currentUser && !isOwner) {
                    onRequireAuth('report posts');
                    return;
                  }
                  setShowPostMenu(!showPostMenu);
                  setShowReportReasons(false);
                }}
                title="Post Options"
                style={{ color: '#64748b', padding: '0.3rem', borderRadius: '8px' }}
              >
                <MoreVertical size={16} />
              </button>

              {showPostMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '0.4rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
                  padding: '0.4rem',
                  zIndex: 100,
                  width: showReportReasons ? '200px' : '160px'
                }}>
                  {isOwner ? (
                    <button
                      onClick={() => {
                        setShowPostMenu(false);
                        handleDeleteOrTakedown();
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 0.65rem',
                        fontSize: '0.82rem',
                        color: '#dc2626',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 size={15} color="#dc2626" />
                      <span>Delete Post</span>
                    </button>
                  ) : (
                    !showReportReasons ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (reportSubmitted) return;
                          setShowReportReasons(true);
                        }}
                        disabled={reportSubmitted}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 0.65rem',
                          fontSize: '0.82rem',
                          color: reportSubmitted ? '#d97706' : '#334155',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: reportSubmitted ? 'default' : 'pointer',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!reportSubmitted) e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Flag size={15} color={reportSubmitted ? '#d97706' : '#64748b'} fill={reportSubmitted ? '#d97706' : 'none'} />
                        <span>{reportSubmitted ? 'Reported' : 'Report Post'}</span>
                      </button>
                    ) : (
                      <div onClick={(e) => e.stopPropagation()}>
                        <div style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#64748b',
                          padding: '0.25rem 0.4rem',
                          borderBottom: '1px solid #f1f5f9',
                          marginBottom: '0.3rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>Select Category Reason:</span>
                          <X size={13} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={(e) => { e.stopPropagation(); setShowReportReasons(false); }} />
                        </div>
                        {['Spam', 'Harassment', 'Misinformation', 'Inappropriate Content'].map((reason) => (
                          <button
                            key={reason}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReportPost(reason);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.45rem 0.6rem',
                              fontSize: '0.8rem',
                              color: '#334155',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <span>🚩</span>
                            <span>{reason}</span>
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {reportToast && (
        <div style={{
          padding: '0.55rem 0.85rem',
          borderRadius: '8px',
          marginBottom: '0.75rem',
          fontSize: '0.82rem',
          fontWeight: 600,
          background: reportToast.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: reportToast.type === 'success' ? '#047857' : '#b91c1c',
          border: `1px solid ${reportToast.type === 'success' ? '#a7f3d0' : '#fca5a5'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          {reportToast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{reportToast.text}</span>
        </div>
      )}

      {/* Content or Admin Takedown Feedback Banner */}
      {postData.isTakedown ? (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '12px',
          padding: '1.1rem 1.25rem',
          margin: '0.75rem 0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem'
        }}>
          <div style={{ padding: '0.45rem', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', flexShrink: 0 }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h4 style={{ color: '#991b1b', fontWeight: 800, fontSize: '0.92rem', margin: 0 }}>
                Post Taken Down by UMT Administration
              </h4>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#fee2e2', color: '#991b1b', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                MODERATED
              </span>
            </div>
            <p style={{ color: '#7f1d1d', fontSize: '0.86rem', marginTop: '0.25rem', marginBottom: '0.35rem', lineHeight: 1.45 }}>
              {postData.takedownReason || 'This post was taken down by campus administration for violating community guidelines.'}
            </p>
            <div style={{ fontSize: '0.74rem', color: '#991b1b', fontWeight: 600 }}>
              Feedback Logged by: <strong>{postData.takedownByAdmin || 'UMT Admin'}</strong>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Content: Title & Text */}
          <div style={{ marginBottom: '0.75rem' }}>
            <h3 className="font-heading" style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: '0.3rem', color: '#0f172a', lineHeight: 1.35, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {postData.title}
            </h3>
            {postData.content && (
              <p style={{ fontSize: '0.88rem', color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {postData.content}
              </p>
            )}
          </div>

          {/* Poll Section (if attached) */}
          {pollState && (
            <div style={{ margin: '0.75rem 0 0.85rem 0', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f2942', fontWeight: 700, fontSize: '0.86rem' }}>
                  <BarChart2 size={16} color="var(--primary)" />
                  <span>Campus Student Poll</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  {pollState.totalVotes} {pollState.totalVotes === 1 ? 'vote' : 'votes'}
                </span>
              </div>

              {/* Professional One-Time Vote Alert */}
              {voteAlert && (
                <div style={{
                  marginBottom: '0.65rem',
                  padding: '0.55rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  background: voteAlert.type === 'success' ? '#ecfdf5' : voteAlert.type === 'error' ? '#fef2f2' : '#eff6ff',
                  border: `1px solid ${voteAlert.type === 'success' ? '#a7f3d0' : voteAlert.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
                  color: voteAlert.type === 'success' ? '#065f46' : voteAlert.type === 'error' ? '#991b1b' : '#1e40af',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {voteAlert.type === 'success' ? <CheckCircle2 size={15} /> : voteAlert.type === 'error' ? <AlertCircle size={15} /> : <Info size={15} />}
                    <span>{voteAlert.message}</span>
                  </div>
                  <button
                    onClick={() => setVoteAlert(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'currentColor', opacity: 0.7, padding: '0 0.2rem', fontSize: '0.9rem', fontWeight: 700 }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Poll Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {pollState.options && pollState.options.map((option) => {
                  const hasVoted = Boolean(pollState.userVotedOptionId);
                  const isUserChoice = option.votedByCurrentUser;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleVoteOption(option.id)}
                      disabled={voting || hasVoted || !currentUser}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        width: '100%',
                        padding: '0.55rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: isUserChoice ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                        background: '#ffffff',
                        textAlign: 'left',
                        cursor: (hasVoted || !currentUser) ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between'
                      }}
                    >
                      {/* Background Progress Bar Fill */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          bottom: 0,
                          width: `${option.percentage}%`,
                          background: isUserChoice ? 'rgba(15, 41, 66, 0.14)' : 'rgba(226, 232, 240, 0.7)',
                          transition: 'width 0.4s ease-in-out',
                          zIndex: 0
                        }}
                      />

                      {/* Option Text & Checkmark (Left Side) */}
                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1, minWidth: 0, marginRight: '0.75rem' }}>
                        {isUserChoice && <CheckCircle2 size={15} color="var(--primary)" style={{ flexShrink: 0 }} />}
                        <span style={{ fontSize: '0.86rem', fontWeight: isUserChoice ? 700 : 500, color: '#1e293b', wordBreak: 'break-word' }}>
                          {option.optionText}
                        </span>
                      </div>

                      {/* Percentage & Vote Count Pill Badge (Right Side) */}
                      <div style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: isUserChoice ? '#0f2942' : '#334155',
                        background: isUserChoice ? '#e0f2fe' : '#f1f5f9',
                        border: isUserChoice ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '14px',
                        flexShrink: 0
                      }}>
                        <span>{option.percentage}%</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#64748b' }}>
                          ({option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Caption Notice */}
              {!currentUser && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', color: '#64748b' }}>
                  <span>Sign in to participate in campus polls.</span>
                </div>
              )}
            </div>
          )}

          {/* Multi-Photo Attachments */}
          {(() => {
            const allImages = post.imageUrls && post.imageUrls.length > 0 
              ? post.imageUrls 
              : (post.imageUrl ? [post.imageUrl] : []);

            if (allImages.length === 0) return null;

            if (allImages.length === 1) {
              return (
                <div 
                  onClick={() => setActiveMedia({ type: 'image', src: resolveImageUrl(allImages[0]), alt: post.title, images: allImages.map(resolveImageUrl), index: 0 })}
                  title="Click to view full-size photo"
                  style={{ marginBottom: '0.85rem', borderRadius: '0px', overflow: 'hidden', border: '1px solid var(--border-glass)', cursor: 'pointer', background: '#0f172a' }}
                >
                  <img
                    src={resolveImageUrl(allImages[0])}
                    alt={post.title}
                    style={{ width: '100%', maxHeight: '460px', objectFit: 'contain', display: 'block', borderRadius: '0px', transition: 'transform 0.2s ease' }}
                  />
                </div>
              );
            }

            if (allImages.length === 2) {
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.85rem' }}>
                  {allImages.map((imgSrc, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setActiveMedia({ type: 'image', src: resolveImageUrl(imgSrc), alt: post.title, images: allImages.map(resolveImageUrl), index: idx })}
                      title="Click to view photo"
                      style={{ borderRadius: '0px', overflow: 'hidden', border: '1px solid var(--border-glass)', cursor: 'pointer', height: '260px', background: '#0f172a' }}
                    >
                      <img
                        src={resolveImageUrl(imgSrc)}
                        alt={`${post.title} ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', borderRadius: '0px' }}
                      />
                    </div>
                  ))}
                </div>
              );
            }

            // 3 to 5 Photos Carousel Slider
            const activeIdx = Math.min(currentImgIdx, allImages.length - 1);
            return (
              <div style={{ position: 'relative', marginBottom: '0.85rem', borderRadius: '0px', overflow: 'hidden', border: '1px solid var(--border-glass)', background: '#0f172a' }}>
                <div 
                  onClick={() => setActiveMedia({ type: 'image', src: resolveImageUrl(allImages[activeIdx]), alt: post.title, images: allImages.map(resolveImageUrl), index: activeIdx })}
                  style={{ width: '100%', height: '380px', cursor: 'pointer' }}
                  title="Click to view full-size photo"
                >
                  <img
                    src={resolveImageUrl(allImages[activeIdx])}
                    alt={`${post.title} ${activeIdx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', borderRadius: '0px' }}
                  />
                </div>

                {/* Counter Pill Badge */}
                <div style={{
                  position: 'absolute',
                  top: '0.65rem',
                  right: '0.65rem',
                  background: 'rgba(15, 23, 42, 0.78)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  {activeIdx + 1} / {allImages.length}
                </div>

                {/* Prev Arrow */}
                {activeIdx > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImgIdx(activeIdx - 1);
                    }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '0.65rem',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 5
                    }}
                    title="Previous Photo"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}

                {/* Next Arrow */}
                {activeIdx < allImages.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImgIdx(activeIdx + 1);
                    }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '0.65rem',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 5
                    }}
                    title="Next Photo"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}

                {/* Dot Indicators */}
                <div style={{
                  position: 'absolute',
                  bottom: '0.65rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '0.35rem',
                  zIndex: 5,
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '12px',
                  backdropFilter: 'blur(4px)'
                }}>
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImgIdx(idx);
                      }}
                      style={{
                        width: idx === activeIdx ? '16px' : '6px',
                        height: '6px',
                        borderRadius: '3px',
                        background: idx === activeIdx ? '#2563eb' : 'rgba(255, 255, 255, 0.6)',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease'
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Video Attachment */}
          {post.videoUrl && (
            <div style={{ position: 'relative', marginBottom: '0.85rem', borderRadius: '0px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#0f172a' }}>
              {!isVideoPlaying && post.thumbnailUrl ? (
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleStartVideoPlay}>
                  <img
                    src={resolveImageUrl(post.thumbnailUrl)}
                    alt="Video thumbnail"
                    style={{
                      width: '100%',
                      maxHeight: '380px',
                      objectFit: 'cover',
                      display: 'block',
                      borderRadius: '0px'
                    }}
                  />
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={resolveImageUrl(post.videoUrl)}
                  controls
                  autoPlay={isVideoPlaying}
                  preload={post.thumbnailUrl ? "auto" : "metadata"}
                  onLoadedMetadata={(e) => {
                    if (e.target && !isVideoPlaying && !post.thumbnailUrl) {
                      e.target.currentTime = 0.1;
                    }
                  }}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onEnded={() => setIsVideoPlaying(false)}
                  style={{
                    width: '100%',
                    maxHeight: '380px',
                    display: 'block',
                    borderRadius: '0px',
                    cursor: isVideoPlaying ? 'default' : 'pointer'
                  }}
                  onClick={(e) => {
                    if (!isVideoPlaying) {
                      handleStartVideoPlay(e);
                    }
                  }}
                />
              )}

              {/* Perfectly Centered Modern Glassmorphic Play Button */}
              {!isVideoPlaying && (
                <button
                  type="button"
                  onClick={handleStartVideoPlay}
                  className="modern-play-btn"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '72px',
                    height: '72px',
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
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.5)'
                  }}>
                    <Play size={22} style={{ marginLeft: '3px' }} fill="#ffffff" color="#ffffff" />
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Actions Bar: Like, Comment, Bookmark */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.55rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

              {/* Like Button */}
              <button
                onClick={handleToggleLike}
                style={{
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  color: isLiked ? '#dc2626' : 'var(--text-muted)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                <Heart size={17} fill={isLiked ? '#dc2626' : 'none'} color={isLiked ? '#dc2626' : 'currentColor'} />
                <span>{likeCount}</span>
              </button>

              {/* Comment Button */}
              <button
                onClick={handleToggleComments}
                style={{
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  color: showComments ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                <MessageSquare size={17} />
                <span>{commentCount}</span>
              </button>

            </div>

            {/* Bookmark Button */}
            <button
              onClick={handleToggleBookmark}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isBookmarked ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: '0.2rem',
                transition: 'all 0.15s ease'
              }}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Post"}
            >
              <Bookmark size={17} fill={isBookmarked ? 'var(--primary)' : 'none'} />
            </button>
          </div>

          {/* Comments Expansion Drawer */}
          {showComments && (
            <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={currentUser ? "Write a comment..." : "Sign in to leave a comment"}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  disabled={!currentUser || loadingComment}
                  style={{ height: '38px', fontSize: '0.85rem' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!currentUser || !newCommentText.trim() || loadingComment}
                  style={{ padding: '0 0.85rem', height: '38px', borderRadius: 'var(--radius-md)' }}
                >
                  <Send size={15} />
                </button>
              </form>

              {/* Comments List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loadingCommentsList ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.5rem' }}>
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.6rem',
                        background: '#f8fafc',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      {comment.author?.avatarUrl ? (
                        <img
                          src={resolveImageUrl(comment.author.avatarUrl)}
                          alt={comment.author.name}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', marginTop: '0.1rem' }}
                        />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>
                          {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                      )}

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {comment.author?.name || 'Anonymous Student'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {formatTime(comment.createdAt)}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: '#292524', lineHeight: 1.4 }}>
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

        </div>
      )}
    </>
  )}

      {/* Full-Screen Media Lightbox Modal (Photo & Video) */}
      <MediaLightboxModal 
        media={activeMedia} 
        onClose={() => setActiveMedia(null)} 
      />
    </article>
  );
}
