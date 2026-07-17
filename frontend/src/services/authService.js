import api from './api';

// POST /api/auth/signup — creates an account, sends the OTP email
export const signup = async ({ name, email, password }) => {
  const response = await api.post('/auth/signup', { name, email, password });
  return response.data;
};

// POST /api/auth/verify-otp — activates the account, returns { token, user }
export const verifyOtp = async ({ email, otp }) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data.data;
};

// POST /api/auth/resend-otp
export const resendOtp = async (email) => {
  const response = await api.post('/auth/resend-otp', { email });
  return response.data;
};

// POST /api/auth/login — returns { token, user }
export const login = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
};

// POST /api/auth/google — sign in with a Google ID token, returns { token, user }
export const googleLogin = async (credential) => {
  const response = await api.post('/auth/google', { credential });
  return response.data.data;
};

// GET /api/auth/me — current profile
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};

// PUT /api/auth/me — update name / monthlyBudget / emailAlerts
export const updateMe = async (updates) => {
  const response = await api.put('/auth/me', updates);
  return response.data.data.user;
};
