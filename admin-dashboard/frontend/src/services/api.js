import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
};

export const transcriptsAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/transcripts?page=${page}&limit=${limit}`),
  getOne: (callId) => api.get(`/transcripts/${callId}`),
  create: (data) => api.post('/transcripts', data),
  delete: (callId) => api.delete(`/transcripts/${callId}`),
};

export const promptsAPI = {
  getAll: () => api.get('/prompts'),
  getActive: () => api.get('/prompts/active'),
  create: (data) => api.post('/prompts', data),
  update: (id, data) => api.put(`/prompts/${id}`, data),
  delete: (id) => api.delete(`/prompts/${id}`),
};

export const greetingsAPI = {
  getAll: () => api.get('/greetings'),
  getActive: () => api.get('/greetings/active'),
  create: (data) => api.post('/greetings', data),
  update: (id, data) => api.put(`/greetings/${id}`, data),
  delete: (id) => api.delete(`/greetings/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;

