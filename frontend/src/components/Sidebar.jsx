import React from 'react';
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
  Award
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
  onLogout
}) {
  return (
    <aside style={{
      width: '270px',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1.75rem 1.25rem',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      boxShadow: '4px 0 20px rgba(15, 23, 42, 0.04)',
      overflowY: 'auto'
    }}>
      
      {/* Top Section */}
      <div>
        
        {/* UMT Official Logo & Crest */}
        <div 
          onClick={() => setActiveTab('feed')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.75rem' }}
        >
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'var(--primary-gradient)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(15, 41, 66, 0.25)'
          }}>
            <GraduationCap size={24} color="#ffffff" />
          </div>
          <div>
            <h2 className="font-heading" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f2942', lineHeight: 1.1 }}>
              UMT Feed
            </h2>
            <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              University Portal
            </span>
          </div>
        </div>

        {/* UMT Official Motto Banner */}
        <div style={{ background: '#f0f6ff', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.75rem', marginBottom: '1.5rem', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f2942', fontSize: '0.75rem', fontWeight: 700 }}>
            <Award size={14} color="#0f2942" />
            <span>UMT LAHORE</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#334155', marginTop: '0.15rem', fontWeight: 500 }}>
            Transforming Learners into Leaders
          </p>
        </div>

        {/* Create Post Button */}
        {currentUser ? (
          <button 
            className="btn-primary" 
            onClick={onOpenCreateModal}
            style={{ width: '100%', justifyContent: 'center', marginBottom: '1.75rem', padding: '0.75rem 1rem', fontSize: '0.92rem' }}
          >
            <PlusCircle size={18} />
            <span>Create New Post</span>
          </button>
        ) : (
          <button 
            className="btn-primary" 
            onClick={onOpenAuthModal}
            style={{ width: '100%', justifyContent: 'center', marginBottom: '1.75rem', padding: '0.75rem 1rem', fontSize: '0.92rem' }}
          >
            <LogIn size={18} />
            <span>Sign In / Register</span>
          </button>
        )}

        {/* Main Navigation Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.75rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
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
        </div>

        {/* Category Filters Menu */}
        {activeTab === 'feed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
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
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isSelected ? '#eff6ff' : 'transparent',
                    color: isSelected ? '#0f2942' : '#475569',
                    fontSize: '0.88rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={16} color={isSelected ? '#0f2942' : 'currentColor'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* Bottom User Card / Logout */}
      {currentUser ? (
        <div style={{ 
          paddingTop: '1rem', 
          borderTop: '1px solid #e2e8f0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <div 
            onClick={() => setActiveTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', overflow: 'hidden' }}
          >
            {currentUser.avatarUrl ? (
              <img 
                src={resolveImageUrl(currentUser.avatarUrl)} 
                alt={currentUser.name} 
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0f2942' }}
              />
            ) : (
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '0.9rem' }}>
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f2942', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </h5>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.email}
              </span>
            </div>
          </div>

          <button 
            className="btn-icon" 
            onClick={onLogout}
            title="Sign Out"
            style={{ color: '#dc2626' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <button className="btn-primary" onClick={onOpenAuthModal} style={{ width: '100%', justifyContent: 'center' }}>
            <LogIn size={17} />
            <span>Sign In</span>
          </button>
        </div>
      )}

    </aside>
  );
}
