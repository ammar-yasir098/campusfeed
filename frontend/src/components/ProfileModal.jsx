import React, { useState } from 'react';
import { X, Upload, User, AlertCircle } from 'lucide-react';
import { api, resolveImageUrl } from '../services/api';

export default function ProfileModal({ isOpen, onClose, currentUser, onProfileUpdated }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [studentId, setStudentId] = useState(currentUser?.studentId || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(resolveImageUrl(currentUser?.avatarUrl));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (name && !/^[a-zA-Z\s]+$/.test(name.trim())) {
      setError('Full name can only contain letters and spaces (no numbers or special characters)');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('studentId', studentId);
      formData.append('department', department);
      formData.append('bio', bio);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await api.updateProfile(formData);
      onProfileUpdated(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 className="font-heading" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f2942' }}>
            Edit UMT Student Profile
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Avatar Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '0.5rem' }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ca8a04' }} />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f2942', fontSize: '1.5rem', fontWeight: 800 }}>
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div>
              <label className="btn-secondary" style={{ cursor: 'pointer', fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
                <Upload size={15} />
                <span>Upload Profile Picture</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div>
            <label className="input-label">Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={name} 
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="input-label">UMT Student ID</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. F2026-099" 
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)} 
              />
            </div>
            <div>
              <label className="input-label">School / Department</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. SST / Computer Science" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label className="input-label">Student Bio</label>
            <textarea 
              className="input-field" 
              rows={3} 
              placeholder="Share your academic interests, societies, or bio..." 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
