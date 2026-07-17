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
  expenses,
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
  // Month sections the user has collapsed (keys like "2026-07")
  const [collapsedMonths, setCollapsedMonths] = useState(() => new Set());

  const toggleMonth = (key) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Re-render after midnight so labels such as "Today" update even if the
  // app remains open overnight.
  const [, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isFiltered = totalCount > 0 && filteredCount !== totalCount;

  // Amount sorts order the whole list, so month grouping would override
  // them — render a flat list instead.
  const isAmountSort = filters.sort.startsWith('amount');

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
      ) : isAmountSort ? (
        <ul className="expense-list">
          {expenses.map((expense, index) => (
            <ExpenseItem
              key={expense._id}
              expense={expense}
              index={index}
              onEdit={onEditExpense}
              onDelete={onDeleteExpense}
            />
          ))}
        </ul>
      ) : (
        <div className="month-groups">
          {groups.map((group) => {
            const collapsed = collapsedMonths.has(group.key);

            return (
              <section
                key={group.key}
                className={`month-group${collapsed ? ' month-group-collapsed' : ''}`}
                style={{ viewTransitionName: `month-${group.key}` }}
              >
                <button
                  type="button"
                  className="month-group-header"
                  onClick={() => toggleMonth(group.key)}
                  aria-expanded={!collapsed}
                >
                  <span className="month-group-label">
                    <span className="month-chevron" aria-hidden="true">
                      ▾
                    </span>
                    {group.label}
                  </span>
                  <span className="month-group-meta">
                    {group.items.length}{' '}
                    {group.items.length === 1 ? 'expense' : 'expenses'} ·{' '}
                    <strong>{formatCurrency(group.total)}</strong>
                  </span>
                </button>

                <div className="month-group-body">
                  <div className="month-group-body-inner">
                    <ul className="expense-list">
                      {group.items.map((expense, index) => (
                        <ExpenseItem
                          key={expense._id}
                          expense={expense}
                          index={index}
                          onEdit={onEditExpense}
                          onDelete={onDeleteExpense}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ExpenseList;
