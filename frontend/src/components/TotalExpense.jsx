import './TotalExpense.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

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
      value: formatCurrency(total),
      sub: `${expenses.length} ${expenses.length === 1 ? 'transaction' : 'transactions'}`,
      icon: '💰',
      highlight: true,
    },
    {
      label: 'This Month',
      value: formatCurrency(thisMonth),
      sub: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      icon: '📅',
    },
    {
      label: 'Top Category',
      value: topCategory ? topCategory[0] : '—',
      sub: topCategory ? formatCurrency(topCategory[1]) : 'No expenses yet',
      icon: '🏆',
    },
    {
      label: 'Average Expense',
      value: expenses.length ? formatCurrency(total / expenses.length) : formatCurrency(0),
      sub: 'per transaction',
      icon: '📊',
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`stat-card${stat.highlight ? ' stat-card-highlight' : ''}`}
        >
          <div className="stat-top">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-icon">{stat.icon}</span>
          </div>
          <span className="stat-value">{stat.value}</span>
          <span className="stat-sub">{stat.sub}</span>
        </div>
      ))}
    </div>
  );
}

export default TotalExpense;
