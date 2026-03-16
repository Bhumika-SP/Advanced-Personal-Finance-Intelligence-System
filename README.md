# Track Expense ✅

A small personal expense-tracking web app built with Node.js, Express and MongoDB. It provides user authentication, CRUD for expenses/income/savings/trips/budgets, import/export (CSV/XLSX), a dashboard with basic insights and alerts, and an AI-assisted categorization helper (Gemini integration optional).

---

## Features ✨

- User signup / login (JWT stored in an httpOnly cookie)
- Add / edit / delete expenses, incomes, savings, trips, budgets
- Import expenses from CSV/XLSX and export as CSV / XLSX
- Dashboard with category and daily charts, pagination & anomaly detection
- Budget tracking with automatic overspend alerts
- Alerts center (read / read-all)
- AI helper for suggesting expense categories (uses Google Gemini when configured; falls back to heuristics)
- EJS templates for server-rendered pages (views/)

---

## Quick Start (local) ⚙️

Prerequisites:
- Node.js (16+ recommended)
- npm
- MongoDB (local or remote)

1. Clone the repo

   ```bash
   git clone <repo-url>
   cd track_expense
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Configure environment

   Create a `.env` file in the project root (optional) and set values you need:

   ```env
   PORT=3000
   JWT_SECRET=your_jwt_secret_here
   GEMINI_API_KEY=your_gemini_api_key_here   # optional — leave empty to use heuristics
   ```

   Note: By default the app connects to MongoDB at `mongodb://127.0.0.1:27017/track_expense` (see `models/user.js`). To use another MongoDB URI, update `models/user.js` to use `process.env.MONGODB_URI` (or change it to your preferred connection logic).

4. Start the app

   ```bash
   npm start
   ```

Open https://advanced-personal-finance-intellige.vercel.app/

---

## Environment Variables 🔒

- `PORT` — port to run the server (default: `3000`)
- `JWT_SECRET` — secret used to sign auth JWT (set something secure in production)
- `GEMINI_API_KEY` — (optional) Google Gemini API key used by the AI category suggestion. If missing, the service falls back to a simple heuristic.

---

## API / Routes (summary) 🔧

Authentication
- POST `/create` — Signup (name, email, password, confirmpassword)
- POST `/login` — Login (email, password)
- GET `/logout` — Logout (clears cookie)

Expenses
- GET `/expenses` — List expenses (EJS page or JSON)
- GET `/expenses/new` — Show add form
- POST `/expenses` — Create expense
- GET `/expenses/edit/:id` — Edit form
- POST `/expenses/edit/:id` — Update
- POST `/expenses/delete/:id` — Delete
- POST `/expenses/import` — Import CSV/XLSX (field name: `file`)
- GET `/expenses/export?format=csv|xlsx&month=YYYY-MM` — Export

Budgets
- GET `/budgets` — List budgets for a period
- GET `/budgets/new` — New budget form
- POST `/budgets` — Create budget
- GET `/budgets/edit/:id` — Edit form
- POST `/budgets/edit/:id` — Update
- POST `/budgets/delete/:id` — Delete

Income / Savings / Trips
- Standard CRUD-ish routes under `/income`, `/savings`, `/trips` (see `routes/` folder)
- `/savings/auto` — calculates auto savings (API)

Alerts
- GET `/alerts` — View alerts
- POST `/alerts/:id/read` — Mark one alert read
- POST `/alerts/read-all` — Mark all read

AI
- POST `/ai/categorize` — Suggest category (body: `description`, `amount`, optional `candidates[]`)
  - Response: JSON with `{ category, confidence, rationale, model }`

Notes:
- Most user routes require authentication via cookie (JWT). If an auth cookie is missing you will be redirected to `/login`.
- The chat functionality in `routes/chat.js` contains a rich local query handler but the user-facing endpoints are currently commented out — enable the routes to use it.

---

## Data Models (high level) 🗂️

- `User` — name, email, password (bcrypt)
- `Expense` — description, category, amount, date, user
- `Income` — amount, source, description, date, user
- `Budget` — category, amount, period, rollover, alertsOn
- `Savings` — amount, goal, user
- `Trip` — title, destination, budget, dates, user
- `Alert` — type, title, message, meta, read
- `ChatMessage` — user, role, text

---

## Security & Best Practices 🔐

- Helmet is used for basic security headers; CSP restricts script/style sources to self and jsdelivr CDN.
- Rate limiting is configured globally (`express-rate-limit`) to limit abusive requests.
- Passwords are hashed using `bcrypt`.
- JWT tokens are stored in httpOnly cookies to protect against XSS.

Production Notes:
- Replace the hard-coded MongoDB connection (in `models/user.js`) with a connection that reads `process.env.MONGODB_URI`.
- Use HTTPS and set `secure: true` on cookies in production.
- Configure a strong `JWT_SECRET` and rotate as needed.

---

## Extending / Contribution 💡

- Feel free to open issues or PRs to:
  - Add tests
  - Add an integration for MongoDB URI via env var
  - Implement chat endpoints (uncomment the handlers in `routes/chat.js` and add front-end integration)
  - Add a Dockerfile / Docker Compose for easy local setup with MongoDB

---

## Known TODOs / Notes 📝

- Some chat routes are commented out — the backend logic exists in `routes/chat.js` but the HTTP endpoints are disabled by default.
- `models/user.js` currently connects with a hard-coded local MongoDB URI.
- No automated tests yet (see `package.json` scripts).

---

## License

MIT (add your license text here)

---

If you'd like, I can also:
- Add a `.env.example` file
- Add a small Docker Compose for Node + MongoDB
- Add basic unit tests for route handlers

Happy to help with any of those next steps! 🚀
