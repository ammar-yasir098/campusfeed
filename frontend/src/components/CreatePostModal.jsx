import React, { useState } from 'react';
import { X, Image, Upload, AlertCircle } from 'lucide-react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and Content are required');
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
        content,
        category,
        imageUrl: finalImageUrl
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
    } catch (err) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 className="font-heading" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            Create Campus Announcement or Post
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
            <label className="input-label">Title</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g., Hackathon 2026 Registration Open!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Content Input */}
          <div>
            <label className="input-label">Post Body / Details</label>
            <textarea 
              className="input-field" 
              rows={4}
              placeholder="Write your announcement or discussion details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Image Upload Dropzone */}
          <div>
            <label className="input-label">Attach Photo (Optional)</label>
            {previewUrl ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
                <button 
                  type="button" 
                  onClick={handleRemoveImage}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0, 0, 0, 0.7)', color: '#fff', border: 'none', borderRadius: '50%', padding: '0.35rem', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', cursor: 'pointer', gap: '0.5rem', transition: 'all 0.2s ease' }}>
                <Upload size={24} color="var(--primary)" />
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Click to upload an event poster or photo</span>
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
