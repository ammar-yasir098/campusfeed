import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MediaLightboxModal({ media, onClose }) {
  const isVideo = media?.type === 'video';
  const images = media?.images || (media?.src ? [media.src] : []);
  const [currentIndex, setCurrentIndex] = useState(media?.index || 0);

  useEffect(() => {
    if (typeof media?.index === 'number') {
      setCurrentIndex(media.index);
    }
  }, [media?.index, media?.src]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (!isVideo && images.length > 1) {
        if (e.key === 'ArrowLeft') {
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        } else if (e.key === 'ArrowRight') {
          setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isVideo, images.length]);

  if (!media || (!media.src && images.length === 0)) return null;

  const currentSrc = !isVideo && images.length > 0 ? images[currentIndex] : media.src;

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
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '2rem'
      }}
    >
      {/* Top Floating Bar */}
      <div 
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 100000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isVideo && images.length > 1 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            padding: '0.4rem 0.85rem',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.5px'
          }}>
            {currentIndex + 1} / {images.length}
          </div>
        )}

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

      {/* Prev Navigation Button */}
      {!isVideo && images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
          }}
          style={{
            position: 'fixed',
            left: '2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            transition: 'all 0.2s ease'
          }}
          title="Previous Photo (←)"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Next Navigation Button */}
      {!isVideo && images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
          }}
          style={{
            position: 'fixed',
            right: '2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            transition: 'all 0.2s ease'
          }}
          title="Next Photo (→)"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Large Media Container */}
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
            src={currentSrc} 
            controls 
            controlsList="nofullscreen"
            autoPlay 
            preload="metadata"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '0px',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.15)',
              background: '#000000'
            }} 
          />
        ) : (
          <img 
            src={currentSrc} 
            alt={media.alt || 'Enlarged media'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '0px',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.15)'
            }} 
          />
        )}
      </div>
    </div>,
    document.body
  );
}
