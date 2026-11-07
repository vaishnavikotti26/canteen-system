import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// If the token expired, clear the session and go to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config && err.config.url && err.config.url.startsWith('/auth/login');
    if (err.response && err.response.status === 401 && localStorage.getItem('token') && !isAuthCall) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) =>
  (e.response && e.response.data && e.response.data.message) ||
  (e.request ? 'Cannot reach the server. Is the backend running?' : e.message);

export default api;
