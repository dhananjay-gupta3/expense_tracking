const express = require('express');
const {
  getExpenses,
  getStats,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');

const router = express.Router();

router.get('/stats', getStats);
router.route('/').get(getExpenses).post(createExpense);
router.route('/:id').put(updateExpense).delete(deleteExpense);

module.exports = router;
