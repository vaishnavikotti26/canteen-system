
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://canteen-system-2026-q69a51njs-fsd-f97f.vercel.app/api'
});

// Add authentication token to requests
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');

  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }

  return cfg;
});

// Handle expired login sessions
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall =
      err.config &&
      err.config.url &&
      err.config.url.startsWith('/auth/login');

    if (
      err.response &&
      err.response.status === 401 &&
      localStorage.getItem('token') &&
      !isAuthCall
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export const errMsg = (e) =>
  (e.response && e.response.data && e.response.data.message) ||
  (e.request
    ? 'Cannot reach the server. Is the backend running?'
    : e.message);

export default api;
