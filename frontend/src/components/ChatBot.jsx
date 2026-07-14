import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/expenseService';
import './ChatBot.css';

const WELCOME_MESSAGE = {
  role: 'model',
  text: "Hi! I'm FinBot, your AI money advisor. 💰 I can see your expenses, so ask me anything — where your money goes, how to cut spending, or what budget suits you.",
};

const QUICK_QUESTIONS = [
  'How can I reduce my spending?',
  'Analyze my expenses',
  'Where am I overspending?',
  'Suggest a monthly budget for me',
];

function ChatBot({ expenseCount }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMessage = { role: 'user', text: trimmed };
    const historyForApi = messages.map(({ role, text: t }) => ({ role, text: t }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const reply = await sendChatMessage(trimmed, historyForApi);
      setMessages((prev) => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text:
            err.response?.data?.message ||
            'Sorry, I could not reach the server. Make sure the backend is running and try again.',
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const showQuickQuestions = messages.length <= 1 && !sending;

  return (
    <>
      {open && (
        <div className="chat-window" role="dialog" aria-label="AI money advisor chat">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">🤖</div>
              <div>
                <span className="chat-title">FinBot — AI Money Advisor</span>
                <span className="chat-status">
                  <span className="chat-status-dot" /> Knows your{' '}
                  {expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat-bubble ${
                  message.role === 'user' ? 'bubble-user' : 'bubble-bot'
                }${message.isError ? ' bubble-error' : ''}`}
              >
                {message.text}
              </div>
            ))}

            {sending && (
              <div className="chat-bubble bubble-bot bubble-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}

            {showQuickQuestions && (
              <div className="chat-chips">
                {QUICK_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="chat-chip"
                    onClick={() => sendMessage(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-row" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about your spending…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="chat-send"
              disabled={sending || !input.trim()}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`chat-launcher${open ? ' chat-launcher-open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close AI advisor chat' : 'Open AI advisor chat'}
      >
        {open ? '✕' : '💬'}
      </button>
    </>
  );
}

export default ChatBot;
