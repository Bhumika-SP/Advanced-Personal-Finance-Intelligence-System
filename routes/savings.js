


const express = require("express");
const router = express.Router();
const Savings = require("../models/Savings");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const auth = require("../middleware/auth");

// ➝ Show all savings
router.get("/", auth, async (req, res) => {
  try {
    const savings = await Savings.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.render("savings", { savings });
  } catch (err) {
    console.error("SAVINGS FETCH ERROR:", err.message);
    res.status(500).send("Server error");
  }
});

// ➝ Show add form
router.get("/new", auth, (req, res) => {
  res.render("savings_form", { saving: null });
});

// ➝ Add new savings
router.post("/", auth, async (req, res) => {
  try {
    const { amount, goal } = req.body;

    const savings = new Savings({
      amount,
      goal,
      user: req.user.id
    });

    await savings.save();
    res.redirect("/savings");
  } catch (err) {
    console.error("SAVINGS CREATE ERROR:", err.message);
    res.status(500).send("Server error");
  }
});

// ➝ Show edit form
router.get("/edit/:id", auth, async (req, res) => {
  try {
    const saving = await Savings.findOne({ _id: req.params.id, user: req.user.id });

    if (!saving) return res.status(404).send("Savings entry not found");

    res.render("savings_form", { saving });
  } catch (err) {
    console.error("SAVINGS EDIT ERROR:", err.message);
    res.status(500).send("Server error");
  }
});

// ➝ Update savings
router.post("/edit/:id", auth, async (req, res) => {
  try {
    const { amount, goal } = req.body;

    await Savings.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { amount, goal }
    );

    res.redirect("/savings");
  } catch (err) {
    console.error("SAVINGS UPDATE ERROR:", err.message);
    res.status(500).send("Server error");
  }
});

// ➝ Delete savings
router.post("/delete/:id", auth, async (req, res) => {
  try {
    await Savings.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.redirect("/savings");
  } catch (err) {
    console.error("SAVINGS DELETE ERROR:", err.message);
    res.status(500).send("Server error");
  }
});

// ➝ Auto calculated savings (API only)
router.get("/auto", auth, async (req, res) => {
  try {
    const totalIncome = await Income.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalExpenses = await Expense.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const incomeValue = totalIncome[0]?.total || 0;
    const expenseValue = totalExpenses[0]?.total || 0;
    const autoSavings = incomeValue - expenseValue;

    res.json({ totalIncome: incomeValue, totalExpenses: expenseValue, autoSavings });
  } catch (err) {
    console.error("AUTO SAVINGS ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
