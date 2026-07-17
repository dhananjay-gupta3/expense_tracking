import { useState } from 'react';
import useCountUp from '../hooks/useCountUp';
import './TotalExpense.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

const BUDGET_STORAGE_KEY = 'monthlyBudget';

const getStoredBudget = () => {
  const stored = Number(localStorage.getItem(BUDGET_STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : 0;
};

function AnimatedCurrency({ value }) {
  const animated = useCountUp(value);
  return <>{formatCurrency(animated)}</>;
}

function BudgetTracker({ spent }) {
  const [budget, setBudget] = useState(getStoredBudget);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const saveBudget = (e) => {
    e.preventDefault();
    const next = Number(draft);
    // An empty or zero value clears the budget
    if (Number.isFinite(next) && next >= 0) {
      setBudget(next);
      if (next > 0) {
        localStorage.setItem(BUDGET_STORAGE_KEY, String(next));
      } else {
        localStorage.removeItem(BUDGET_STORAGE_KEY);
      }
    }
    setEditing(false);
  };

  const removeBudget = () => {
    localStorage.removeItem(BUDGET_STORAGE_KEY);
    setBudget(0);
    setEditing(false);
  };

  const startEditing = () => {
    setDraft(budget > 0 ? String(budget) : '');
    setEditing(true);
  };

  if (editing) {
    return (
      <div className="budget-editor-wrap">
        <form className="budget-editor" onSubmit={saveBudget}>
          <input
            type="number"
            min="0"
            step="1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Monthly budget ₹"
            aria-label="Monthly budget amount"
            autoFocus
          />
          <button type="submit" className="budget-btn" aria-label="Save budget">
            ✓
          </button>
          <button
            type="button"
            className="budget-btn"
            onClick={() => setEditing(false)}
            aria-label="Cancel"
          >
            ✕
          </button>
        </form>
        {budget > 0 && (
          <button type="button" className="budget-remove-link" onClick={removeBudget}>
            Remove budget
          </button>
        )}
      </div>
    );
  }

  if (budget === 0) {
    return (
      <button type="button" className="budget-set-link" onClick={startEditing}>
        + Set monthly budget
      </button>
    );
  }

  const percent = (spent / budget) * 100;
  const over = spent > budget;

  return (
    <div className="budget-block">
      <div
        className="budget-bar"
        role="progressbar"
        aria-valuenow={Math.round(Math.min(percent, 100))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Monthly budget used"
      >
        <div
          className={`budget-bar-fill${over ? ' budget-bar-over' : ''}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <button
        type="button"
        className={`budget-meta${over ? ' budget-meta-over' : ''}`}
        onClick={startEditing}
        title="Edit budget"
      >
        {over
          ? `Over budget by ${formatCurrency(spent - budget)}`
          : `${Math.round(percent)}% of ${formatCurrency(budget)} budget`}
        <span className="budget-edit-hint">✎</span>
      </button>
    </div>
  );
}

function TotalExpense({ expenses }) {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const now = new Date();
  const thisMonth = expenses
    .filter((expense) => {
      const date = new Date(expense.date);
      return (
        date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const stats = [
    {
      label: 'Total Expenses',
      value: <AnimatedCurrency value={total} />,
      sub: `${expenses.length} ${expenses.length === 1 ? 'transaction' : 'transactions'}`,
      icon: '💰',
      highlight: true,
    },
    {
      label: 'This Month',
      value: <AnimatedCurrency value={thisMonth} />,
      sub: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      icon: '📅',
      extra: <BudgetTracker spent={thisMonth} />,
    },
    {
      label: 'Top Category',
      value: topCategory ? topCategory[0] : '—',
      sub: topCategory ? formatCurrency(topCategory[1]) : 'No expenses yet',
      icon: '🏆',
    },
    {
      label: 'Average Expense',
      value: (
        <AnimatedCurrency value={expenses.length ? total / expenses.length : 0} />
      ),
      sub: 'per transaction',
      icon: '📊',
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`stat-card${stat.highlight ? ' stat-card-highlight' : ''}`}
          style={{ '--stagger': index }}
        >
          <div className="stat-top">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-icon">{stat.icon}</span>
          </div>
          <span className="stat-value">{stat.value}</span>
          <span className="stat-sub">{stat.sub}</span>
          {stat.extra}
        </div>
      ))}
    </div>
  );
}

export default TotalExpense;
