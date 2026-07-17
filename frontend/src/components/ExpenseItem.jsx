import './ExpenseItem.css';

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

const isSameDay = (a, b) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const dateFromCalendarValue = (dateValue) => {
  const [year, month, day] = String(dateValue).slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getDateLabel = (dateValue) => {
  // Expense dates are calendar dates. Parse only the YYYY-MM-DD portion in
  // local time so UTC conversion cannot make tomorrow appear as today.
  const date = dateFromCalendarValue(dateValue);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

function ExpenseItem({ expense, onEdit, onDelete, index = 0 }) {
  const meta = CATEGORY_META[expense.category] || CATEGORY_META.Other;

  const formattedDate = getDateLabel(expense.date);

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(expense.amount);

  return (
    <li
      className="expense-item"
      style={{
        // Unique name lets the View Transitions API animate reorders/removal
        viewTransitionName: `expense-${expense._id}`,
        '--stagger': Math.min(index, 10),
      }}
    >
      <div className={`expense-icon ${meta.className}`}>{meta.icon}</div>

      <div className="expense-details">
        <span className="expense-description">{expense.description}</span>
        <span className="expense-meta">
          <span className={`category-badge ${meta.className}`}>{expense.category}</span>
          <span className="expense-date">{formattedDate}</span>
        </span>
      </div>

      <div className="expense-amount">{formattedAmount}</div>

      <div className="expense-actions">
        <button
          type="button"
          className="btn-icon btn-edit"
          onClick={() => onEdit(expense)}
          aria-label={`Edit ${expense.description}`}
          title="Edit"
        >
          ✏️
        </button>
        <button
          type="button"
          className="btn-icon btn-delete"
          onClick={() => onDelete(expense)}
          aria-label={`Delete ${expense.description}`}
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </li>
  );
}

export default ExpenseItem;
