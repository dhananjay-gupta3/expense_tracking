import axios from 'axios';

// In production (e.g. Render), set VITE_API_URL to your deployed backend URL,
// e.g. https://your-backend.onrender.com/api — falls back to localhost for dev.
const baseURL = import.meta.env.VITE_API_URL || 'https://expense-tracking-2sex.onrender.com';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
