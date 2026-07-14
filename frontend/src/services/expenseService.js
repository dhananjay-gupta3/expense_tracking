import api from './api';

// GET /api/expenses — returns the array of expenses (newest first)
export const getExpenses = async () => {
  const response = await api.get('/expenses');
  return response.data.data;
};

// GET /api/expenses/stats — returns { total, count, byCategory }
export const getStats = async () => {
  const response = await api.get('/expenses/stats');
  return response.data.data;
};

// POST /api/expenses — creates an expense, returns the created document
export const addExpense = async (expense) => {
  const response = await api.post('/expenses', expense);
  return response.data.data;
};

// PUT /api/expenses/:id — updates an expense, returns the updated document
export const updateExpense = async (id, expense) => {
  const response = await api.put(`/expenses/${id}`, expense);
  return response.data.data;
};

// DELETE /api/expenses/:id — deletes an expense by id
export const deleteExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};

// POST /api/chat — talk to the AI financial advisor
export const sendChatMessage = async (message, history) => {
  const response = await api.post('/chat', { message, history });
  return response.data.data.reply;
};
