

// server.js
require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(methodOverride("_method")); // must be before routes that use _method
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": ["'self'", "https://generativelanguage.googleapis.com", "https://cdn.jsdelivr.net"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
});
app.use(apiLimiter);

// Routes
const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const tripRoutes = require("./routes/trips");
const incomeRoutes = require("./routes/income");
const savingsRoutes = require("./routes/savings");
const dashboardRoutes = require("./routes/dashboard");
const aiRoutes = require("./routes/ai");
const budgetRoutes = require("./routes/budgets");
const subscriptionsRoutes = require("./routes/subscriptions");
const chatRoutes = require("./routes/chat");
const alertsRoutes = require("./routes/alerts");

// Landing page
app.get("/", (req, res) => {
  res.render("welcome");
});

app.get("/login", (req, res) => {
  res.render("login");
});

// Signup page
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.use("/", authRoutes);          // handles /create and /login
app.use("/expenses", expenseRoutes);
app.use("/trips", tripRoutes);
app.use("/income", incomeRoutes);
app.use("/savings", savingsRoutes);
app.use("/", dashboardRoutes);     // contains GET /dashboard
app.use("/ai", aiRoutes);          // AI endpoints
app.use("/budgets", budgetRoutes);
app.use("/subscriptions", subscriptionsRoutes);
app.use("/chat", chatRoutes);
app.use("/alerts", alertsRoutes);

// (root handled above)

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`✅ Server Running on http://localhost:${PORT}`));
}

// Required for Vercel Serverless Functions
module.exports = app;
