import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { signup, login, googleLogin } from '../services/authService';
import './Auth.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const errorMessageOf = (err, fallback) =>
  err.response?.data?.message || err.message || fallback;

function GoogleButton({ onError }) {
  const { startSession } = useAuth();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;

    const handleCredential = async (response) => {
      try {
        startSession(await googleLogin(response.credential));
      } catch (err) {
        onError(errorMessageOf(err, 'Google sign-in failed'));
      }
    };

    const renderButton = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = renderButton;
    document.head.appendChild(script);
    return () => script.remove();
  }, [startSession, onError]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <div className="auth-divider">
        <span>or</span>
      </div>
      <div className="google-btn-slot" ref={buttonRef} />
    </>
  );
}

function Auth() {
  const { startSession } = useAuth();

  // 'login' | 'signup'
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Signup logs the user straight in — no verification step
      const session = mode === 'signup' ? await signup(form) : await login(form);
      startSession(session);
    } catch (err) {
      setError(errorMessageOf(err, 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">₹</div>
          <h1>Expense Tracker</h1>
          <p>Track spending, set budgets, get alerts — your data saved to your account.</p>
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'auth-tab-active' : ''}
            onClick={() => switchMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={mode === 'signup' ? 'auth-tab-active' : ''}
            onClick={() => switchMode('signup')}
          >
            Sign up
          </button>
          <span
            className="auth-tab-indicator"
            style={{ transform: `translateX(${mode === 'signup' ? '100%' : '0'})` }}
          />
        </div>

        <form key={mode} className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={6}
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? mode === 'signup'
                ? 'Creating account…'
                : 'Logging in…'
              : mode === 'signup'
                ? 'Create account & log in'
                : 'Log in'}
          </button>

          <GoogleButton onError={setError} />
        </form>
      </div>
    </div>
  );
}

export default Auth;
