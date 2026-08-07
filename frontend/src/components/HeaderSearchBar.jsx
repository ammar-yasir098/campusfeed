import React from 'react';
import { Search, X } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function HeaderSearchBar({ searchQuery, setSearchQuery, currentUser }) {
  return (
    <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
      
      {/* Search Input — takes all remaining space */}
      <div style={{ position: 'relative', flex: 1 }}>
        <Search 
          size={18} 
          style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
        />
        <input 
          type="text"
          className="input-field"
          placeholder="Search announcements, exam dates, events, or student name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            paddingLeft: '2.6rem', 
            paddingRight: searchQuery ? '2.4rem' : '0.9rem',
            height: '42px', 
            fontSize: '0.88rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)'
          }}
        />

        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            style={{ 
              position: 'absolute', 
              right: '0.65rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.2rem'
            }}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Notification Bell — pinned top-right of content area (desktop only) */}
      <div className="desktop-notif-bell">
        <NotificationBell currentUser={currentUser} />
      </div>

    </div>
  );
}

