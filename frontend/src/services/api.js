const API_BASE_URL = 'http://localhost:5000';

// Token Management Helpers
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

// Utility to resolve image URLs (handles relative "uploads/filename" vs full URLs)
export const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
};

// Generic fetch wrapper
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  // Don't set Content-Type if sending FormData (let browser set boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'An unexpected error occurred');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication APIs
  signup: (userData) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/api/auth/me'),

  // Feed Posts APIs with limit & offset pagination support
  getPosts: (category, limit, offset) => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (limit !== undefined) params.append('limit', limit);
    if (offset !== undefined) params.append('offset', offset);
    const queryString = params.toString();
    return request(`/api/posts${queryString ? `?${queryString}` : ''}`);
  },
  getPostById: (id) => request(`/api/posts/${id}`),
  createPost: (postData) => {
    if (postData instanceof FormData) {
      return request('/api/posts', { method: 'POST', body: postData });
    }
    return request('/api/posts', { method: 'POST', body: JSON.stringify(postData) });
  },
  deletePost: (id) => request(`/api/posts/${id}`, { method: 'DELETE' }),

  // Likes & Comments APIs
  toggleLike: (postId) => request(`/api/posts/${postId}/like`, { method: 'POST' }),
  addComment: (postId, text) => request(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
  getComments: (postId) => request(`/api/posts/${postId}/comments`),

  // Polls API
  votePoll: (postId, optionId) => request(`/api/posts/${postId}/poll/vote`, { method: 'POST', body: JSON.stringify({ optionId }) }),

  // Bookmarks APIs
  toggleBookmark: (postId) => request(`/api/posts/${postId}/bookmark`, { method: 'POST' }),
  getBookmarks: () => request('/api/users/bookmarks'),

  // User Profile APIs
  getProfile: () => request('/api/users/profile'),
  updateProfile: (profileData) => {
    if (profileData instanceof FormData) {
      return request('/api/users/profile', { method: 'PUT', body: profileData });
    }
    return request('/api/users/profile', { method: 'PUT', body: JSON.stringify(profileData) });
  },
  getUserById: (id) => request(`/api/users/${id}`),

  // File Upload API
  uploadImage: (formData) => request('/api/upload', { method: 'POST', body: formData })
};
