import React, { useState } from 'react';
import { X, Upload, AlertCircle, BarChart2, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const CATEGORY_OPTIONS = [
  'General',
  'Announcements',
  'Events',
  'Lost & Found',
  'Buy & Sell'
];

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Poll state
  const [isPollEnabled, setIsPollEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, idx) => idx !== index));
    }
  };

  const handleOptionTextChange = (index, text) => {
    const updated = [...pollOptions];
    updated[index] = text;
    setPollOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a post title or question.');
      return;
    }

    let pollPayload = null;
    if (isPollEnabled) {
      const validOptions = pollOptions.map(o => o.trim()).filter(o => o.length > 0);
      if (validOptions.length < 2) {
        setError('A poll must contain at least 2 valid options.');
        return;
      }
      pollPayload = { options: validOptions };
    } else if (!content.trim()) {
      setError('Post content is required when creating a standard announcement.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let finalImageUrl = null;

      // If user selected an image file, upload it first
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await api.uploadImage(formData);
        finalImageUrl = uploadRes.imageUrl;
      }

      // Create the post
      const newPostData = {
        title,
        content: content.trim() || null,
        category,
        imageUrl: finalImageUrl,
        poll: pollPayload
      };

      const res = await api.createPost(newPostData);
      onPostCreated(res.post);
      onClose();
      
      // Reset form
      setTitle('');
      setContent('');
      setCategory('General');
      setImageFile(null);
      setPreviewUrl(null);
      setIsPollEnabled(false);
      setPollOptions(['', '']);
    } catch (err) {
      setError(err.message || 'Unable to publish post at this time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem', maxWidth: '580px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 className="font-heading" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            Create Campus Announcement or Poll
          </h2>
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
          
          {/* Category Dropdown */}
          <div>
            <label className="input-label">Category</label>
            <select 
              className="input-field" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat} style={{ background: '#111827', color: '#fff' }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Title Input */}
          <div>
            <label className="input-label">Title / Question</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g., Should the Library remain open 24/7 during Exam Week?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Content Input */}
          <div>
            <label className="input-label">
              Post Body / Context {isPollEnabled && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional with Poll)</span>}
            </label>
            <textarea 
              className="input-field" 
              rows={3}
              placeholder={isPollEnabled ? "Provide background details or discussion points (Optional)..." : "Provide background details or discussion points..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required={!isPollEnabled}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Poll Options Builder Toggle */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="input-label" style={{ marginBottom: 0 }}>Interactive Student Poll</span>
              <button 
                type="button"
                onClick={() => setIsPollEnabled(!isPollEnabled)}
                style={{
                  background: isPollEnabled ? 'var(--primary-gradient)' : '#f3f4f6',
                  color: isPollEnabled ? '#ffffff' : '#374151',
                  border: isPollEnabled ? 'none' : '1px solid #d1d5db',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <BarChart2 size={15} />
                <span>{isPollEnabled ? 'Poll Enabled' : '+ Add Poll Options'}</span>
              </button>
            </div>

            {/* Render Poll Option Inputs */}
            {isPollEnabled && (
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                  Enter 2 to 6 choices for students to vote on:
                </p>

                {pollOptions.map((optText, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder={`Option ${index + 1}`}
                      value={optText}
                      onChange={(e) => handleOptionTextChange(index, e.target.value)}
                      style={{ fontSize: '0.88rem', padding: '0.5rem 0.8rem', background: '#ffffff', color: '#1e293b' }}
                      required={isPollEnabled && index < 2}
                    />
                    {pollOptions.length > 2 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemovePollOption(index)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.35rem' }}
                        title="Remove Option"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}

                {pollOptions.length < 6 && (
                  <button 
                    type="button" 
                    onClick={handleAddPollOption}
                    style={{ background: 'transparent', border: '1px dashed #cbd5e1', color: 'var(--primary)', padding: '0.45rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '0.25rem' }}
                  >
                    <Plus size={15} />
                    <span>Add Another Choice</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Image Upload Dropzone */}
          <div>
            <label className="input-label">Attach Photo (Optional)</label>
            {previewUrl ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} />
                <button 
                  type="button" 
                  onClick={handleRemoveImage}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0, 0, 0, 0.7)', color: '#fff', border: 'none', borderRadius: '50%', padding: '0.35rem', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.2rem', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', cursor: 'pointer', gap: '0.4rem', transition: 'all 0.2s ease' }}>
                <Upload size={22} color="var(--primary)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click to upload an event poster or photo</span>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
