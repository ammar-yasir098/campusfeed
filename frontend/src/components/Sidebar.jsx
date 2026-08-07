import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  PlusCircle, 
  Bookmark, 
  User, 
  LogOut, 
  LogIn, 
  Compass,
  Megaphone,
  Calendar,
  MessageSquare,
  AlertCircle,
  ShoppingBag,
  Layers,
  Award,
  ShieldCheck,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { resolveImageUrl } from '../services/api';


const CATEGORIES = [
  { id: 'All', label: 'All Feed', icon: Layers },
  { id: 'Announcements', label: 'Announcements', icon: Megaphone },
  { id: 'Events', label: 'Events', icon: Calendar },
  { id: 'General', label: 'General', icon: MessageSquare },
  { id: 'Lost & Found', label: 'Lost & Found', icon: AlertCircle },
  { id: 'Buy & Sell', label: 'Buy & Sell', icon: ShoppingBag },
];

export default function Sidebar({
  currentUser,
  activeTab,
  setActiveTab,
  selectedCategory,
  onSelectCategory,
  onOpenCreateModal,
  onOpenAuthModal,
  onLogout,
  isMobileOpen,
  onCloseMobile,
  bookmarkCount = 0,
  theme,
  toggleTheme
}) {
  const navigate = useNavigate();
  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 45
          }}
        />
      )}

      <aside className={`sidebar-aside ${isMobileOpen ? 'mobile-open' : ''}`}>
        
        {/* Scrollable Top Section */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.2rem', marginBottom: '0.75rem' }}>
          
          {/* UMT Official Logo & Crest + Close button on mobile */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div 
          onClick={() => navigate('/feed')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            >
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: 'var(--primary-gradient)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(15, 41, 66, 0.25)'
              }}>
                <GraduationCap size={22} color="#ffffff" />
              </div>
              <div>
                <h2 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                  UMT Feed
                </h2>
                <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  University Portal
                </span>
              </div>
            </div>

            {/* Mobile Close Icon */}
            {isMobileOpen && (
              <button 
                className="btn-icon" 
                onClick={onCloseMobile}
                style={{ color: 'var(--text-muted)' }}
                title="Close Menu"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* UMT Official Motto Banner */}
          <div style={{ background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.75rem', marginBottom: '1.25rem', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 700 }}>
              <Award size={14} color="var(--primary)" />
              <span>UMT LAHORE</span>
            </div>
            <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontWeight: 500 }}>
              Transforming Learners into Leaders
            </p>
          </div>

          {/* Create Post Button */}
          {currentUser ? (
            <button 
              className="btn-primary" 
              onClick={onOpenCreateModal}
              style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem', padding: '0.7rem 1rem', fontSize: '0.9rem' }}
            >
              <PlusCircle size={18} />
              <span>Create New Post</span>
            </button>
          ) : (
            <button 
              className="btn-primary" 
              onClick={onOpenAuthModal}
              style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem', padding: '0.7rem 1rem', fontSize: '0.9rem' }}
            >
              <LogIn size={18} />
              <span>Sign In / Register</span>
            </button>
          )}

          {/* Main Navigation Menu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
              Campus Navigation
            </span>

            <button 
              className={`nav-link ${activeTab === 'feed' ? 'active' : ''}`}
              onClick={() => setActiveTab('feed')}
            >
              <Compass size={18} />
              <span>Campus Feed</span>
            </button>

            {currentUser && (
              <button 
                className={`nav-link ${activeTab === 'bookmarks' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookmarks')}
              >
                <Bookmark size={18} />
                <span>Saved Bookmarks</span>
              </button>
            )}

            {currentUser && (
              <button 
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} />
                <span>My Student Profile</span>
              </button>
            )}

            {currentUser && currentUser.role === 'admin' && (
              <button 
                className={`admin-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <ShieldCheck size={19} color="#ffffff" />
                <span>Admin Control Panel</span>
              </button>
            )}
          </div>

          {/* Category Filters Menu */}
          {activeTab === 'feed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
                Categories
              </span>

              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.5rem 0.8rem',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '0.86rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                  >
                    <Icon size={16} color={isSelected ? 'var(--primary)' : 'currentColor'} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* Pinned Bottom User Card / Logout */}
        <div style={{ flexShrink: 0, paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)', background: 'transparent' }}>
          {currentUser ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '0.5rem',
              padding: '0.4rem 0.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border-glass)'
            }}>
              <div 
                onClick={() => navigate('/profile')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', minWidth: 0, flex: 1 }}
              >
                {currentUser.avatarUrl ? (
                  <img 
                    src={resolveImageUrl(currentUser.avatarUrl)} 
                    alt={currentUser.name} 
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                    {currentUser.name}
                  </h5>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.email || 'Student'}
                  </span>
                </div>
              </div>

              <button 
                className="btn-icon" 
                onClick={onLogout}
                title="Sign Out"
                style={{ 
                  color: '#dc2626', 
                  background: '#fee2e2', 
                  padding: '0.45rem', 
                  borderRadius: '8px', 
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={onOpenAuthModal} style={{ width: '100%', justifyContent: 'center' }}>
              <LogIn size={17} />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </aside>
    </>
  );
}
