import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Header from '../components/Header.jsx';
import ExpenseForm from '../components/ExpenseForm.jsx';
import ExpenseList from '../components/ExpenseList.jsx';
import TotalExpense from '../components/TotalExpense.jsx';
import ChatBot from '../components/ChatBot.jsx';
import Toast from '../components/Toast.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from '../services/expenseService';
import { withViewTransition } from '../utils/viewTransition';
import './Home.css';

const UNDO_WINDOW_MS = 5000;

const defaultFilters = {
  search: '',
  category: '',
  month: '',
  sort: 'created-desc',
};

const monthKeyOf = (expense) => expense.date.slice(0, 7); // "YYYY-MM"

const monthLabelOf = (monthKey) => {
  const [year, month] = monthKey.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

function Home({ onOpenProfile }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  // Delete waiting for its undo window to expire: { expense, timer }
  const pendingDeleteRef = useRef(null);

  const showToast = useCallback((message, type = 'success', options = {}) => {
    setToast({ message, type, ...options });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await getExpenses();
      // Don't resurrect an expense whose delete hasn't been committed yet
      const pendingId = pendingDeleteRef.current?.expense._id;
      setExpenses(pendingId ? data.filter((e) => e._id !== pendingId) : data);
    } catch (err) {
      showToast(
        'Could not load expenses. Is the backend running on port 5000?',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Push the pending delete to the server (called when the undo window
  // closes, or early if another delete starts)
  const commitPendingDelete = useCallback(async () => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;

    pendingDeleteRef.current = null;
    clearTimeout(pending.timer);

    try {
      await deleteExpense(pending.expense._id);
    } catch (err) {
      showToast('Failed to delete expense. Refreshing the list.', 'error');
      await fetchExpenses();
    }
  }, [fetchExpenses, showToast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSaveExpense = async (expenseData) => {
    if (editingExpense) {
      await updateExpense(editingExpense._id, expenseData);
      setEditingExpense(null);
      showToast('Expense updated');
    } else {
      await addExpense(expenseData);
      showToast('Expense added');
    }
    await fetchExpenses();
  };

  const handleUndoDelete = useCallback(() => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;

    pendingDeleteRef.current = null;
    clearTimeout(pending.timer);

    withViewTransition(() => {
      setExpenses((prev) => [...prev, pending.expense]);
    });
    showToast('Expense restored');
  }, [showToast]);

  const handleConfirmDelete = () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;

    if (editingExpense && editingExpense._id === target._id) {
      setEditingExpense(null);
    }

    // Only one delete can sit in the undo window — commit the previous one
    commitPendingDelete();

    // Remove instantly from the UI; the server delete happens after the
    // undo window so the action can be reversed without a round trip
    withViewTransition(() => {
      setExpenses((prev) => prev.filter((expense) => expense._id !== target._id));
    });

    const timer = setTimeout(commitPendingDelete, UNDO_WINDOW_MS);
    pendingDeleteRef.current = { expense: target, timer };

    showToast('Expense deleted', 'success', {
      duration: UNDO_WINDOW_MS,
      action: { label: 'Undo', onAction: handleUndoDelete },
    });
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Animate reorders for discrete filter changes; typing in search updates
  // on every keystroke, so it stays instant
  const handleFilterChange = (next) => {
    if (next.search !== filters.search) {
      setFilters(next);
    } else {
      withViewTransition(() => setFilters(next));
    }
  };

  const handleClearFilters = () => {
    withViewTransition(() => setFilters(defaultFilters));
  };

  // Unique months present in the data, newest first — drives the month filter
  const monthOptions = useMemo(() => {
    const keys = [...new Set(expenses.map(monthKeyOf))].sort().reverse();
    return keys.map((key) => ({ value: key, label: monthLabelOf(key) }));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      result = result.filter((expense) =>
        expense.description.toLowerCase().includes(term)
      );
    }

    if (filters.category) {
      result = result.filter((expense) => expense.category === filters.category);
    }

    if (filters.month) {
      result = result.filter((expense) => monthKeyOf(expense) === filters.month);
    }

    const newestAddedFirst = (a, b) =>
      new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);

    switch (filters.sort) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'amount-desc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.amount - b.amount);
        break;
      case 'created-desc':
      default:
        result.sort(newestAddedFirst);
        break;
    }

    return result;
  }, [expenses, filters]);

  // Keep the Expenses view organized month by month. Items inside every
  // month retain the selected order (recently added, date, or amount).
  const groupedExpenses = useMemo(() => {
    const groups = new Map();

    for (const expense of filteredExpenses) {
      const key = monthKeyOf(expense);
      if (!groups.has(key)) {
        groups.set(key, { key, label: monthLabelOf(key), total: 0, items: [] });
      }
      const group = groups.get(key);
      group.total += expense.amount;
      group.items.push(expense);
    }

    const ordered = [...groups.values()].sort((a, b) => {
      if (filters.sort === 'date-asc') return a.key.localeCompare(b.key);
      return b.key.localeCompare(a.key);
    });

    return ordered;
  }, [filteredExpenses, filters.sort]);

  const handleExportCsv = () => {
    if (filteredExpenses.length === 0) return;

    const escapeCell = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      ['Date', 'Description', 'Category', 'Amount'],
      ...filteredExpenses.map((expense) => [
        expense.date.slice(0, 10),
        expense.description,
        expense.category,
        expense.amount,
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'expenses.csv';
    link.click();
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredExpenses.length} expenses to CSV`);
  };

  return (
    <div className="home">
      <Header onOpenProfile={onOpenProfile} />

      <main className="container">
        <TotalExpense expenses={expenses} />

        <div className="home-content">
          <div className="form-column">
            <ExpenseForm
              onSave={handleSaveExpense}
              editingExpense={editingExpense}
              onCancelEdit={() => setEditingExpense(null)}
            />
          </div>

          <ExpenseList
            groups={groupedExpenses}
            expenses={filteredExpenses}
            filteredCount={filteredExpenses.length}
            totalCount={expenses.length}
            loading={loading}
            filters={filters}
            monthOptions={monthOptions}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            onEditExpense={handleEditExpense}
            onDeleteExpense={setDeleteTarget}
            onExportCsv={handleExportCsv}
          />
        </div>
      </main>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this expense?"
        message="This action cannot be undone."
        detail={
          deleteTarget
            ? `${deleteTarget.description} — ${new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(deleteTarget.amount)}`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ChatBot expenseCount={expenses.length} />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export default Home;
