import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import HeaderSearchBar from './components/HeaderSearchBar';
import PostCard from './components/PostCard';
import ProfileView from './components/ProfileView';
import CreatePostModal from './components/CreatePostModal';
import ProfileModal from './components/ProfileModal';
import AuthPage from './components/AuthPage';
import { api, getToken, removeToken } from './services/api';
import { Sparkles, MessageSquare, PlusCircle, RefreshCw, ChevronDown } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Default to 'login' page if not authenticated, otherwise 'feed'
  const [activeTab, setActiveTab] = useState(() => {
    const token = getToken();
    return token ? 'feed' : 'login';
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Pagination State
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Sentinel ref for infinite scroll triggering
  const loadMoreRef = useRef(null);

  // Initial Auth Check
  useEffect(() => {
    const token = getToken();
    if (token) {
      api.getMe()
        .then((res) => {
          setCurrentUser(res.user);
        })
        .catch(() => {
          removeToken();
          setCurrentUser(null);
          setActiveTab('login');
        });
    } else {
      setActiveTab('login');
    }
  }, []);

  // Fetch Initial Batch (5 posts)
  const fetchPosts = async () => {
    setLoadingPosts(true);
    setHasMore(true);
    try {
      const res = await api.getPosts(selectedCategory, 5, 0);
      setPosts(res.posts || []);
      setHasMore(res.hasMore !== undefined ? res.hasMore : (res.posts?.length >= 5));
    } catch (err) {
      console.error('Failed to load feed posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fetch Next Batch (3 posts)
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore || loadingPosts || searchQuery) return;
    setLoadingMore(true);
    try {
      const currentOffset = posts.length;
      const res = await api.getPosts(selectedCategory, 3, currentOffset);
      if (res.posts && res.posts.length > 0) {
        setPosts(prev => [...prev, ...res.posts]);
      }
      setHasMore(res.hasMore !== undefined ? res.hasMore : (res.posts?.length >= 3));
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchPosts();
    }
  }, [selectedCategory, activeTab]);

  // Infinite Scroll Trigger using IntersectionObserver
  useEffect(() => {
    if (!hasMore || loadingMore || loadingPosts || searchQuery || activeTab !== 'feed') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, loadingMore, loadingPosts, posts.length, searchQuery, activeTab]);

  // Fetch Bookmarks for Bookmarks tab
  useEffect(() => {
    if (activeTab === 'bookmarks' && currentUser) {
      setLoadingBookmarks(true);
      api.getBookmarks()
        .then((res) => setBookmarkedPosts(res.savedPosts || []))
        .catch((err) => console.error('Failed to load bookmarks:', err))
        .finally(() => setLoadingBookmarks(false));
    }
  }, [activeTab, currentUser]);

  // Handlers
  const handleLogout = () => {
    removeToken();
    setCurrentUser(null);
    setActiveTab('login');
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
      setBookmarkedPosts(bookmarkedPosts.filter(p => p.id !== postId));
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    }
  };

  // Filter posts by search query (Title, Content, Category, Author Name)
  const filterBySearch = (list) => {
    if (!searchQuery || !searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(p => 
      (p.title && p.title.toLowerCase().includes(q)) || 
      (p.content && p.content.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.author?.name && p.author.name.toLowerCase().includes(q))
    );
  };

  const filteredPosts = filterBySearch(posts);
  const filteredBookmarks = filterBySearch(bookmarkedPosts);

  // Dedicated Full-Page Auth View (Sign In & Registration as First Page)
  if (activeTab === 'login' || activeTab === 'signup') {
    return (
      <AuthPage 
        initialMode={activeTab === 'signup' ? 'signup' : 'login'}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('feed');
          fetchPosts();
        }}
        onCancel={() => setActiveTab('feed')}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      
      {/* Docked Left Sidebar */}
      <Sidebar 
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenAuthModal={() => setActiveTab('login')}
        onLogout={handleLogout}
      />

      {/* Main Feed Content Container */}
      <main style={{ 
        marginLeft: '270px', 
        padding: '2rem 2rem 4rem 2rem',
        minHeight: '100vh'
      }}>
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>

          {/* Top Search Bar */}
          <HeaderSearchBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* FEED TAB */}
          {activeTab === 'feed' && (
            <div>

              {/* Banner Callout for Guest Users */}
              {!currentUser && (
                <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Sparkles size={24} color="var(--primary)" />
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>
                        Welcome to CampusFeed!
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: '#b45309' }}>
                        Sign in with your university account to post announcements, join discussion threads, and save events.
                      </p>
                    </div>
                  </div>
                  <button className="btn-primary" onClick={() => setActiveTab('login')} style={{ whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                    Sign In
                  </button>
                </div>
              )}

              {/* Feed Status Header if searching */}
              {searchQuery && (
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Showing results for "<strong>{searchQuery}</strong>" ({filteredPosts.length} post{filteredPosts.length === 1 ? '' : 's'} found)
                </div>
              )}

              {/* Posts List */}
              {loadingPosts ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                  Loading campus feed...
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', background: '#ffffff' }}>
                  <MessageSquare size={40} color="var(--text-dim)" style={{ marginBottom: '0.75rem' }} />
                  <h3 className="font-heading" style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                    No posts found
                  </h3>
                  <p style={{ fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                    {searchQuery ? `No posts matched "${searchQuery}"` : `No posts found in category "${selectedCategory}".`}
                  </p>
                  {currentUser && (
                    <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)} style={{ margin: '0 auto' }}>
                      <PlusCircle size={18} />
                      <span>Create First Post</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {filteredPosts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      currentUser={currentUser}
                      onDeletePost={handleDeletePost}
                      onRequireAuth={() => setActiveTab('login')}
                    />
                  ))}

                  {/* Infinite Scroll Sentinel & Load More Trigger */}
                  {!searchQuery && (
                    <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                      {loadingMore ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                          <RefreshCw size={18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Loading 3 more posts...</span>
                        </div>
                      ) : hasMore ? (
                        <button 
                          className="btn-secondary" 
                          onClick={loadMorePosts}
                          style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}
                        >
                          <ChevronDown size={17} />
                          <span>Load 3 More Posts</span>
                        </button>
                      ) : posts.length > 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                          ✓ You're all caught up! End of UMT feed.
                        </p>
                      ) : null}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* BOOKMARKS TAB */}
          {activeTab === 'bookmarks' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Saved Announcements & Events
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Access all your bookmarked posts in one place.
                </p>
              </div>

              {loadingBookmarks ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                  Loading saved bookmarks...
                </div>
              ) : filteredBookmarks.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', background: '#ffffff' }}>
                  <p style={{ fontSize: '1rem' }}>No saved posts yet. Tap the bookmark icon on any post in your feed to save it here!</p>
                </div>
              ) : (
                filteredBookmarks.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUser={currentUser}
                    onDeletePost={handleDeletePost}
                    onRequireAuth={() => setActiveTab('login')}
                  />
                ))
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && currentUser && (
            <ProfileView 
              currentUser={currentUser}
              onOpenEditProfile={() => setIsProfileModalOpen(true)}
              onDeletePost={handleDeletePost}
            />
          )}

        </div>
      </main>

      {/* MODALS */}
      <CreatePostModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          fetchPosts();
        }}
      />

    </div>
  );
}
