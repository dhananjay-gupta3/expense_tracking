import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { updateMe } from '../services/authService';
import { getExpenses } from '../services/expenseService';
import useCountUp from '../hooks/useCountUp';
import Toast from '../components/Toast.jsx';
import './Profile.css';

const CATEGORY_META = {
  Food: { icon: '🍔', className: 'cat-food' },
  Travel: { icon: '✈️', className: 'cat-travel' },
  Shopping: { icon: '🛍️', className: 'cat-shopping' },
  Bills: { icon: '🧾', className: 'cat-bills' },
  Entertainment: { icon: '🎬', className: 'cat-entertainment' },
  Health: { icon: '🏥', className: 'cat-health' },
  Education: { icon: '📚', className: 'cat-education' },
  Other: { icon: '📌', className: 'cat-other' },
};

const formatCurrency = (value, decimals = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
  }).format(value);

function AnimatedCurrency({ value }) {
  const animated = useCountUp(value);
  return <>{formatCurrency(animated)}</>;
}

function AnimatedNumber({ value }) {
  const animated = useCountUp(value);
  return <>{Math.round(animated)}</>;
}

function ProfileStats({ expenses, budget }) {
  const stats = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let total = 0;
    let thisMonth = 0;
    let biggest = null;
    const byCategory = new Map();

    for (const expense of expenses) {
      total += expense.amount;
      if (String(expense.date).slice(0, 7) === monthKey) thisMonth += expense.amount;
      if (!biggest || expense.amount > biggest.amount) biggest = expense;
      byCategory.set(
        expense.category,
        (byCategory.get(expense.category) || 0) + expense.amount
      );
    }

    const topCategories = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: total ? (amount / total) * 100 : 0,
      }));

    return { total, thisMonth, biggest, count: expenses.length, topCategories };
  }, [expenses]);

  const budgetPercent = budget > 0 ? (stats.thisMonth / budget) * 100 : 0;
  const overBudget = budget > 0 && stats.thisMonth > budget;

  return (
    <>
      <div className="profile-stats-grid">
        <div className="profile-stat" style={{ '--stagger': 0 }}>
          <span className="profile-stat-label">💰 Total spent</span>
          <span className="profile-stat-value">
            <AnimatedCurrency value={stats.total} />
          </span>
        </div>
        <div className="profile-stat" style={{ '--stagger': 1 }}>
          <span className="profile-stat-label">🧾 Transactions</span>
          <span className="profile-stat-value">
            <AnimatedNumber value={stats.count} />
          </span>
        </div>
        <div className="profile-stat" style={{ '--stagger': 2 }}>
          <span className="profile-stat-label">📅 This month</span>
          <span className="profile-stat-value">
            <AnimatedCurrency value={stats.thisMonth} />
          </span>
        </div>
        <div className="profile-stat" style={{ '--stagger': 3 }}>
          <span className="profile-stat-label">🔝 Biggest expense</span>
          <span className="profile-stat-value">
            <AnimatedCurrency value={stats.biggest ? stats.biggest.amount : 0} />
          </span>
          {stats.biggest && (
            <span className="profile-stat-sub" title={stats.biggest.description}>
              {stats.biggest.description}
            </span>
          )}
        </div>
      </div>

      {budget > 0 && (
        <div className="profile-budget-usage">
          <div className="profile-budget-usage-top">
            <span>This month's budget</span>
            <span className={overBudget ? 'profile-budget-over' : ''}>
              {formatCurrency(stats.thisMonth)} / {formatCurrency(budget)}
              {' · '}
              {Math.round(budgetPercent)}%
            </span>
          </div>
          <div className="profile-budget-bar">
            <div
              className={`profile-budget-fill${overBudget ? ' profile-budget-fill-over' : ''}`}
              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {stats.topCategories.length > 0 && (
        <div className="profile-categories">
          <h3>Where your money goes</h3>
          {stats.topCategories.map((row, index) => {
            const meta = CATEGORY_META[row.category] || CATEGORY_META.Other;
            return (
              <div className="profile-category-row" key={row.category} style={{ '--stagger': index }}>
                <span className={`profile-category-icon ${meta.className}`}>{meta.icon}</span>
                <div className="profile-category-info">
                  <div className="profile-category-top">
                    <span className="profile-category-name">{row.category}</span>
                    <span className="profile-category-amount">
                      {formatCurrency(row.amount)}
                      <em>{Math.round(row.percent)}%</em>
                    </span>
                  </div>
                  <div className="profile-category-track">
                    <div
                      className={`profile-category-fill ${meta.className}`}
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Profile({ onBack }) {
  const { user, setUser, logout } = useAuth();

  const [name, setName] = useState(user.name);
  const [budget, setBudget] = useState(user.monthlyBudget > 0 ? String(user.monthlyBudget) : '');
  const [emailAlerts, setEmailAlerts] = useState(user.emailAlerts);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [expenses, setExpenses] = useState(null); // null = loading

  useEffect(() => {
    getExpenses()
      .then(setExpenses)
      .catch(() => setExpenses([]));
  }, []);

  const memberSince = new Date(user.createdAt);
  const memberDays = Math.max(
    1,
    Math.ceil((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))
  );

  const dirty =
    name.trim() !== user.name ||
    Number(budget || 0) !== user.monthlyBudget ||
    emailAlerts !== user.emailAlerts;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ message: 'Name cannot be empty', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const updated = await updateMe({
        name: name.trim(),
        monthlyBudget: Number(budget || 0),
        emailAlerts,
      });
      setUser(updated);
      setToast({ message: 'Profile saved', type: 'success' });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to save profile',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="container profile-container">
        <button type="button" className="profile-back" onClick={onBack}>
          ← Back to expenses
        </button>

        <div className="profile-card">
          <div className="profile-identity">
            {user.avatar ? (
              <img
                className="profile-avatar"
                src={user.avatar}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="profile-avatar profile-avatar-initial">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="profile-identity-text">
              <h1>{user.name}</h1>
              <p className="profile-email">{user.email}</p>
              <div className="profile-badges">
                <span className="profile-badge profile-badge-success">✓ Verified</span>
                {user.googleLinked && (
                  <span className="profile-badge">🔗 Google linked</span>
                )}
                {user.hasPassword && (
                  <span className="profile-badge">🔒 Password set</span>
                )}
                <span className="profile-badge">
                  🗓{' '}
                  {memberDays < 2
                    ? 'Joined today'
                    : `Member for ${memberDays} days`}
                </span>
              </div>
            </div>
          </div>

          {expenses === null ? (
            <div className="profile-stats-loading">
              <div className="app-splash-spinner" />
            </div>
          ) : (
            <ProfileStats expenses={expenses} budget={user.monthlyBudget} />
          )}
        </div>

        <div className="profile-card">
          <h2 className="profile-section-title">⚙️ Account settings</h2>

          <form className="profile-form" onSubmit={handleSave}>
            <div className="profile-field">
              <label htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-budget">Monthly budget (₹)</label>
              <input
                id="profile-budget"
                type="number"
                min="0"
                step="1"
                placeholder="No budget set"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <span className="profile-hint">
                {Number(budget) > 0
                  ? `You'll be warned by email at 80% and 100% of ${formatCurrency(Number(budget))}`
                  : 'Set a budget to enable spending warnings'}
              </span>
            </div>

            <label className="profile-toggle">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
              />
              <span className="profile-toggle-track" aria-hidden="true">
                <span className="profile-toggle-thumb" />
              </span>
              <span className="profile-toggle-text">
                <strong>Budget warning emails</strong>
                Email me when my monthly spending nears or exceeds my budget
              </span>
            </label>

            <div className="profile-actions">
              <button type="submit" className="profile-save" disabled={saving || !dirty}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="profile-logout" onClick={logout}>
                Log out
              </button>
            </div>
          </form>
        </div>
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default Profile;
