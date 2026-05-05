import axios from 'axios';
import { useAuthStore } from '../store/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://localhost:8000';

// API Instance for Go Backend Main Services
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Instance for Python AI Services
export const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Browser handles HttpOnly cookies automatically when withCredentials is true

// Response Interceptor for Universal 401 Logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (error.config && !error.config.url?.includes('/auth/login')) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
