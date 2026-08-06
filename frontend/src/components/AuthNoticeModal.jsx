import React from 'react';
import { Lock, LogIn, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthNoticeModal({ isOpen, onClose, actionName = 'interact with posts' }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleProceed = () => {
    onClose();
    navigate('/login');
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          padding: '1.85rem',
          maxWidth: '410px',
          width: '100%',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={19} />
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f2942' }}>
                Account Required
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>UMT Campus Feed</span>
            </div>
          </div>
          <button 
            className="btn-icon" 
            onClick={onClose}
            style={{ color: '#94a3b8', padding: '0.35rem' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.4rem' }}>
          You are currently browsing as a guest. Please sign in or create a student account to <strong>{actionName}</strong>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <button 
            className="btn-primary" 
            onClick={handleProceed}
            style={{ width: '100%', justifyContent: 'center', padding: '0.72rem', fontSize: '0.9rem', borderRadius: '10px' }}
          >
            <LogIn size={17} />
            <span>Sign In to Continue</span>
          </button>

          <button 
            className="btn-secondary" 
            onClick={onClose}
            style={{ width: '100%', justifyContent: 'center', padding: '0.6rem', fontSize: '0.84rem', borderRadius: '10px', color: '#64748b', border: '1px solid #e2e8f0' }}
          >
            Continue Browsing as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
