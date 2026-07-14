const Expense = require('../models/Expense');
const { GoogleGenAI } = require('@google/genai');

const buildSystemInstruction = (expenses) => {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const expenseData = expenses.map((expense) => ({
    amount: expense.amount,
    description: expense.description,
    category: expense.category,
    date: expense.date.toISOString().slice(0, 10),
  }));

  return `You are "FinBot", a friendly expert financial advisor chatbot inside a Personal Expense Tracker app.

The user's live expense data (all amounts in Indian Rupees, INR):
${expenses.length > 0 ? JSON.stringify(expenseData) : 'The user has not recorded any expenses yet.'}

Total recorded spending: ₹${total}
Number of expenses: ${expenses.length}
Today's date: ${new Date().toISOString().slice(0, 10)}

Your job:
- Answer the user's questions about their spending using the data above.
- Analyze patterns: where the money goes, which categories dominate, unusual or repeated expenses.
- Tell the user concretely how to reduce their spending — name the specific expenses or categories to cut and estimate how much they could save (in ₹).
- Suggest budgets, daily limits, and practical money-saving habits.
- If there are no expenses yet, encourage the user to add some and offer general money advice.

Style rules:
- Be warm, conversational, and concise: usually 2-6 short sentences, or a short list.
- Use plain text only — no markdown symbols like **, #, or backticks. Use simple dashes (-) for lists.
- Always write amounts with the ₹ symbol.
- If asked something unrelated to money or this app, answer briefly and steer back to their finances.`;
};

// @desc    Chat with the AI financial advisor about the user's expenses
// @route   POST /api/chat
// @access  Public
const chatWithAdvisor = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key') {
      return res.status(503).json({
        success: false,
        message:
          'The AI advisor is not configured. Add your GEMINI_API_KEY to backend/.env (get one free at https://aistudio.google.com/apikey).',
      });
    }

    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Sanitize the client-provided history into Gemini's content format:
    // keep the last 20 valid turns and make sure the transcript starts
    // with a user turn (Gemini rejects model-first histories).
    let safeHistory = Array.isArray(history)
      ? history
          .filter(
            (turn) =>
              turn &&
              (turn.role === 'user' || turn.role === 'model') &&
              typeof turn.text === 'string' &&
              turn.text.trim()
          )
          .slice(-20)
          .map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] }))
      : [];

    while (safeHistory.length > 0 && safeHistory[0].role !== 'user') {
      safeHistory.shift();
    }

    const expenses = await Expense.find().sort({ date: -1 });

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...safeHistory,
        { role: 'user', parts: [{ text: message.trim() }] },
      ],
      config: {
        systemInstruction: buildSystemInstruction(expenses),
      },
    });

    res.status(200).json({
      success: true,
      data: { reply: response.text },
    });
  } catch (error) {
    const status = error.status || error.code;

    if (status === 400 || status === 401 || status === 403) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Gemini API key. Check GEMINI_API_KEY in backend/.env.',
      });
    }

    if (status === 429) {
      return res.status(429).json({
        success: false,
        message: 'The AI advisor is rate-limited right now. Please wait a minute and try again.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while talking to the AI advisor',
      error: error.message,
    });
  }
};

module.exports = { chatWithAdvisor };
