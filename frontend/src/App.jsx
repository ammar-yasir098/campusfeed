import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HeaderSearchBar from './components/HeaderSearchBar';
import PostCard from './components/PostCard';
import ProfileView from './components/ProfileView';
import CreatePostModal from './components/CreatePostModal';
import ProfileModal from './components/ProfileModal';
import AuthPage from './components/AuthPage';
import AdminDashboard from './components/AdminDashboard';
import NotificationBell from './components/NotificationBell';
import PostDetailView from './components/PostDetailView';
import AuthNoticeModal from './components/AuthNoticeModal';
import { api, getToken, removeToken } from './services/api';
import { Sparkles, MessageSquare, PlusCircle, RefreshCw, ChevronDown, Menu, GraduationCap, Sun, Moon } from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Theme Management (Light / Dark mode persistence)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('campusfeed_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campusfeed_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Sync category and search query directly with URL search params (e.g. /feed?category=Buy+%26+Sell)
  const selectedCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('q') || '';

  const handleSelectCategory = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat && cat !== 'All') {
      newParams.set('category', cat);
    } else {
      newParams.delete('category');
    }
    if (location.pathname !== '/feed') {
      const paramStr = newParams.toString();
      navigate(`/feed${paramStr ? `?${paramStr}` : ''}`);
    } else {
      setSearchParams(newParams, { replace: false });
    }
  };

  const handleSearchQueryChange = (q) => {
    const newParams = new URLSearchParams(searchParams);
    if (q && q.trim()) {
      newParams.set('q', q);
    } else {
      newParams.delete('q');
    }
    if (location.pathname !== '/feed') {
      const paramStr = newParams.toString();
      navigate(`/feed${paramStr ? `?${paramStr}` : ''}`);
    } else {
      setSearchParams(newParams, { replace: false });
    }
  };

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authNoticeModal, setAuthNoticeModal] = useState({ isOpen: false, actionName: 'interact with posts' });

  const handleRequireAuth = (actionName = 'interact with posts') => {
    setAuthNoticeModal({ isOpen: true, actionName });
  };

  const loadMoreRef = useRef(null);

  const path = location.pathname;
  const isAuthPage = path === '/login' || path === '/signup';
  const activeTab = path.replace('/', '') || 'feed';

  // ── Initial Auth Check ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (token) {
      api.getMe()
        .then((res) => setCurrentUser(res.user))
        .catch(() => { removeToken(); setCurrentUser(null); })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  // ── Fetch Posts ─────────────────────────────────────────────────────────────
  const fetchPosts = async () => {
    setLoadingPosts(true);
    setHasMore(true);
    try {
      const limit = searchQuery ? 20 : 5;
      const res = await api.getPosts(selectedCategory, limit, 0, searchQuery);
      setPosts(res.posts || []);
      setHasMore(res.hasMore !== undefined ? res.hasMore : (res.posts?.length >= limit));
    } catch (err) {
      console.error('Failed to load feed posts:', err);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore || loadingPosts) return;
    setLoadingMore(true);
    try {
      const currentOffset = posts.length;
      const res = await api.getPosts(selectedCategory, 5, currentOffset, searchQuery);
      if (res.posts && res.posts.length > 0) {
        setPosts(prev => [...prev, ...res.posts]);
      }
      setHasMore(res.hasMore !== undefined ? res.hasMore : (res.posts?.length >= 5));
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'feed') return;
    // Show loader immediately on feed when user starts typing or changes category
    setLoadingPosts(true);
    // 1-Second (1000ms) Debounce: Wait 1 second after student stops typing before calling backend API
    const delay = searchQuery ? 1000 : 300;
    const timer = setTimeout(() => {
      fetchPosts();
    }, delay);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, activeTab]);

  // Infinite Scroll
  useEffect(() => {
    if (!hasMore || loadingMore || loadingPosts || activeTab !== 'feed') return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMorePosts(); },
      { rootMargin: '200px' }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => { if (loadMoreRef.current) observer.unobserve(loadMoreRef.current); };
  }, [hasMore, loadingMore, loadingPosts, posts.length, searchQuery, activeTab]);

  // Bookmarks
  const fetchBookmarksList = async () => {
    if (!currentUser) return;
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
      fetchBookmarksList();
    }
  }, [currentUser, activeTab]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    removeToken();
    setCurrentUser(null);
    setBookmarkedPosts([]);
    navigate('/login', { replace: true });
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    fetchPosts();
    fetchBookmarksList();
    navigate('/feed', { replace: true });
  };

  const handlePostCreated = (newPost) => setPosts([newPost, ...posts]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action is permanent and cannot be undone.')) return;
    try {
      await api.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
      setBookmarkedPosts(bookmarkedPosts.filter(p => p.id !== postId));
    } catch (err) {
      alert(err.message || 'Unable to delete post. Please try again.');
    }
  };

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

  const filteredPosts = posts;
  const filteredBookmarks = filterBySearch(bookmarkedPosts);

  // ── Loading splash ───────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#475569' }}>
        Loading...
      </div>
    );
  }

  // ── Auth pages — full screen, no sidebar ─────────────────────────────────────
  if (isAuthPage) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <AuthPage
              key="login"
              initialMode="login"
              onAuthSuccess={handleAuthSuccess}
              onCancel={() => navigate('/feed')}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <AuthPage
              key="signup"
              initialMode="signup"
              onAuthSuccess={handleAuthSuccess}
              onCancel={() => navigate('/feed')}
            />
          }
        />
      </Routes>
    );
  }

  // ── Main App Shell ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Top Mobile Header Bar */}
      <div className="mobile-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            className="btn-icon"
            onClick={() => setIsMobileMenuOpen(true)}
            style={{ padding: '0.45rem', color: '#0f2942', background: '#f1f5f9', borderRadius: '8px' }}
            title="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>
          <div onClick={() => navigate('/feed')} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} color="#ffffff" />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f2942' }}>UMT Feed</h3>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{ padding: '0.45rem', color: 'var(--text-main)', background: 'var(--bg-card-hover)', borderRadius: '8px' }}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#64748b" />}
          </button>
          <NotificationBell currentUser={currentUser} />
          {currentUser && (
            <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)} style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}>
              <PlusCircle size={15} />
              <span>Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => { navigate(`/${tab}`); setIsMobileMenuOpen(false); }}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => { handleSelectCategory(cat); setIsMobileMenuOpen(false); }}
        onOpenCreateModal={() => { setIsCreateModalOpen(true); setIsMobileMenuOpen(false); }}
        onOpenAuthModal={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
        onLogout={() => { handleLogout(); setIsMobileMenuOpen(false); }}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        bookmarkCount={bookmarkedPosts.length}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content — single flat Routes tree, NO nesting */}
      <main className="main-content-container">
        <div style={{ maxWidth: activeTab === 'admin' ? '1140px' : '680px', margin: '0 auto', transition: 'max-width 0.22s ease' }}>
          <Routes>

            {/* Default → feed */}
            <Route path="/" element={<Navigate to="/feed" replace />} />

            {/* FEED */}
            <Route path="/feed" element={
              <div>
                <HeaderSearchBar searchQuery={searchQuery} setSearchQuery={handleSearchQueryChange} selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} currentUser={currentUser} theme={theme} toggleTheme={toggleTheme} />

                {!currentUser && (
                  <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Sparkles size={24} color="var(--primary)" />
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>Welcome to CampusFeed!</h4>
                        <p style={{ fontSize: '0.85rem', color: '#b45309' }}>Sign in with your university account to post announcements, join discussion threads, and save events.</p>
                      </div>
                    </div>
                    <button className="btn-primary" onClick={() => navigate('/login')} style={{ whiteSpace: 'nowrap', fontSize: '0.88rem' }}>Sign In</button>
                  </div>
                )}

                {searchQuery && (
                  <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Showing results for "<strong>{searchQuery}</strong>" ({filteredPosts.length} post{filteredPosts.length === 1 ? '' : 's'} found)
                  </div>
                )}

                {loadingPosts ? (
                  <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw size={26} color="var(--primary)" style={{ animation: 'cfSpin 0.9s linear infinite', marginBottom: '0.65rem' }} />
                    <style>{`
                      @keyframes cfSpin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {searchQuery ? `Searching for "${searchQuery}"...` : 'Loading campus feed...'}
                    </div>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', background: '#ffffff' }}>
                    <MessageSquare size={40} color="var(--text-dim)" style={{ marginBottom: '0.75rem' }} />
                    <h3 className="font-heading" style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>No posts found</h3>
                    <p style={{ fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                      {searchQuery ? `No posts matched "${searchQuery}"` : `No posts found in category "${selectedCategory}".`}
                    </p>
                    {currentUser && (
                      <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)} style={{ margin: '0 auto' }}>
                        <PlusCircle size={18} /><span>Create First Post</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {filteredPosts.map((post) => (
                      <PostCard key={post.id} post={post} currentUser={currentUser} onDeletePost={handleDeletePost} onRequireAuth={handleRequireAuth} />
                    ))}
                    {!searchQuery && (
                      <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                        {loadingMore ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /><span>Loading 3 more posts...</span>
                          </div>
                        ) : hasMore ? (
                          <button className="btn-secondary" onClick={loadMorePosts} style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}>
                            <ChevronDown size={17} /><span>Load 3 More Posts</span>
                          </button>
                        ) : posts.length > 0 ? (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>✓ You're all caught up! End of UMT feed.</p>
                        ) : null}
                      </div>
                    )}
                  </>
                )}
              </div>
            } />

            {/* BOOKMARKS */}
            <Route path="/bookmarks" element={
              currentUser ? (
                <div>
                  <HeaderSearchBar searchQuery={searchQuery} setSearchQuery={handleSearchQueryChange} selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} currentUser={currentUser} />
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Saved Announcements & Events</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Access all your bookmarked posts in one place.</p>
                  </div>
                  {loadingBookmarks ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>Loading saved bookmarks...</div>
                  ) : filteredBookmarks.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', background: '#ffffff' }}>
                      <p style={{ fontSize: '1rem' }}>No saved posts yet. Tap the bookmark icon on any post in your feed to save it here!</p>
                    </div>
                  ) : (
                    filteredBookmarks.map((post) => (
                      <PostCard key={post.id} post={post} currentUser={currentUser} onDeletePost={handleDeletePost} onRequireAuth={handleRequireAuth} />
                    ))
                  )}
                </div>
              ) : <Navigate to="/login" replace />
            } />

            {/* PROFILE */}
            <Route path="/profile" element={
              currentUser
                ? <ProfileView currentUser={currentUser} onOpenEditProfile={() => setIsProfileModalOpen(true)} onDeletePost={handleDeletePost} theme={theme} toggleTheme={toggleTheme} />
                : <Navigate to="/login" replace />
            } />

            {/* ADMIN */}
            <Route path="/admin" element={
              currentUser ? (
                currentUser.role === 'admin'
                  ? <AdminDashboard currentUser={currentUser} />
                  : <Navigate to="/feed" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } />

            {/* SINGLE POST DETAIL VIEW (from notification click) */}
            <Route path="/posts/:id" element={
              <PostDetailView currentUser={currentUser} onDeletePost={handleDeletePost} />
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/feed" replace />} />

          </Routes>
        </div>
      </main>

      {/* MODALS */}
      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onPostCreated={handlePostCreated} />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updatedUser) => { setCurrentUser(updatedUser); fetchPosts(); }}
      />
      <AuthNoticeModal
        isOpen={authNoticeModal.isOpen}
        actionName={authNoticeModal.actionName}
        onClose={() => setAuthNoticeModal({ isOpen: false, actionName: 'interact with posts' })}
      />
    </div>
  );
}
