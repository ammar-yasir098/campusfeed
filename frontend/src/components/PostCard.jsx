import React, { useState } from 'react';
import { Heart, MessageSquare, Bookmark, Trash2, Send, Clock, User as UserIcon } from 'lucide-react';
import { api, resolveImageUrl } from '../services/api';

export default function PostCard({ post, currentUser, onDeletePost, onRequireAuth }) {
  const [isLiked, setIsLiked] = useState(
    post.likes ? post.likes.some(l => l.userId === currentUser?.id) : false
  );
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  const [isBookmarked, setIsBookmarked] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingCommentsList, setLoadingCommentsList] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);

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

  // Handle Like Toggle
  const handleToggleLike = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    try {
      const res = await api.toggleLike(post.id);
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
      const res = await api.toggleBookmark(post.id);
      setIsBookmarked(res.bookmarked);
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  // Handle Fetch & Toggle Comments
  const handleToggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);

    if (nextShow && !commentsLoaded) {
      setLoadingCommentsList(true);
      try {
        const res = await api.getComments(post.id);
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
      const res = await api.addComment(post.id, newCommentText);
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

  const isOwner = currentUser && (currentUser.id === post.userId || currentUser.id === post.author?.id);

  return (
    <article className="glass-panel glass-panel-hover" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#ffffff' }}>
      
      {/* Header: Author info & Category badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {post.author?.avatarUrl ? (
            <img 
              src={resolveImageUrl(post.author.avatarUrl)} 
              alt={post.author.name} 
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '50%', 
              background: 'var(--primary-gradient)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#ffffff'
            }}>
              {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          <div>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {post.author?.name || 'Anonymous Student'}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <Clock size={12} />
              <span>{formatTime(post.createdAt)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`badge badge-${(post.category || 'General').replace(/ & /g, '-').replace(/ /g, '-')}`}>
            {post.category || 'General'}
          </span>

          {isOwner && (
            <button 
              className="btn-icon" 
              onClick={() => onDeletePost(post.id)}
              title="Delete Post"
              style={{ color: '#dc2626', padding: '0.35rem' }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content: Title & Text */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.45rem', color: '#1c1917' }}>
          {post.title}
        </h3>
        <p style={{ fontSize: '0.95rem', color: '#44403c', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
          {post.content}
        </p>
      </div>

      {/* Image Attachment */}
      {post.imageUrl && (
        <div style={{ marginBottom: '1.2rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
          <img 
            src={resolveImageUrl(post.imageUrl)} 
            alt={post.title} 
            style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* Actions Bar: Like, Comment, Bookmark */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Like Button */}
          <button 
            onClick={handleToggleLike}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              cursor: 'pointer',
              color: isLiked ? '#dc2626' : 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <Heart size={19} fill={isLiked ? '#dc2626' : 'none'} color={isLiked ? '#dc2626' : 'currentColor'} />
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
              gap: '0.4rem', 
              cursor: 'pointer',
              color: showComments ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare size={19} />
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
          <Bookmark size={19} fill={isBookmarked ? 'var(--primary)' : 'none'} />
        </button>

      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-glass)' }}>
          
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder={currentUser ? 'Write a comment...' : 'Login to write a comment'}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              disabled={!currentUser || loadingComment}
              style={{ fontSize: '0.88rem', padding: '0.55rem 0.9rem' }}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!currentUser || loadingComment || !newCommentText.trim()}
              style={{ padding: '0.55rem 1rem' }}
            >
              <Send size={15} />
            </button>
          </form>

          {/* Comment Thread List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loadingCommentsList ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.5rem' }}>
                Loading comments...
              </p>
            ) : comments.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.5rem' }}>
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div 
                  key={comment.id || Math.random()} 
                  style={{ 
                    background: '#faf8f5', 
                    padding: '0.75rem 0.9rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    gap: '0.65rem',
                    alignItems: 'flex-start'
                  }}
                >
                  {comment.author?.avatarUrl ? (
                    <img 
                      src={resolveImageUrl(comment.author.avatarUrl)} 
                      alt={comment.author.name} 
                      style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', marginTop: '0.1rem' }} 
                    />
                  ) : (
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>
                      {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {comment.author?.name || 'Anonymous Student'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#292524', lineHeight: 1.45 }}>
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
