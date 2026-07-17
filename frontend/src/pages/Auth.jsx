import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { signup, verifyOtp, resendOtp, login, googleLogin } from '../services/authService';
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

  // 'login' | 'signup' | 'otp'
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setNotice('');
  };

  const enterOtpMode = (email, message) => {
    setPendingEmail(email);
    setOtp('');
    setMode('otp');
    setNotice(message);
    setResendIn(60);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        await signup(form);
        enterOtpMode(form.email.trim(), `We sent a 6-digit code to ${form.email.trim()}`);
      } else if (mode === 'login') {
        startSession(await login(form));
      } else if (mode === 'otp') {
        startSession(await verifyOtp({ email: pendingEmail, otp: otp.trim() }));
      }
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        enterOtpMode(
          err.response.data.data?.email || form.email.trim(),
          'Your email is not verified yet. We sent you a new code.'
        );
      } else {
        setError(errorMessageOf(err, 'Something went wrong. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError('');
    try {
      await resendOtp(pendingEmail);
      setNotice(`A new code is on its way to ${pendingEmail}`);
      setResendIn(60);
    } catch (err) {
      setError(errorMessageOf(err, 'Could not resend the code.'));
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

        {mode !== 'otp' && (
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
        )}

        {mode === 'otp' ? (
          <form key="otp" className="auth-form" onSubmit={handleSubmit}>
            <button
              type="button"
              className="auth-back"
              onClick={() => switchMode('login')}
            >
              ← Back to login
            </button>

            <h2 className="otp-title">Check your email</h2>
            {notice && <p className="auth-notice">{notice}</p>}

            <div className="auth-field">
              <label htmlFor="otp">6-digit verification code</label>
              <input
                id="otp"
                className="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                autoFocus
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="auth-submit"
              disabled={submitting || otp.length !== 6}
            >
              {submitting ? 'Verifying…' : 'Verify email'}
            </button>

            <button
              type="button"
              className="auth-resend"
              onClick={handleResend}
              disabled={resendIn > 0}
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Didn't get it? Resend code"}
            </button>
          </form>
        ) : (
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
            {notice && <p className="auth-notice">{notice}</p>}

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting
                ? mode === 'signup'
                  ? 'Creating account…'
                  : 'Logging in…'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Log in'}
            </button>

            <GoogleButton onError={setError} />
          </form>
        )}
      </div>
    </div>
  );
}

export default Auth;
