import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Bookmark, Trash2, Send, Clock, BarChart2, CheckCircle2, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { api, resolveImageUrl } from '../services/api';
import VerifiedBadge from './VerifiedBadge';

export default function PostCard({ post, currentUser, onDeletePost, onRequireAuth }) {
  const [postData, setPostData] = useState(post);
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

  useEffect(() => {
    if (typeof post.isBookmarked === 'boolean') {
      setIsBookmarked(post.isBookmarked);
    } else if (post.bookmarks && Array.isArray(post.bookmarks) && currentUser?.id) {
      setIsBookmarked(post.bookmarks.some(b => b.userId === currentUser.id));
    }
  }, [post.isBookmarked, post.bookmarks, currentUser?.id]);

  const [showComments, setShowComments] = useState(false);
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
  const canDelete = isOwner || isAdmin;

  const handleDeleteOrTakedown = async () => {
    if (isAdmin && !isOwner) {
      const isTakedownNotice = window.confirm(
        "Admin Action Required:\n\nClick 'OK' to issue an official Admin Takedown Notice (with feedback log).\nClick 'Cancel' to permanently delete this post completely."
      );

      if (isTakedownNotice) {
        const reason = window.prompt(
          'Enter administrative feedback / reason for this takedown log:',
          'This post was taken down by UMT Admin for violating community guidelines.'
        );
        if (reason === null) return;
        try {
          const res = await api.takedownPost(postData.id, reason);
          setPostData(res.post);
        } catch (err) {
          alert(err.message || 'Failed to issue takedown');
        }
      } else {
        onDeletePost(postData.id);
      }
    } else {
      onDeletePost(postData.id);
    }
  };

  // Handle Like Toggle
  const handleToggleLike = async () => {
    if (!currentUser) {
      onRequireAuth();
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
      onRequireAuth();
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
      onRequireAuth();
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
      onRequireAuth();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {postData.author?.avatarUrl ? (
            <img 
              src={resolveImageUrl(postData.author.avatarUrl)} 
              alt={postData.author.name} 
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
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
          <span className={`badge badge-${(postData.category || 'General').replace(/ & /g, '-').replace(/ /g, '-')}`} style={{ fontSize: '0.68rem', padding: '0.18rem 0.55rem' }}>
            {postData.category || 'General'}
          </span>

          {canDelete && (
            <button 
              className="btn-icon" 
              onClick={handleDeleteOrTakedown}
              title={isAdmin && !isOwner ? "Admin Takedown / Delete Post" : "Delete Post"}
              style={{ color: '#dc2626', padding: '0.3rem' }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

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
            <h3 className="font-heading" style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: '0.3rem', color: '#0f172a', lineHeight: 1.35 }}>
              {postData.title}
            </h3>
            {postData.content && (
              <p style={{ fontSize: '0.88rem', color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                {postData.content}
              </p>
            )}
          </div>
        </>
      )}

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

      {/* Image Attachment */}
      {post.imageUrl && (
        <div style={{ marginBottom: '0.85rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
          <img 
            src={resolveImageUrl(post.imageUrl)} 
            alt={post.title} 
            style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
          />
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
            transition: 'all 0.15s ease'
          }}
          title={isBookmarked ? 'Remove Bookmark' : 'Save Bookmark'}
        >
          <Bookmark size={17} fill={isBookmarked ? 'var(--primary)' : 'none'} />
        </button>

      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px dashed var(--border-glass)' }}>
          
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder={currentUser ? 'Write a comment...' : 'Login to write a comment'}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              disabled={!currentUser || loadingComment}
              style={{ fontSize: '0.84rem', padding: '0.45rem 0.8rem' }}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!currentUser || loadingComment || !newCommentText.trim()}
              style={{ padding: '0.45rem 0.85rem' }}
            >
              <Send size={14} />
            </button>
          </form>

          {/* Comment Thread List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {loadingCommentsList ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.4rem' }}>
                Loading comments...
              </p>
            ) : comments.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.4rem' }}>
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div 
                  key={comment.id || Math.random()} 
                  style={{ 
                    background: '#faf8f5', 
                    padding: '0.6rem 0.8rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    gap: '0.55rem',
                    alignItems: 'flex-start'
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

    </article>
  );
}
