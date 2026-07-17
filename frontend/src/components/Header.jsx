import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import './Header.css';

const getInitialTheme = () => {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'light';
};

function Header({ onOpenProfile }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Close the user menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointer = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-brand">
          <div className="app-logo">₹</div>
          <div className="app-brand-text">
            <span className="app-title">Expense Tracker</span>
            <span className="app-subtitle">Personal finance, simplified</span>
          </div>
        </div>

        <div className="app-header-actions">
          <span className="app-date">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            <span key={theme} className="theme-toggle-icon">
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
          </button>

          {user && (
            <div className="user-menu" ref={menuRef}>
              <button
                type="button"
                className="user-menu-btn"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
              >
                {user.avatar ? (
                  <img
                    className="user-avatar"
                    src={user.avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="user-avatar user-avatar-initial">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {menuOpen && (
                <div className="user-dropdown" role="menu">
                  <div className="user-dropdown-header">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenProfile?.();
                    }}
                  >
                    👤 Profile & settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="user-dropdown-danger"
                    onClick={logout}
                  >
                    ↪ Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
