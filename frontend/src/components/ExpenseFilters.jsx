import { useEffect, useRef } from 'react';
import './ExpenseFilters.css';

const CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other',
];

const SORT_OPTIONS = [
  { value: 'created-desc', label: 'Recently added' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'amount-desc', label: 'Amount: high to low' },
  { value: 'amount-asc', label: 'Amount: low to high' },
];

function ExpenseFilters({ filters, monthOptions, onFilterChange, onClear }) {
  const searchRef = useRef(null);

  // Press "/" anywhere to jump to search (unless already typing in a field)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      const typing = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.category !== '' ||
    filters.month !== '' ||
    filters.sort !== 'created-desc';

  return (
    <div className="expense-filters">
      <div className="filter-search">
        <span className="filter-search-icon">🔍</span>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search expenses…"
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          aria-label="Search expenses"
        />
        <kbd className="filter-search-kbd" aria-hidden="true">
          /
        </kbd>
      </div>

      <select
        className="filter-select"
        value={filters.month}
        onChange={(e) => onFilterChange({ ...filters, month: e.target.value })}
        aria-label="Filter by month"
      >
        <option value="">All months</option>
        {monthOptions.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>

      <select
        className="filter-select"
        value={filters.category}
        onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <select
        className="filter-select"
        value={filters.sort}
        onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
        aria-label="Sort expenses"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button type="button" className="filter-clear" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  );
}

export default ExpenseFilters;
