import { useState, useEffect } from 'react';
import './ExpenseForm.css';

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

const todayString = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

// Date defaults to today so most expenses can be logged without touching it
const getInitialFormState = () => ({
  amount: '',
  description: '',
  category: '',
  date: todayString(),
});

function ExpenseForm({ onSave, editingExpense, onCancelEdit }) {
  const [formData, setFormData] = useState(getInitialFormState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(editingExpense);

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        amount: String(editingExpense.amount),
        description: editingExpense.description,
        category: editingExpense.category,
        date: editingExpense.date.slice(0, 10),
      });
      setErrors({});
    } else {
      setFormData(getInitialFormState());
    }
  }, [editingExpense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        amount: Number(formData.amount),
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date,
      });
      setFormData(getInitialFormState());
      setErrors({});
    } catch (err) {
      setErrors({
        submit: isEditing
          ? 'Failed to update expense. Please try again.'
          : 'Failed to add expense. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="expense-form-card">
      <div className="form-header">
        <h2>{isEditing ? 'Edit Expense' : 'Add Expense'}</h2>
        {isEditing && (
          <button type="button" className="btn-cancel-edit" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            type="number"
            id="amount"
            name="amount"
            placeholder="e.g. 250"
            min="0.01"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            className={errors.amount ? 'input-invalid' : ''}
          />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            type="text"
            id="description"
            name="description"
            placeholder="e.g. Lunch at cafe"
            value={formData.description}
            onChange={handleChange}
            className={errors.description ? 'input-invalid' : ''}
          />
          {errors.description && (
            <span className="field-error">{errors.description}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={errors.category ? 'input-invalid' : ''}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={errors.date ? 'input-invalid' : ''}
          />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>

        {errors.submit && <div className="field-error">{errors.submit}</div>}

        <button type="submit" className="btn-submit" disabled={submitting}>
          {submitting
            ? isEditing
              ? 'Saving…'
              : 'Adding…'
            : isEditing
              ? 'Save Changes'
              : '+ Add Expense'}
        </button>
      </form>
    </div>
  );
}

export default ExpenseForm;
