import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { api, setToken } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
          setError('Full name can only contain letters and spaces (no numbers or special characters)');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please verify and try again.');
          setLoading(false);
          return;
        }
        await api.signup({ name, email, password });
        // Automatically login after signup
        const loginRes = await api.login({ email, password });
        setToken(loginRes.token);
        onAuthSuccess(loginRes.user);
      } else {
        const loginRes = await api.login({ email, password });
        setToken(loginRes.token);
        onAuthSuccess(loginRes.user);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '440px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-glass)' }}>
            <button 
              type="button" 
              onClick={() => { setMode('login'); setError(''); }}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: mode === 'login' ? '2px solid var(--primary)' : '2px solid transparent',
                color: mode === 'login' ? 'var(--text-main)' : 'var(--text-muted)',
                paddingBottom: '0.5rem',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button 
              type="button" 
              onClick={() => { setMode('signup'); setError(''); }}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: mode === 'signup' ? '2px solid var(--primary)' : '2px solid transparent',
                color: mode === 'signup' ? 'var(--text-main)' : 'var(--text-muted)',
                paddingBottom: '0.5rem',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer'
              }}
            >
              Register
            </button>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {mode === 'signup' && (
            <div>
              <label className="input-label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Alex Student"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                maxLength={30}
                required
              />
            </div>
          )}

          <div>
            <label className="input-label">University Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="e.g. student@uni.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="input-label">Confirm Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
            {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
          </button>

        </form>

      </div>
    </div>
  );
}
