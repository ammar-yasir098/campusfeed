import React from 'react';
import { Megaphone, Calendar, MessageSquare, AlertCircle, ShoppingBag, Layers } from 'lucide-react';

const CATEGORIES = [
  { id: 'All', label: 'All Feed', icon: Layers },
  { id: 'Announcements', label: 'Announcements', icon: Megaphone },
  { id: 'Events', label: 'Events', icon: Calendar },
  { id: 'General', label: 'General', icon: MessageSquare },
  { id: 'Lost & Found', label: 'Lost & Found', icon: AlertCircle },
  { id: 'Buy & Sell', label: 'Buy & Sell', icon: ShoppingBag },
];

export default function CategoryFilter({ selectedCategory, onSelectCategory }) {
  return (
    <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem', scrollbarWidth: 'none' }}>
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
              background: isSelected ? 'var(--primary-gradient)' : 'var(--bg-glass)',
              color: isSelected ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: isSelected ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? 'var(--shadow-glow)' : 'none'
            }}
          >
            <Icon size={16} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
