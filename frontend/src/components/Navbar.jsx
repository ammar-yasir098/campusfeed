import React from 'react';
import { 
  Sparkles, 
  PlusCircle, 
  Bookmark, 
  User, 
  LogOut, 
  LogIn, 
  Search,
  MessageSquare,
  Compass
} from 'lucide-react';
import { resolveImageUrl } from '../services/api';

export default function Navbar({ 
  currentUser, 
  activeTab, 
  setActiveTab, 
  onOpenCreateModal, 
  onOpenAuthModal, 
  onLogout,
  searchQuery,
  setSearchQuery
}) {
  return (
    <header className="glass-panel" style={{ position: 'sticky', top: '0.75rem', zIndex: 50, marginBottom: '2rem' }}>
      <div style={{ padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('feed')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
        >
          <div style={{ 
            width: '38px', 
            height: '38px', 
            borderRadius: '12px', 
            background: 'var(--primary-gradient)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <h2 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CampusFeed
            </h2>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
          <Search size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="input-field"
            placeholder="Search campus announcements, events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.6rem', height: '40px', fontSize: '0.9rem' }}
          />
        </div>

        {/* Nav Links & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          <button 
            className={`btn-secondary ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
            style={{ 
              height: '40px',
              background: activeTab === 'feed' ? 'rgba(99, 102, 241, 0.2)' : undefined,
              borderColor: activeTab === 'feed' ? 'var(--primary)' : undefined,
              color: activeTab === 'feed' ? '#ffffff' : undefined
            }}
          >
            <Compass size={18} />
            <span>Feed</span>
          </button>

          {currentUser && (
            <button 
              className={`btn-secondary ${activeTab === 'bookmarks' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookmarks')}
              style={{ 
                height: '40px',
                background: activeTab === 'bookmarks' ? 'rgba(99, 102, 241, 0.2)' : undefined,
                borderColor: activeTab === 'bookmarks' ? 'var(--primary)' : undefined,
                color: activeTab === 'bookmarks' ? '#ffffff' : undefined
              }}
            >
              <Bookmark size={18} />
              <span>Saved</span>
            </button>
          )}

          {currentUser ? (
            <>
              <button 
                className="btn-primary" 
                onClick={onOpenCreateModal}
                style={{ height: '40px', fontSize: '0.9rem' }}
              >
                <PlusCircle size={18} />
                <span>New Post</span>
              </button>

              <div 
                onClick={() => setActiveTab('profile')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem', 
                  cursor: 'pointer',
                  padding: '0.25rem 0.6rem 0.25rem 0.3rem',
                  borderRadius: 'var(--radius-full)',
                  border: activeTab === 'profile' ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                  background: activeTab === 'profile' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                {currentUser.avatarUrl ? (
                  <img 
                    src={resolveImageUrl(currentUser.avatarUrl)} 
                    alt={currentUser.name} 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {currentUser.name ? currentUser.name.split(' ')[0] : 'Profile'}
                </span>
              </div>

              <button 
                className="btn-icon"
                title="Logout"
                onClick={onLogout}
                style={{ color: '#ef4444' }}
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={onOpenAuthModal} style={{ height: '40px' }}>
              <LogIn size={18} />
              <span>Login / Sign Up</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
