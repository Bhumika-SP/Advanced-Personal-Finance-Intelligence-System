# Expensio - Premium Personal Finance Dashboard 🚀

A modern, SaaS-grade personal expense-tracking web app built with Node.js, Express, and MongoDB. It provides a luxurious dark-themed UI, user authentication, CRUD for finances (expenses/income/savings/trips/budgets), heavy data analytics via Chart.js, and an integrated AI-assisted categorization helper powered by Gemini.

---

## What's New! (Latest UI/UX Overhaul) ✨
The entire frontend has been architecturally refactored to prioritize an immersive, dynamic, and extremely clean SaaS user experience:
- **Global Glassmorphism**: Soft, translucent custom card containers with ambient cyan/purple glow styling mapping universally across the application.
- **Unified EJS Sidebar**: The entire application now runs through a single dynamic `sidebar.ejs` inclusion, perfectly highlighting active states while eliminating hundreds of lines of duplicated markup.
- **Complete Lucide Vector Migration**: Purged all generic legacy emojis and outdated FontAwesome classes. The application now uses crisp, globally initialized `Lucide` SVGs for a highly consistent and professional enterprise feel.
- **Redesigned Landing Page**: Fully responsive layout fixes delivering perfectly aligned sizing, glowing hover states, gradient CTAs, and ambient visual depth matching the internal dashboard.
- **Optimized Data Visualizations**: The Dashboard now boasts proportionally balanced `Chart.js` metrics displaying a sleek, thin doughnut Pie ring and heavily styled Bar graphs using custom hovering gradients.

---

## Core Features 🛠️

- **Secure Auth**: User signup / login (JWT securely stored in an httpOnly cookie)
- **Comprehensive Tracking**: Add / edit / delete capabilities for expenses, incomes, savings, trips, and budgets beautifully integrated with the new Lucide actionable icons.
- **Portability**: Import expenses dynamically from CSV/XLSX and export as CSV / XLSX
- **Analytics Dashboard**: Refined visual dashboard offering Top Categories, anomaly detection, Quick Access grids, and interactive Chart.js tracking
- **Budget Alerts**: Background tracking with automatic overspend and budget velocity alerts
- **Expensio AI**: An integrated AI Chatbot (powered by Google Gemini) resolving heuristic queries and helping categorize data securely from a sleek floating chat UI
- **EJS Templating**: Fast server-side rendered pages using structured partial views for absolute modularity.

---

## Quick Start (local) ⚙️

Prerequisites:
- Node.js (16+ recommended)
- npm
- MongoDB (local or remote)

1. **Clone the repo**

   ```bash
   git clone <repo-url>
   cd track_expense
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   Create a `.env` file in the project root and set the values you need:

   ```env
   PORT=3000
   JWT_SECRET=your_jwt_secret_here
   GEMINI_API_KEY=your_gemini_api_key_here   # optional — leave empty to use heuristics
   ```

   *Note: By default the app connects to MongoDB at `mongodb://127.0.0.1:27017/track_expense` (see `models/user.js`). To use another MongoDB URI, update it to use `process.env.MONGODB_URI` via your production variables.*

4. **Start the app**

   ```bash
   npm start
   ```

Open `http://localhost:3000/`

---

## API & Architecture (Summary) 🔧

### Theming System
The UI relies on standard `TailwindCSS v2.2` coupled inextricably with `style.css` which houses the core variables (`--bg-app`, `--card-bg`, `--accent-cyan`) dictating the Glassmorphism aesthetic seen universally throughout the application. 

### API Routing
Auth:
- POST `/create` — Signup
- POST `/login` — Login
- GET `/logout` — Logout (clears cookie)

Expenses:
- GET `/expenses` — List expenses
- GET `/expenses/new` — Show add form
- POST `/expenses` — Create expense
- POST `/expenses/delete/:id` — Delete expense
- POST `/expenses/import` — Import CSV/XLSX

Other Resources:
- Standard CRUD-ish routes dynamically mapped under `/income`, `/savings`, `/trips`, and `/budgets`.
- `/alerts` — View alerts (powered by backend anomaly detectors)
- `/chat/message` — Core API resolving queries to the Gemini interface mapping dynamic `lucide` chat injections.

---

## Security & Best Practices 🔐

- **Helmet**: Used for basic security headers; CSP meticulously configured to safely allow external Tailwinds, Chart.js processing, and the Lucide icon CDN.
- **Rate limiting**: Configured globally (`express-rate-limit`) protecting critical endpoints.
- **Cryptographic Hashing**: User passwords uniquely hashed utilizing `bcrypt`.
- **JWT tokens**: Issued strictly into httpOnly cookies mitigating XSS vulnerability vectors.

---

## Extending / Contribution 💡

- Implement missing frontend testing suites
- Enhance the AI Chat parameters feeding deeper insight models
- Create a Dockerfile / Docker Compose for automated CI/CD staging environments.
