# 💰 Personal Expense Tracker (MERN Stack)

A full-stack Personal Expense Tracker built with the **MERN** stack — MongoDB, Express.js, React (Vite), and Node.js. Add, view, and delete expenses, and watch your total spending update automatically.

---

## 📖 Project Overview

This application lets a user record daily expenses with an amount, description, category, and date. All data is persisted in MongoDB Atlas via a REST API built with Express and Mongoose. The React frontend (bootstrapped with Vite) consumes the API through an Axios service layer and presents a clean, responsive, card-based UI built with plain CSS — no UI libraries.

---

## ✨ Features

- 🤖 **FinBot — AI advisor chatbot (Gemini)** — a floating chat widget that knows your live expense data; ask it anything ("Where am I overspending?", "How do I cut ₹2,000 a month?") and it analyzes, suggests, and coaches conversationally with quick-question chips and a typing indicator
- ➕ **Add Expense** — amount, description, category, and date with client- and server-side validation
- ✏️ **Edit Expense** — click the pencil on any item; the form switches to edit mode
- 🗑️ **Delete Expense** — removes instantly from the UI (optimistic update)
- 📋 **View Expenses** — sorted newest first
- 🔍 **Search, filter & sort** — search by description, filter by category or month, sort by date or amount
- 📆 **Month-wise view** — expenses are grouped by month with a per-month subtotal and count
- 🛡️ **Delete confirmation popup** — a modal confirms before anything is removed (Esc or overlay click cancels)
- 📤 **Export to CSV** — download the currently filtered list as a spreadsheet-ready file
- 🗓️ **Smart dates** — the date field defaults to today; recent items show "Today" / "Yesterday"
- 📊 **Stats dashboard** — total, this-month spend, top category, and average per transaction
- 💵 **Total Amount** — updates automatically as expenses change
- 🗂️ **Category dropdown** — Food, Travel, Shopping, Bills, Entertainment, Health, Education, Other
- 🏷️ **Color-coded category badges** on every expense
- 🔔 **Toast notifications** for add / update / delete and errors
- 💀 **Skeleton loading states** and friendly empty states
- 🧹 **Auto-clearing form** after a successful add, then re-fetches the latest list
- 📱 **Fully responsive** — sticky form column on desktop, single column on mobile
- ⚠️ Friendly error messages when the API is unreachable or validation fails

---

## 📁 Folder Structure

```
ExpenseTracker/
│
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   └── expenseController.js   # Business logic (get / create / delete)
│   ├── models/
│   │   └── Expense.js             # Mongoose schema + validation
│   ├── routes/
│   │   └── expenseRoutes.js       # /api/expenses routes
│   ├── middleware/
│   │   └── errorMiddleware.js     # 404 + global error handler
│   ├── package.json
│   ├── server.js                  # App entry point
│   ├── .env                       # PORT + MONGO_URI (not committed)
│   └── .env.example
│
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx / Header.css
│   │   │   ├── ExpenseForm.jsx / ExpenseForm.css
│   │   │   ├── ExpenseFilters.jsx / ExpenseFilters.css
│   │   │   ├── ExpenseList.jsx / ExpenseList.css
│   │   │   ├── ExpenseItem.jsx / ExpenseItem.css
│   │   │   ├── TotalExpense.jsx / TotalExpense.css
│   │   │   ├── ChatBot.jsx / ChatBot.css
│   │   │   ├── ConfirmDialog.jsx / ConfirmDialog.css
│   │   │   └── Toast.jsx / Toast.css
│   │   ├── pages/
│   │   │   └── Home.jsx / Home.css
│   │   ├── services/
│   │   │   ├── api.js             # Axios instance (baseURL)
│   │   │   └── expenseService.js  # API call functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🛠️ Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or a local MongoDB instance)

### 1. Clone / create the project

```bash
mkdir ExpenseTracker
cd ExpenseTracker
# copy the backend/ and frontend/ folders here (or clone the repo)
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` (see [Environment Variables](#-environment-variables)).

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

> **Note:** If you were starting from scratch, the frontend would be created with:
> `npm create vite@latest frontend -- --template react`
> This repo already contains the generated project, so a plain `npm install` is all you need.

---

## ☁️ MongoDB Atlas Setup

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. Create a **free (M0) cluster**.
3. In **Database Access**, create a database user with a username and password.
4. In **Network Access**, add your IP address (or `0.0.0.0/0` for development only).
5. Click **Connect → Drivers** and copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>`, and add a database name (e.g. `expensetracker`) before the `?`:
   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/expensetracker?retryWrites=true&w=majority
   ```
7. Paste this into `MONGO_URI` in `backend/.env`.

---

## 🔐 Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

| Variable         | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `PORT`           | Port the Express server listens on                                          |
| `MONGO_URI`      | MongoDB Atlas connection string                                             |
| `GEMINI_API_KEY` | Google Gemini API key for AI insights — free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

> The app works without `GEMINI_API_KEY` — only the FinBot AI chatbot is disabled (it shows a friendly setup message).

---

## ▶️ Run Backend

```bash
cd backend
npm run dev      # development (nodemon, auto-restarts)
# or
npm start        # production (plain node)
```

The API runs at **http://localhost:5000**. You should see:

```
Server running on http://localhost:5000
MongoDB Connected: cluster0-shard-00-01.xxxxx.mongodb.net
```

## ▶️ Run Frontend

In a **second terminal**:

```bash
cd frontend
npm run dev
```

The app opens at **http://localhost:5173**.

---

## 🔌 API Endpoints

Base URL: `http://localhost:5000/api`

| Method   | Endpoint            | Description                                        |
| -------- | ------------------- | -------------------------------------------------- |
| `GET`    | `/expenses`         | Get all expenses (newest first)                     |
| `GET`    | `/expenses/stats`   | Summary: total, count, per-category breakdown       |
| `POST`   | `/expenses`         | Create a new expense                                |
| `PUT`    | `/expenses/:id`     | Update an expense by its id                         |
| `DELETE` | `/expenses/:id`     | Delete an expense by its id                         |
| `POST`   | `/chat`             | Chat with the AI advisor: `{ message, history }`    |

**Chat request example**

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How can I reduce my spending?","history":[]}'
```

`GET /expenses` also accepts optional query parameters:

| Param      | Example              | Effect                                  |
| ---------- | -------------------- | --------------------------------------- |
| `category` | `?category=Food`     | Only expenses in that category          |
| `search`   | `?search=lunch`      | Case-insensitive description search     |
| `from`     | `?from=2026-07-01`   | Expenses on or after this date          |
| `to`       | `?to=2026-07-31`     | Expenses on or before this date         |

### Sample requests (curl)

**Create an expense**

```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250,
    "description": "Lunch at cafe",
    "category": "Food",
    "date": "2026-07-14"
  }'
```

Response `201 Created`:

```json
{
  "success": true,
  "message": "Expense created successfully",
  "data": {
    "_id": "66937f1c2ab4e12d3c9a1b7e",
    "amount": 250,
    "description": "Lunch at cafe",
    "category": "Food",
    "date": "2026-07-14T00:00:00.000Z",
    "createdAt": "2026-07-14T09:30:04.512Z",
    "updatedAt": "2026-07-14T09:30:04.512Z"
  }
}
```

**Get all expenses**

```bash
curl http://localhost:5000/api/expenses
```

Response `200 OK`:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "66937f1c2ab4e12d3c9a1b7e",
      "amount": 250,
      "description": "Lunch at cafe",
      "category": "Food",
      "date": "2026-07-14T00:00:00.000Z",
      "createdAt": "2026-07-14T09:30:04.512Z",
      "updatedAt": "2026-07-14T09:30:04.512Z"
    }
  ]
}
```

**Delete an expense**

```bash
curl -X DELETE http://localhost:5000/api/expenses/66937f1c2ab4e12d3c9a1b7e
```

Response `200 OK`:

```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "data": { "id": "66937f1c2ab4e12d3c9a1b7e" }
}
```

**Validation error example** (`400 Bad Request`):

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Amount must be greater than 0", "Description is required"]
}
```

---

## 📸 Screenshots

> Add your screenshots here.

| Home Page | Add Expense | Expense List |
| --------- | ----------- | ------------ |
| _screenshot_ | _screenshot_ | _screenshot_ |

---

## 🚀 Future Improvements

- 🔐 User authentication (JWT) so each user has private expenses
- 📊 Charts and monthly spending analytics
- 🔍 Filter and search by category or date range
- 📄 Pagination for large expense lists
- 💱 Multi-currency support
- 📤 Export expenses to CSV / PDF
- 🌙 Dark mode

---

## 📄 License

MIT — free to use for learning and personal projects.
# expense_tracking
