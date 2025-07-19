import axios from 'axios';

// Create axios instance with base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7451';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put('/api/auth/profile', userData);
    return response.data;
  },
};

// Journal API calls
export const journalAPI = {
  // Get all journal entries for current user
  getEntries: async () => {
    const response = await api.get('/api/journal/entries');
    return response.data;
  },

  // Get single journal entry
  getEntry: async (entryId) => {
    const response = await api.get(`/api/journal/entries/${entryId}`);
    return response.data;
  },

  // Create new journal entry
  createEntry: async (entryData) => {
    const response = await api.post('/api/journal/entries', entryData);
    return response.data;
  },

  // Update journal entry
  updateEntry: async (entryId, entryData) => {
    const response = await api.put(`/api/journal/entries/${entryId}`, entryData);
    return response.data;
  },

  // Delete journal entry
  deleteEntry: async (entryId) => {
    const response = await api.delete(`/api/journal/entries/${entryId}`);
    return response.data;
  },

  // Get AI insights for entry
  getAIInsights: async (entryId) => {
    const response = await api.get(`/api/journal/entries/${entryId}/insights`);
    return response.data;
  },
};

// Community API calls
export const communityAPI = {
  // Get all community posts
  getPosts: async (page = 1, limit = 10) => {
    const response = await api.get(`/api/community?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get single community post
  getPost: async (postId) => {
    const response = await api.get(`/api/community/${postId}`);
    return response.data;
  },

  // Create new community post
  createPost: async (postData) => {
    const response = await api.post('/api/community', postData);
    return response.data;
  },

  // Update community post
  updatePost: async (postId, postData) => {
    const response = await api.put(`/api/community/${postId}`, postData);
    return response.data;
  },

  // Delete community post
  deletePost: async (postId) => {
    const response = await api.delete(`/api/community/${postId}`);
    return response.data;
  },

  // Like/unlike post
  toggleLike: async (postId) => {
    const response = await api.post(`/api/community/${postId}/like`);
    return response.data;
  },

  // Add comment to post
  addComment: async (postId, commentData) => {
    const response = await api.post(`/api/community/${postId}/comments`, commentData);
    return response.data;
  },
};

// Therapists API calls
export const therapistsAPI = {
  // Get all therapists
  getTherapists: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/api/therapists?${params}`);
    return response.data;
  },

  // Get single therapist
  getTherapist: async (therapistId) => {
    const response = await api.get(`/api/therapists/${therapistId}`);
    return response.data;
  },

  // Search therapists
  searchTherapists: async (query, filters = {}) => {
    const params = new URLSearchParams({ ...filters, q: query });
    const response = await api.get(`/api/therapists/search?${params}`);
    return response.data;
  },

  // Contact therapist
  contactTherapist: async (therapistId, contactData) => {
    const response = await api.post(`/api/therapists/${therapistId}/contact`, contactData);
    return response.data;
  },
};

// Profile API calls
export const profileAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/api/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/profile', profileData);
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    const response = await api.put('/api/profile/preferences', preferences);
    return response.data;
  },

  // Get user statistics
  getStats: async () => {
    const response = await api.get('/api/profile/stats');
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Backend is not available');
  }
};

export default api; 