import { useState, useEffect, useMemo, useCallback } from 'react';
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
import './Home.css';

const defaultFilters = {
  search: '',
  category: '',
  month: '',
  sort: 'date-desc',
};

const monthKeyOf = (expense) => expense.date.slice(0, 7); // "YYYY-MM"

const monthLabelOf = (monthKey) => {
  const [year, month] = monthKey.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

function Home() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      showToast(
        'Could not load expenses. Is the backend running on port 5000?',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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

  const handleConfirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;

    if (editingExpense && editingExpense._id === target._id) {
      setEditingExpense(null);
    }

    // Remove instantly from the UI, then sync with the server
    setExpenses((prev) => prev.filter((expense) => expense._id !== target._id));
    try {
      await deleteExpense(target._id);
      showToast('Expense deleted');
    } catch (err) {
      showToast('Failed to delete expense. Refreshing the list.', 'error');
      await fetchExpenses();
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      case 'date-desc':
      default:
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
    }

    return result;
  }, [expenses, filters]);

  // Group the filtered list by month, each group with its own subtotal
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

    const ordered = [...groups.values()].sort((a, b) =>
      filters.sort === 'date-asc' ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)
    );

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
      <Header />

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
            filteredCount={filteredExpenses.length}
            totalCount={expenses.length}
            loading={loading}
            filters={filters}
            monthOptions={monthOptions}
            onFilterChange={setFilters}
            onClearFilters={() => setFilters(defaultFilters)}
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
