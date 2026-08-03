import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  ArrowRight, 
  Users, 
  Bell, 
  Bookmark,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { api, setToken } from '../services/api';

export default function AuthPage({ initialMode = 'login', onAuthSuccess, onCancel }) {
  const navigate = useNavigate();
  const mode = initialMode; // Fixed by URL — no internal toggle
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      background: 'radial-gradient(circle at 15% 15%, #1e3a8a 0%, #0f172a 55%, #0b1329 100%)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2.5rem 1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Subtle Ambient Glow Blobs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(15, 41, 66, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none'
      }} />

      {/* Main Glassmorphic Card Container */}
      <div className="auth-card-container" style={{ 
        width: '100%', 
        maxWidth: '1020px', 
        display: 'grid', 
        gridTemplateColumns: '1.1fr 1fr', 
        borderRadius: '24px',
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Left UMT Branding Hero Section */}
        <div style={{ 
          background: 'linear-gradient(145deg, #0b1e36 0%, #0f2942 50%, #1e3a8a 100%)', 
          padding: '3.5rem 3rem', 
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Grid Background Pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            opacity: 0.6,
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            
            {/* Live Campus Portal Chip */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#93c5fd',
              marginBottom: '2rem',
              letterSpacing: '0.02em'
            }}>
              <Sparkles size={14} color="#60a5fa" />
              <span>Official UMT Student Network</span>
            </div>

            {/* High-Contrast UMT Logo */}
            <div 
              onClick={onCancel}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', marginBottom: '2.5rem' }}
            >
              <div style={{ 
                width: '52px', 
                height: '52px', 
                borderRadius: '14px', 
                background: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
                transition: 'transform 0.2s ease'
              }}>
                <GraduationCap size={30} color="#0f2942" />
              </div>
              <div>
                <h2 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  UMT Portal
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  University of Management & Technology
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="font-heading" style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.2rem', color: '#ffffff', letterSpacing: '-0.03em' }}>
              Transforming Learners into Leaders of Tomorrow.
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.65, marginBottom: '2.5rem', fontWeight: 400 }}>
              Sign in with your official UMT student account to access university announcements, department discussions, and campus events.
            </p>

            {/* Frosted Glass Bullet Highlight Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                padding: '0.9rem 1.1rem',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.07)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                transition: 'transform 0.2s ease, background 0.2s ease'
              }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.25)', color: '#60a5fa', display: 'flex' }}>
                  <Bell size={18} />
                </div>
                <span style={{ fontSize: '0.92rem', fontWeight: 500, color: '#f8fafc' }}>Official UMT announcements & exam schedules</span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                padding: '0.9rem 1.1rem',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.07)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.25)', color: '#60a5fa', display: 'flex' }}>
                  <Users size={18} />
                </div>
                <span style={{ fontSize: '0.92rem', fontWeight: 500, color: '#f8fafc' }}>Connect across SST, HSM, and UMT schools</span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                padding: '0.9rem 1.1rem',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.07)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.25)', color: '#60a5fa', display: 'flex' }}>
                  <Bookmark size={18} />
                </div>
                <span style={{ fontSize: '0.92rem', fontWeight: 500, color: '#f8fafc' }}>Bookmark campus hackathons & society events</span>
              </div>
            </div>
          </div>

          {/* Footer Copyright */}
          <div style={{ 
            position: 'relative', 
            zIndex: 2, 
            paddingTop: '2rem', 
            marginTop: '2.5rem', 
            borderTop: '1px solid rgba(255, 255, 255, 0.12)', 
            fontSize: '0.82rem', 
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>UMT Student Portal &copy; 2026</span>
            <span style={{ color: '#64748b' }}>Lahore, Pakistan</span>
          </div>
        </div>

        {/* Right Form Card Section */}
        <div style={{ padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#ffffff' }}>
          
          {/* Top Action Bar: Browse Feed as Guest Pill Button */}
          <div style={{ marginBottom: '2.2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="button"
              onClick={onCancel} 
              style={{ 
                background: '#f1f5f9', 
                border: '1px solid #e2e8f0', 
                color: '#0f2942', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontSize: '0.85rem', 
                fontWeight: 700, 
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e2e8f0';
                e.currentTarget.style.color = '#1e3a8a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.color = '#0f2942';
              }}
            >
              <span>Browse Feed as Guest</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Page Title — fixed based on mode */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 className="font-heading" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f2942', marginBottom: '0.3rem' }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              {mode === 'login' ? 'Sign in to your UMT student account.' : 'Join the UMT student network today.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fca5a5', 
              color: '#991b1b', 
              padding: '0.85rem 1rem', 
              borderRadius: '12px', 
              marginBottom: '1.5rem', 
              fontSize: '0.88rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.65rem' 
            }}>
              <AlertCircle size={18} style={{ shrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
            
            {mode === 'signup' && (
              <div>
                <label className="input-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.86rem', marginBottom: '0.4rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Muhammad Ali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ 
                      paddingLeft: '2.8rem',
                      height: '46px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.94rem'
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="input-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.86rem', marginBottom: '0.4rem' }}>
                UMT Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="e.g. s2026@umt.edu.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ 
                    paddingLeft: '2.8rem',
                    height: '46px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.94rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label className="input-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.86rem', marginBottom: '0.4rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="input-field" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ 
                    paddingLeft: '2.8rem',
                    paddingRight: '2.8rem',
                    height: '46px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.94rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                height: '50px', 
                fontSize: '1rem', 
                marginTop: '0.6rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0f2942 0%, #1e40af 100%)',
                boxShadow: '0 8px 20px rgba(15, 41, 66, 0.25)',
                fontWeight: 700
              }} 
              disabled={loading}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn size={19} />
                  <span>Sign In to Portal</span>
                </>
              ) : (
                <>
                  <UserPlus size={19} />
                  <span>Create Account</span>
                </>
              )}
            </button>

          </form>

          {/* Switch page link */}
          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: '#64748b' }}>
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  style={{ background: 'none', border: 'none', color: '#1e40af', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', padding: 0, textDecoration: 'underline' }}
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: '#1e40af', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', padding: 0, textDecoration: 'underline' }}
                >
                  Sign In
                </button>
              </>
            )}
          </p>

        </div>

      </div>

      {/* Embedded CSS for responsive stacking under 850px */}
      <style>{`
        @media (max-width: 850px) {
          .auth-card-container {
            grid-template-columns: 1fr !important;
            max-width: 480px !important;
            border-radius: 20px !important;
          }
        }
      `}</style>

    </div>
  );
}

