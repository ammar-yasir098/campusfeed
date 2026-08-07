import React, { useState } from 'react';
import { X, Upload, AlertCircle, BarChart2, Plus, Trash2, Video, Film } from 'lucide-react';
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
  const [imageFiles, setImageFiles] = useState([]); // Array of up to 5 File objects
  const [previewUrls, setPreviewUrls] = useState([]); // Array of Object URLs
  
  // Video attachment state
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [thumbnailBlob, setThumbnailBlob] = useState(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(null);

  // Poll state
  const [isPollEnabled, setIsPollEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const generateVideoThumbnail = (file) => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        video.src = url;
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          video.currentTime = Math.min(0.2, video.duration || 0.2);
        };

        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              resolve(blob);
            },
            'image/jpeg',
            0.85
          );
        };

        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
      } catch (e) {
        resolve(null);
      }
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalAllowed = 5 - imageFiles.length;
    if (totalAllowed <= 0) {
      setError('Maximum 5 photos allowed per post.');
      return;
    }

    const selected = files.slice(0, totalAllowed);
    const newFiles = [...imageFiles, ...selected];
    const newPreviews = [...previewUrls, ...selected.map(f => URL.createObjectURL(f))];
    setImageFiles(newFiles);
    setPreviewUrls(newPreviews);

    // Clear video attachment if photos are attached
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setThumbnailBlob(null);
    setThumbnailPreviewUrl(null);
    setError('');
  };

  const handleRemoveSingleImage = (index) => {
    const newFiles = imageFiles.filter((_, idx) => idx !== index);
    const newPreviews = previewUrls.filter((_, idx) => idx !== index);
    setImageFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Video file size must be under 50MB.');
        return;
      }
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setImageFiles([]);
      setPreviewUrls([]);
      setError('');

      // Generate 5th frame (~0.2s) static thumbnail image blob
      const thumbBlob = await generateVideoThumbnail(file);
      if (thumbBlob) {
        setThumbnailBlob(thumbBlob);
        setThumbnailPreviewUrl(URL.createObjectURL(thumbBlob));
      }
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setThumbnailBlob(null);
    setThumbnailPreviewUrl(null);
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
    } else if (!content.trim() && imageFiles.length === 0 && !videoFile) {
      setError('Post content or media attachment is required when creating an announcement.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let finalImageUrls = [];
      let finalVideoUrl = null;
      let finalThumbnailUrl = null;

      // If user selected image files, upload them
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach(file => {
          formData.append('images', file);
        });
        const uploadRes = await api.uploadMultipleImages(formData);
        finalImageUrls = uploadRes.imageUrls || [];
      }

      // If user selected a video file, upload it alongside generated thumbnail
      if (videoFile) {
        const formData = new FormData();
        formData.append('video', videoFile);
        if (thumbnailBlob) {
          formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
        }
        const uploadRes = await api.uploadVideo(formData);
        finalVideoUrl = uploadRes.videoUrl;
        finalThumbnailUrl = uploadRes.thumbnailUrl;
      }

      // Create the post
      const newPostData = {
        title,
        content: content.trim() || null,
        category,
        imageUrls: finalImageUrls,
        imageUrl: finalImageUrls.length > 0 ? finalImageUrls[0] : null,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        poll: pollPayload
      };

      const res = await api.createPost(newPostData);
      onPostCreated(res.post);
      onClose();
      
      // Reset form
      setTitle('');
      setContent('');
      setCategory('General');
      setImageFiles([]);
      setPreviewUrls([]);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      setThumbnailBlob(null);
      setThumbnailPreviewUrl(null);
      setIsPollEnabled(false);
      setPollOptions(['', '']);
    } catch (err) {
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem', maxWidth: '580px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Create Campus Post</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: '#fef2f2', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Category Selector */}
          <div>
            <label className="input-label">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
              style={{ width: '100%' }}
            >
              <option value="General">General</option>
              <option value="Announcements">Announcements</option>
              <option value="Events">Events</option>
              <option value="Lost & Found">Lost & Found</option>
              <option value="Buy & Sell">Buy & Sell</option>
            </select>
          </div>

          {/* Post Title */}
          <div>
            <label className="input-label">Title / Heading *</label>
            <input 
              type="text" 
              placeholder="e.g. Midterm Schedule Announcement" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              style={{ width: '100%' }}
              required
            />
          </div>

          {/* Post Content */}
          <div>
            <label className="input-label">Content Details</label>
            <textarea 
              placeholder="Share what's happening on campus..." 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              className="input-field"
              rows={4}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Optional Poll Section */}
          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem', color: '#0f2942' }}>
                <BarChart2 size={18} color="#2563eb" />
                <span>Add Interactive Poll</span>
              </div>
              <input 
                type="checkbox" 
                checked={isPollEnabled} 
                onChange={(e) => setIsPollEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
              />
            </div>

            {isPollEnabled && (
              <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                  Poll Options (2 to 6 options)
                </span>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      className="input-field"
                      style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                    />
                    {pollOptions.length > 2 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemovePollOption(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
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
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: '0.3rem',
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={15} /> Add Another Option
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Media Upload (Photos up to 5 or Video) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="input-label" style={{ margin: 0 }}>Attach Media (Optional)</label>
              {previewUrls.length > 0 && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>
                  {previewUrls.length} / 5 Photos
                </span>
              )}
            </div>
            
            {previewUrls.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.65rem' }}>
                {previewUrls.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', height: '90px', borderRadius: '0px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <img src={url} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '0px' }} />
                    <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(15, 23, 42, 0.75)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>
                      {idx + 1}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSingleImage(idx)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', padding: '0.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Remove Photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {previewUrls.length < 5 && (
                  <label style={{ height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #3b82f6', borderRadius: '0px', background: '#eff6ff', cursor: 'pointer', gap: '0.2rem', color: '#2563eb' }}>
                    <Plus size={20} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Add Photo</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            ) : videoPreviewUrl ? (
              <div style={{ position: 'relative', borderRadius: '0px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#0f172a' }}>
                <video src={videoPreviewUrl} controls style={{ width: '100%', maxHeight: '220px', display: 'block', borderRadius: '0px' }} />
                <button 
                  type="button" 
                  onClick={handleRemoveVideo}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(15, 23, 42, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', padding: '0.35rem', cursor: 'pointer', zIndex: 10 }}
                  title="Remove Video"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', border: '1px dashed #cbd5e1', borderRadius: 'var(--radius-md)', background: '#f8fafc', cursor: 'pointer', gap: '0.35rem', transition: 'all 0.2s ease' }}>
                  <Upload size={20} color="#2563eb" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Attach Photos (Up to 5)</span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>JPG, PNG, WEBP up to 5MB</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', border: '1px dashed #cbd5e1', borderRadius: 'var(--radius-md)', background: '#f8fafc', cursor: 'pointer', gap: '0.35rem', transition: 'all 0.2s ease' }}>
                  <Video size={20} color="#2563eb" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Attach Video</span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>MP4, WEBM, MOV up to 50MB</span>
                  <input type="file" accept="video/mp4,video/webm,video/quicktime,video/mkv,video/avi" onChange={handleVideoChange} style={{ display: 'none' }} />
                </label>
              </div>
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
