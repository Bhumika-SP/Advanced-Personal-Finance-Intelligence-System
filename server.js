

// server.js
const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(methodOverride("_method")); // must be before routes that use _method

// Routes
const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const tripRoutes = require("./routes/trips");
const incomeRoutes = require("./routes/income");
const savingsRoutes = require("./routes/savings");
const dashboardRoutes = require("./routes/dashboard");

 app.get("/", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.use("/", authRoutes);          // handles /create and /login
app.use("/expenses", expenseRoutes);
app.use("/trips", tripRoutes);
app.use("/income", incomeRoutes);
app.use("/savings", savingsRoutes);
app.use("/", dashboardRoutes);     // contains GET /dashboard

// root: show login (or change to render signup if you prefer)
app.get("/", (req, res) => res.redirect("/login"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server Running on http://localhost:${PORT}`));
