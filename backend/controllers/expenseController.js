const Expense = require('../models/Expense');
const { checkBudgetAlert } = require('../utils/budgetAlert');

// @desc    Get the logged-in user's expenses (newest first), with optional filters
// @route   GET /api/expenses?category=Food&search=lunch&from=2026-07-01&to=2026-07-31
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { category, search, from, to } = req.query;

    const query = { user: req.user._id };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    // Keep the most recently added record at the top. The expense date is
    // user-entered and may be older than the time at which it was added.
    const expenses = await Expense.find(query).sort({ createdAt: -1, _id: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses',
      error: error.message,
    });
  }
};

// @desc    Get summary statistics (total, count, per-category breakdown)
// @route   GET /api/expenses/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const [totals] = await Expense.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const byCategory = await Expense.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1,
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totals ? totals.total : 0,
        count: totals ? totals.count : 0,
        byCategory,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stats',
      error: error.message,
    });
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;

    const expense = await Expense.create({
      user: req.user._id,
      amount,
      description,
      category,
      date,
    });

    // Fire-and-forget: may email a budget warning, never blocks the response
    checkBudgetAlert(req.user);

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating expense',
      error: error.message,
    });
  }
};

// @desc    Update an existing expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { amount, description, category, date },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    checkBudgetAlert(req.user);

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense id',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating expense',
      error: error.message,
    });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense id',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting expense',
      error: error.message,
    });
  }
};

module.exports = {
  getExpenses,
  getStats,
  createExpense,
  updateExpense,
  deleteExpense,
};
