const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const auth = require("../middleware/auth");
const Alert = require("../models/Alert");

function getPeriodNow() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function periodRange(yyyyMm) {
  const [y, m] = yyyyMm.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  return { start, end };
}

router.get("/", auth, async (req, res) => {
  try {
    const period = req.query.period || getPeriodNow();
    const budgets = await Budget.find({ user: req.userId, period }).sort({ category: 1 });
    const { start, end } = periodRange(period);
    const expenses = await Expense.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.userId), date: { $gte: start, $lte: end } } },
      { $group: { _id: "$category", spent: { $sum: "$amount" } } }
    ]);
    const spentMap = Object.fromEntries(expenses.map(e => [e._id, e.spent]));
    const rows = budgets.map(b => {
      const spent = spentMap[b.category] || 0;
      const remaining = Math.max(0, b.amount - spent);
      const overspend = spent > b.amount;
      const progress = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
      return { budget: b, spent, remaining, overspend, progress };
    });

    for (const r of rows) {
      if (r.overspend && r.budget.alertsOn) {
        const exists = await Alert.findOne({
          user: req.userId,
          type: "overspend",
          "meta.category": r.budget.category,
          "meta.period": period
        });
        if (!exists) {
          await Alert.create({
            user: req.userId,
            type: "overspend",
            title: `Overspent: ${r.budget.category}`,
            message: `Spent ₹${r.spent} of ₹${r.budget.amount} for ${period}.`,
            meta: { category: r.budget.category, period }
          });
        }
      }
    }
    res.render("budgets", { period, rows });
  } catch (e) {
    res.status(500).send("Server error");
  }
});

router.get("/new", auth, (req, res) => {
  const period = req.query.period || getPeriodNow();
  res.render("budget_form", { budget: null, period });
});

router.post("/", auth, async (req, res) => {
  try {
    const { category, amount, period, rollover, alertsOn } = req.body;
    if (!category || !amount || !period) return res.status(400).send("Missing fields");
    await Budget.create({ user: req.userId, category, amount, period, rollover: !!rollover, alertsOn: !!alertsOn });
    res.redirect(`/budgets?period=${encodeURIComponent(period)}`);
  } catch (e) {
    res.status(500).send("Server error");
  }
});

router.get("/edit/:id", auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.userId });
    if (!budget) return res.status(404).send("Not found");
    res.render("budget_form", { budget, period: budget.period });
  } catch (e) {
    res.status(500).send("Server error");
  }
});

router.post("/edit/:id", auth, async (req, res) => {
  try {
    const { category, amount, period, rollover, alertsOn } = req.body;
    const b = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { category, amount, period, rollover: !!rollover, alertsOn: !!alertsOn },
      { new: true, runValidators: true }
    );
    if (!b) return res.status(404).send("Not found");
    res.redirect(`/budgets?period=${encodeURIComponent(b.period)}`);
  } catch (e) {
    res.status(500).send("Server error");
  }
});

router.post("/delete/:id", auth, async (req, res) => {
  try {
    const b = await Budget.findOneAndDelete({ _id: req.params.id, user: req.userId });
    const period = b ? b.period : getPeriodNow();
    res.redirect(`/budgets?period=${encodeURIComponent(period)}`);
  } catch (e) {
    res.status(500).send("Server error");
  }
});

module.exports = router;
