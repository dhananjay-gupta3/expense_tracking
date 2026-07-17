# 💰 Personal Expense Tracker (MERN Stack with AI)

A full-stack Personal Expense Tracker built with the **MERN** stack — MongoDB, Express.js, React (Vite), and Node.js — with **user accounts**, **Google sign-in**, a **monthly budget with email warnings**, and an **AI financial advisor**. Every user's expense history is saved privately to their own account.

---

## 📖 Project Overview

Sign up (or continue with Google), record daily expenses with an amount, description, category, and date, and watch your dashboard update in real time. Set a monthly budget on your profile and the server emails you a ⚠️ warning at 80% and a 🚨 alert at 100% of it. All data is persisted per-user in MongoDB Atlas via a JWT-protected REST API built with Express and Mongoose. The React frontend (Vite) uses an Axios service layer and a clean, animated, card-based UI built with plain CSS — no UI libraries.

---

## ✨ Features

### 🔐 Accounts & security
- **Signup with email + password** — account is created and logged in immediately
- **Google sign-in** — one click via Google Identity Services; links to an existing account with the same email
- **JWT sessions (30 days)** — stored client-side; expired sessions return you to the login screen automatically
- **Private data** — every expense belongs to the logged-in user; all expense/chat routes are protected
- **Change password** — from the profile (Security section); Google-only accounts can *set* a password to enable email login too
- **Security emails** — welcome email on signup and a notification whenever the password changes

### 👤 Profile
- Avatar (Google photo or initial), verified badge, member-since
- **Live account stats** — total spent, transactions, this-month spend, biggest expense (animated count-ups)
- **Top categories** — where your money goes, with color-coded animated bars
- **Monthly budget** — set/edit/remove; synced to your account across devices
- **Budget warning emails toggle** — ⚠️ at 80% and 🚨 at 100% of budget, at most once per level per month
- Logout button at the top-right of the profile card

### 💸 Expenses
- ➕ **Add / ✏️ edit / 🗑️ delete** with client- and server-side validation
- ↩️ **Undo delete** — 5-second window before the delete is committed to the server
- 🔍 **Search, filter & sort** — by description, category, month, date, or amount (low→high / high→low)
- 📆 **Month-wise view** — collapsible month groups with per-month subtotal and count
- 📤 **Export to CSV** — downloads the currently filtered list
- 📊 **Stats dashboard** — total, this-month (with budget progress bar), top category, average
- 🤖 **FinBot AI advisor (Gemini)** — chats about *your* expenses only, with saving suggestions

### 🎨 UI & polish
- 🌗 Light & dark mode (remembered), smooth theme-toggle animation
- ✨ **View Transitions API** — list reorders/deletes animate to their new positions
- Staggered entrances, count-up numbers, hover lifts, press states, error shake
- ♿ Respects `prefers-reduced-motion`; keyboard shortcut `/` focuses search
- 🔔 Toasts (with Undo action), skeleton loading, friendly empty states, delete confirmation modal
- 📱 Fully responsive

---

## 📁 Folder Structure

```
expense_tracking/
│
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # signup / login / Google / profile / password
│   │   ├── expenseController.js     # per-user expense CRUD + stats
│   │   └── chatController.js        # Gemini AI advisor (user-scoped)
│   ├── models/
│   │   ├── User.js                  # user, bcrypt password, budget, alert state
│   │   └── Expense.js               # expense schema (belongs to a user)
│   ├── routes/
│   │   ├── authRoutes.js            # /api/auth
│   │   ├── expenseRoutes.js         # /api/expenses (JWT-protected)
│   │   └── chatRoutes.js            # /api/chat (JWT-protected)
│   ├── middleware/
│   │   ├── authMiddleware.js        # Bearer-token verification
│   │   └── errorMiddleware.js       # 404 + global error handler
│   ├── utils/
│   │   ├── sendEmail.js             # SMTP + Brevo HTTP API email delivery
│   │   └── budgetAlert.js           # 80% / 100% budget warning emails
│   ├── server.js
│   ├── .env                         # secrets (not committed)
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Header, ExpenseForm, ExpenseList, ExpenseItem,
│   │   │                            # ExpenseFilters, TotalExpense (budget), ChatBot,
│   │   │                            # ConfirmDialog, Toast (+ CSS each)
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # session state, login/logout
│   │   ├── hooks/
│   │   │   └── useCountUp.js        # animated number counter
│   │   ├── pages/
│   │   │   ├── Auth.jsx / Auth.css        # login / signup / Google button
│   │   │   ├── Profile.jsx / Profile.css  # stats, settings, password, logout
│   │   │   └── Home.jsx / Home.css        # dashboard
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance + token interceptors
│   │   │   ├── authService.js       # auth API calls
│   │   │   └── expenseService.js    # expense/chat API calls
│   │   ├── utils/
│   │   │   └── viewTransition.js    # View Transitions API helper
│   │   ├── App.jsx                  # auth gate + page switching
│   │   ├── main.jsx
│   │   └── index.css                # design tokens, themes, motion system
│   ├── .env                         # VITE_* config (not committed)
│   ├── .env.example
│   └── vite.config.js
│
└── README.md
```

---

## 🛠️ Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or local MongoDB)

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (see [Environment Variables](#-environment-variables)).

### 2. Frontend

```bash
cd ../frontend
npm install
```

Optionally create `frontend/.env` for Google sign-in (see below).

---

## ☁️ MongoDB Atlas Setup

1. Create a **free (M0) cluster** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access** → create a database user.
3. **Network Access** → add your IP (or `0.0.0.0/0` for development).
4. **Connect → Drivers** → copy the connection string and fill in user/password:
   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/expensetracker?retryWrites=true&w=majority
   ```
5. Paste it into `MONGO_URI` in `backend/.env`.

---

## 🔐 Environment Variables

### `backend/.env`

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=a_long_random_string

# Google sign-in (optional)
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com

# Email — Gmail SMTP (good for local dev)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="Expense Tracker" <you@gmail.com>

# Email — Brevo HTTP API (recommended on Render / hosts that block SMTP)
# When set, it is used instead of SMTP. EMAIL_FROM must be a verified Brevo sender.
# BREVO_API_KEY=xkeysib-...
```

| Variable | Description |
| --- | --- |
| `PORT` | Express server port |
| `MONGO_URI` | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Gemini key for FinBot — free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `JWT_SECRET` | Secret for signing session tokens — use a long random string |
| `GOOGLE_CLIENT_ID` | OAuth Client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `EMAIL_HOST/PORT/USER/PASS` | SMTP credentials (Gmail: use an [App Password](https://myaccount.google.com/apppasswords)) |
| `EMAIL_FROM` | Sender shown on outgoing emails |
| `BREVO_API_KEY` | Brevo API key — sends over HTTPS, works where SMTP ports are blocked |

> **No email config?** The app still works — emails are printed to the backend console instead (handy in development).
> **No `GEMINI_API_KEY`?** Only FinBot is disabled.
> **No `GOOGLE_CLIENT_ID`?** The Google button is hidden; email/password auth still works.

### `frontend/.env` (optional)

```env
# Same OAuth Client ID as the backend — enables the Google button
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com

# Override the API URL (must end with /api). Defaults to localhost:5000 in dev.
# VITE_API_URL=http://localhost:5000/api
```

For Google sign-in, add `http://localhost:5173` to **Authorized JavaScript origins** on the OAuth client.

---

## ▶️ Run

```bash
# terminal 1
cd backend
npm run dev        # http://localhost:5000

# terminal 2
cd frontend
npm run dev        # http://localhost:5173
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:5000/api`

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | — | Create account, returns `{ token, user }` (logged in immediately) |
| `POST` | `/auth/login` | — | Login with email + password, returns `{ token, user }` |
| `POST` | `/auth/google` | — | Login/signup with a Google ID token `{ credential }` |
| `GET` | `/auth/me` | ✅ | Current profile |
| `PUT` | `/auth/me` | ✅ | Update `name`, `monthlyBudget`, `emailAlerts` |
| `PUT` | `/auth/password` | ✅ | Change password `{ currentPassword, newPassword }` |

### Expenses — `/api/expenses` (all require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/expenses` | Your expenses, newest first (`?category=&search=&from=&to=`) |
| `GET` | `/expenses/stats` | Total, count, per-category breakdown |
| `POST` | `/expenses` | Create (also triggers the budget-warning check) |
| `PUT` | `/expenses/:id` | Update your expense |
| `DELETE` | `/expenses/:id` | Delete your expense |

### Chat — `/api/chat` (requires auth)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/chat` | `{ message, history }` → AI reply about *your* spending |

### Sample requests

```bash
# sign up → grab the token from the response
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.com","password":"secret123"}'

# create an expense (authenticated)
curl -X POST http://localhost:5000/api/expenses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":250,"description":"Lunch at cafe","category":"Food","date":"2026-07-14"}'

# list your expenses
curl http://localhost:5000/api/expenses -H "Authorization: Bearer <token>"
```

---

## 📬 Budget Warning Emails

1. Set a **monthly budget** on your profile (or in the "This Month" stat card).
2. Keep **Budget warning emails** switched on (profile → Account settings).
3. When adding/editing an expense pushes the current month past a threshold, the server emails you:
   - **⚠️ 80%** — "You are close to your monthly budget"
   - **🚨 100%** — "You have exceeded your monthly budget"
4. Each level fires **at most once per month** (changing the budget re-arms it).

Delivery uses Gmail SMTP locally and the **Brevo HTTP API** in production (`BREVO_API_KEY`), since many hosts (including Render) block outbound SMTP ports.

---

## ☁️ Deploying to Render

Two services from one repo:

**1. Backend → Web Service**

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Env vars | `MONGO_URI`, `GEMINI_API_KEY`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `BREVO_API_KEY`, `EMAIL_FROM` |

> Don't set `PORT` — Render provides it. Use `BREVO_API_KEY` for email: Render blocks SMTP connections, so Gmail SMTP times out there.

**2. Frontend → Static Site**

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Env vars | `VITE_API_URL=https://<your-api>.onrender.com/api`, `VITE_GOOGLE_CLIENT_ID` |

**3. MongoDB Atlas** — Network Access → allow `0.0.0.0/0` or [Render's outbound IPs](https://render.com/docs/static-outbound-ip-addresses).

**4. Google OAuth** — add your live frontend URL to **Authorized JavaScript origins**.

> ⚠️ `VITE_*` values are baked in at **build time** — redeploy the static site after changing them. Free-tier services sleep after inactivity; the first request may take ~30–60s.

---

## 🚀 Future Improvements

- 📊 Charts and monthly spending analytics
- 📄 Pagination for large expense lists
- 💱 Multi-currency support
- 🔁 Recurring expenses
- 📱 PWA / offline support

---

## 📄 License

MIT — free to use for learning and personal projects.
