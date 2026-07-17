import { useEffect, useState } from 'react';
import ExpenseItem from './ExpenseItem.jsx';
import ExpenseFilters from './ExpenseFilters.jsx';
import './ExpenseList.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

function SkeletonItem() {
  return (
    <li className="skeleton-item">
      <div className="skeleton skeleton-icon" />
      <div className="skeleton-lines">
        <div className="skeleton skeleton-line-wide" />
        <div className="skeleton skeleton-line-narrow" />
      </div>
      <div className="skeleton skeleton-amount" />
    </li>
  );
}

function ExpenseList({
  groups,
  filteredCount,
  totalCount,
  loading,
  filters,
  monthOptions,
  onFilterChange,
  onClearFilters,
  onEditExpense,
  onDeleteExpense,
  onExportCsv,
}) {
  // Re-render after midnight so labels such as "Today" update even if the
  // app remains open overnight.
  const [, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isFiltered = totalCount > 0 && filteredCount !== totalCount;

  return (
    <div className="expense-list-card">
      <div className="list-header">
        <h2>
          Expenses{' '}
          <span className="expense-count">
            {isFiltered ? `${filteredCount} of ${totalCount}` : totalCount}
          </span>
        </h2>

        {filteredCount > 0 && (
          <button
            type="button"
            className="btn-export"
            onClick={onExportCsv}
            title="Download the current list as CSV"
          >
            ⬇ Export CSV
          </button>
        )}
      </div>

      <ExpenseFilters
        filters={filters}
        monthOptions={monthOptions}
        onFilterChange={onFilterChange}
        onClear={onClearFilters}
      />

      {loading ? (
        <ul className="expense-list">
          <SkeletonItem />
          <SkeletonItem />
          <SkeletonItem />
        </ul>
      ) : filteredCount === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">{totalCount === 0 ? '🧾' : '🔍'}</span>
          <p className="empty-title">
            {totalCount === 0 ? 'No expenses yet' : 'No matching expenses'}
          </p>
          <p className="empty-text">
            {totalCount === 0
              ? 'Add your first expense using the form.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="month-groups">
          {groups.map((group) => (
            <section key={group.key} className="month-group">
              <div className="month-group-header">
                <span className="month-group-label">{group.label}</span>
                <span className="month-group-meta">
                  {group.items.length}{' '}
                  {group.items.length === 1 ? 'expense' : 'expenses'} ·{' '}
                  <strong>{formatCurrency(group.total)}</strong>
                </span>
              </div>

              <ul className="expense-list">
                {group.items.map((expense) => (
                  <ExpenseItem
                    key={expense._id}
                    expense={expense}
                    onEdit={onEditExpense}
                    onDelete={onDeleteExpense}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExpenseList;
