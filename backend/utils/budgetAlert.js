const Expense = require('../models/Expense');
const { sendBudgetAlertEmail } = require('../utils/sendEmail');

const ALERT_LEVELS = [100, 80]; // checked highest first

// After a spend changes, email the user if they crossed 80% or 100% of
// their monthly budget. Each level fires at most once per month.
const checkBudgetAlert = async (user) => {
  try {
    if (!user || !user.emailAlerts || !user.monthlyBudget) return;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [totals] = await Expense.aggregate([
      {
        $match: {
          user: user._id,
          date: { $gte: monthStart, $lt: nextMonthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const spent = totals ? totals.total : 0;
    const percent = (spent / user.monthlyBudget) * 100;

    const level = ALERT_LEVELS.find((threshold) => percent >= threshold);
    if (!level) return;

    const alreadySent =
      user.budgetAlert && user.budgetAlert.month === monthKey && user.budgetAlert.level >= level;
    if (alreadySent) return;

    // Send first, mark after — a failed send must not consume the
    // once-per-month alert
    const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    await sendBudgetAlertEmail(user.email, user.name, {
      spent,
      budget: user.monthlyBudget,
      monthLabel,
      level,
    });

    user.budgetAlert = { month: monthKey, level };
    await user.save();
  } catch (error) {
    // Alerts are best-effort — never break the expense flow over email issues
    console.error('Budget alert failed:', error.message);
  }
};

module.exports = { checkBudgetAlert };
