import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import PostCard from './PostCard';

export default function PostDetailView({ currentUser, onDeletePost }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getPostById(id);
        setPost(res.post);
      } catch (err) {
        setError(err.message || 'Post not found or has been deleted.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleDelete = async (postId) => {
    await onDeletePost(postId);
    // After deleting, go back to feed
    navigate('/feed', { replace: true });
  };

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '0.55rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 700,
          color: '#0f2942',
          cursor: 'pointer',
          marginBottom: '1.25rem',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
        onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
      >
        <ArrowLeft size={17} />
        Back to Feed
      </button>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center', padding: '4rem 1rem',
          color: '#94a3b8', fontSize: '0.95rem'
        }}>
          Loading post...
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="glass-panel" style={{
          padding: '2.5rem 2rem', textAlign: 'center',
          background: '#fff7f7', border: '1px solid #fecaca'
        }}>
          <AlertTriangle size={36} color="#dc2626" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.4rem' }}>
            Post Not Found
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#b91c1c' }}>{error}</p>
          <button
            onClick={() => navigate('/feed')}
            className="btn-primary"
            style={{ marginTop: '1.25rem' }}
          >
            Go Back to Feed
          </button>
        </div>
      )}

      {/* Post Card — with comments auto-expanded */}
      {!loading && !error && post && (
        <PostCard
          post={post}
          currentUser={currentUser}
          onDeletePost={handleDelete}
          onRequireAuth={() => navigate('/login')}
          defaultShowComments={true}
        />
      )}
    </div>
  );
}
