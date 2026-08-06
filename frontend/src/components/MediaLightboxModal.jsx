import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

export default function MediaLightboxModal({ media, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!media || !media.src) return null;

  const isVideo = media.type === 'video';

  return ReactDOM.createPortal(
    <div 
      className="lightbox-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '2rem'
      }}
    >
      {/* Floating Control Buttons */}
      <div 
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          zIndex: 100000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            padding: '0.65rem',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          title="Close (Esc)"
        >
          <X size={24} />
        </button>
      </div>

      {/* Large Media Container covering 60-80% of screen */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '85vw',
          height: '75vh',
          maxWidth: '1200px',
          maxHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isVideo ? (
          <video 
            src={media.src} 
            controls 
            controlsList="nofullscreen"
            autoPlay 
            preload="metadata"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '16px',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.15)',
              background: '#000000'
            }} 
          />
        ) : (
          <img 
            src={media.src} 
            alt={media.alt || 'Enlarged media'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '16px',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.15)'
            }} 
          />
        )}
      </div>
    </div>,
    document.body
  );
}
