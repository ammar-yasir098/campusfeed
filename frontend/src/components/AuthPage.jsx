import React, { useState } from 'react';
import { 
  GraduationCap, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Bell, 
  Bookmark,
  Mail,
  Lock,
  User
} from 'lucide-react';
import { api, setToken } from '../services/api';

export default function AuthPage({ initialMode = 'login', onAuthSuccess, onCancel }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Full name is required');
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
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your UMT credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-main)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem 1rem' 
    }}>
      
      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '980px', 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
        border: '1px solid #cbd5e1'
      }}>
        
        {/* Left UMT Branding Hero Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0f2942 0%, #1e3a8a 100%)', 
          padding: '3rem 2.5rem', 
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            {/* High-Contrast UMT Logo */}
            <div 
              onClick={onCancel}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', marginBottom: '2.5rem' }}
            >
              <div style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '12px', 
                background: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)' 
              }}>
                <GraduationCap size={26} color="#0f2942" />
              </div>
              <div>
                <h2 className="font-heading" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                  UMT Portal
                </h2>
                <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  University of Management & Technology
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="font-heading" style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '1rem', color: '#ffffff' }}>
              Transforming Learners into Leaders of Tomorrow.
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '2.5rem' }}>
              Sign in with your official UMT student account to access university announcements, department discussions, and campus events.
            </p>

            {/* Bullet Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}>
                  <Bell size={18} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Official UMT announcements & exam schedules</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}>
                  <Users size={18} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Connect across SST, HSM, and UMT schools</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}>
                  <Bookmark size={18} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Bookmark campus hackathons & society events</span>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '0.82rem', color: '#94a3b8' }}>
            UMT Student Information Portal &copy; 2026 Lahore, Pakistan
          </div>
        </div>

        {/* Right Form Card Section */}
        <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* Top Bar: Browse Feed as Guest Link */}
          <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="button"
              onClick={onCancel} 
              style={{ background: 'transparent', border: 'none', color: '#0f2942', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}
            >
              <span>Browse Feed as Guest</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '2rem' }}>
            <button 
              type="button" 
              onClick={() => { setMode('login'); setError(''); }}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: mode === 'login' ? '3px solid #0f2942' : '3px solid transparent',
                color: mode === 'login' ? '#0f2942' : 'var(--text-muted)',
                paddingBottom: '0.75rem',
                fontWeight: 700,
                fontSize: '1.2rem',
                cursor: 'pointer',
                marginBottom: '-2px',
                transition: 'all 0.2s ease'
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
                borderBottom: mode === 'signup' ? '3px solid #0f2942' : '3px solid transparent',
                color: mode === 'signup' ? '#0f2942' : 'var(--text-muted)',
                paddingBottom: '0.75rem',
                fontWeight: 700,
                fontSize: '1.2rem',
                cursor: 'pointer',
                marginBottom: '-2px',
                transition: 'all 0.2s ease'
              }}
            >
              Register Student Account
            </button>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {mode === 'signup' && (
              <div>
                <label className="input-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Muhammad Ali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ paddingLeft: '2.6rem' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="input-label">UMT Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="e.g. s2026@umt.edu.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '2.6rem' }}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '2.6rem' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', height: '48px', fontSize: '1rem', marginTop: '0.5rem' }} 
              disabled={loading}
            >
              {mode === 'login' ? <LogIn size={19} /> : <UserPlus size={19} />}
              <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
