import React, { useState, useEffect } from 'react';
import { User, Edit3, Award, BookOpen, Layers, Bookmark as BookmarkIcon, Clock } from 'lucide-react';
import { api, resolveImageUrl } from '../services/api';
import PostCard from './PostCard';

export default function ProfileView({ currentUser, onOpenEditProfile, onDeletePost }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('posts'); // 'posts' or 'bookmarks'
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getProfile();
      setProfileData(res.user);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    setLoadingBookmarks(true);
    try {
      const res = await api.getBookmarks();
      setBookmarkedPosts(res.savedPosts || []);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeSubTab === 'bookmarks') {
      fetchBookmarks();
    }
  }, [activeSubTab]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
        Loading profile information...
      </div>
    );
  }

  const user = profileData || currentUser;

  return (
    <div>
      {/* Profile Header Card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', background: '#ffffff' }}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {user.avatarUrl ? (
              <img 
                src={resolveImageUrl(user.avatarUrl)} 
                alt={user.name} 
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: 'var(--shadow-glow)' }}
              />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem', fontWeight: 800, boxShadow: 'var(--shadow-glow)' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <div>
              <h2 className="font-heading" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {user.name}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                {user.email}
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.4rem' }}>
                {user.department && (
                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                    <BookOpen size={13} />
                    {user.department}
                  </span>
                )}
                {user.studentId && (
                  <span className="badge" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }}>
                    <Award size={13} />
                    ID: {user.studentId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button className="btn-secondary" onClick={onOpenEditProfile}>
            <Edit3 size={16} />
            <span>Edit Profile</span>
          </button>

        </div>

        {/* Student Bio */}
        {user.bio && (
          <p style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            "{user.bio}"
          </p>
        )}

      </div>

      {/* Profile Activity Tabs: My Posts vs Bookmarks */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
        <button
          onClick={() => setActiveSubTab('posts')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'posts' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeSubTab === 'posts' ? 'var(--primary)' : 'var(--text-muted)',
            paddingBottom: '0.65rem',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <Layers size={17} />
          <span>My Posts ({user.postCount || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bookmarks')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'bookmarks' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeSubTab === 'bookmarks' ? 'var(--primary)' : 'var(--text-muted)',
            paddingBottom: '0.65rem',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <BookmarkIcon size={17} />
          <span>Saved Bookmarks</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeSubTab === 'posts' ? (
        <div>
          {!user.posts || user.posts.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1rem' }}>You haven't created any campus posts yet.</p>
            </div>
          ) : (
            user.posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={{ ...post, author: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } }} 
                currentUser={currentUser}
                onDeletePost={onDeletePost}
              />
            ))
          )}
        </div>
      ) : (
        <div>
          {loadingBookmarks ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>Loading saved posts...</div>
          ) : bookmarkedPosts.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1rem' }}>No saved bookmarks yet. Tap the bookmark icon on any post to save it!</p>
            </div>
          ) : (
            bookmarkedPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser}
                onDeletePost={onDeletePost}
              />
            ))
          )}
        </div>
      )}

    </div>
  );
}
