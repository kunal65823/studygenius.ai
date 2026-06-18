import axios from 'axios';
import { supabase } from './supabase';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
});

// Attach Supabase token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Something went wrong';
    if (err.response?.status === 401) {
      supabase.auth.signOut();
      window.location.href = '/login';
    } else if (err.response?.status === 429) {
      toast.error('Too many requests – please wait a moment.');
    } else if (err.response?.status >= 500) {
      toast.error('Server error. Please try again.');
    }
    return Promise.reject(new Error(msg));
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  getProfile   : ()      => api.get('/auth/profile'),
  updateProfile: (data)  => api.patch('/auth/profile', data),
};

// ── Notes ─────────────────────────────────────────────────────
export const notesAPI = {
  list  : (params)    => api.get('/notes', { params }),
  get   : (id)        => api.get(`/notes/${id}`),
  upload: (formData)  => api.post('/notes', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  rename: (id, title) => api.patch(`/notes/${id}`, { title }),
  delete: (id)        => api.delete(`/notes/${id}`),
};

// ── Summaries ─────────────────────────────────────────────────
export const summaryAPI = {
  create      : (data)         => api.post('/summary', data),
  listForNote : (noteId)       => api.get(`/summary/note/${noteId}`),
  getInsights : (noteId)       => api.get(`/summary/insights/${noteId}`),
  getELI5     : (noteId, topic) => api.get(`/summary/eli5/${noteId}`, { params: { topic } }),
  delete      : (id)           => api.delete(`/summary/${id}`),
};

// ── Flashcards ────────────────────────────────────────────────
export const flashcardsAPI = {
  createSet   : (data)              => api.post('/flashcards', data),
  listSets    : ()                  => api.get('/flashcards'),
  getSet      : (id)                => api.get(`/flashcards/${id}`),
  updateStatus: (id, cardId, status) => api.patch(`/flashcards/${id}/cards/${cardId}`, { status }),
  deleteSet   : (id)                => api.delete(`/flashcards/${id}`),
};

// ── MCQs ──────────────────────────────────────────────────────
export const mcqAPI = {
  createSet : (data) => api.post('/mcq', data),
  listSets  : ()     => api.get('/mcq'),
  getSet    : (id)   => api.get(`/mcq/${id}`),
  deleteSet : (id)   => api.delete(`/mcq/${id}`),
};

// ── Quiz ──────────────────────────────────────────────────────
export const quizAPI = {
  submit  : (data) => api.post('/quiz/submit', data),
  history : ()     => api.get('/quiz/history'),
};

// ── Chat ──────────────────────────────────────────────────────
export const chatAPI = {
  createSession : (data) => api.post('/chat/sessions', data),
  listSessions  : ()     => api.get('/chat/sessions'),
  getSession    : (id)   => api.get(`/chat/sessions/${id}`),
  deleteSession : (id)   => api.delete(`/chat/sessions/${id}`),
  sendMessage   : (data) => api.post('/chat/message', data),
};

// ── Analytics ─────────────────────────────────────────────────
export const analyticsAPI = {
  dashboard  : ()     => api.get('/analytics/dashboard'),
  logSession : (data) => api.post('/analytics/session', data),
};

// ── Bookmarks ─────────────────────────────────────────────────
export const bookmarksAPI = {
  list  : ()                  => api.get('/bookmarks'),
  add   : (itemType, itemId)  => api.post('/bookmarks', { itemType, itemId }),
  remove: (id)                => api.delete(`/bookmarks/${id}`),
};

// ── Goals ─────────────────────────────────────────────────────
export const goalsAPI = {
  list  : ()          => api.get('/goals'),
  create: (data)      => api.post('/goals', data),
  update: (id, data)  => api.patch(`/goals/${id}`, data),
  delete: (id)        => api.delete(`/goals/${id}`),
};

// ── Search ────────────────────────────────────────────────────
export const searchAPI = {
  search: (q) => api.get('/search', { params: { q } }),
};

export default api;