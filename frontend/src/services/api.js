import axios from 'axios';

// Priority: VITE_API_URL env var → localhost in dev → deployed backend in production.
// NOTE: the backend mounts all routes under /api, so the URL must end with /api.
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://expense-tracking-2sex.onrender.com/api');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
