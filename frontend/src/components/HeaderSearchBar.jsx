import React from 'react';
import { Search, X, GraduationCap } from 'lucide-react';

export default function HeaderSearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      
      {/* Header Title Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f2942' }}>
            UMT Student Announcement & Discussion Feed
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Official student communication portal — University of Management and Technology
          </p>
        </div>
      </div>

      {/* Full Width Search Input */}
      <div style={{ position: 'relative' }}>
        <Search 
          size={19} 
          style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
        />
        <input 
          type="text"
          className="input-field"
          placeholder="Search announcements, exam dates, events, or student name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            paddingLeft: '2.8rem', 
            paddingRight: searchQuery ? '2.5rem' : '1rem',
            height: '48px', 
            fontSize: '0.95rem',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
            border: '1px solid #cbd5e1'
          }}
        />

        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            style={{ 
              position: 'absolute', 
              right: '0.75rem', 
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
            <X size={17} />
          </button>
        )}
      </div>

    </div>
  );
}
