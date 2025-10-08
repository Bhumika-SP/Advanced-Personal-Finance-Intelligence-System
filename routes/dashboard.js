const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const auth = require("../middleware/auth");

router.get("/dashboard", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // 🔹 Total count for pagination
    const totalExpenses = await Expense.countDocuments({ user: req.userId });
    const pages = Math.ceil(totalExpenses / limit) || 1;

    // 🔹 Recent expenses (table)
    const recentExpenses = await Expense.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 🔹 All expenses (for charts only)
    const allExpenses = await Expense.find({ user: req.userId });

    // --- Pie Chart Data (categories) ---
    const categoryMap = {};
    allExpenses.forEach(exp => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });

    const categoryLabels = Object.keys(categoryMap);
    const categoryData = Object.values(categoryMap);

    // --- Bar Chart Data (daily totals) ---
    const dailyMap = {};
    allExpenses.forEach(exp => {
      // Format date like "Sep 07"
      const day = (exp.date || exp.createdAt).toISOString().split("T")[0];
      dailyMap[day] = (dailyMap[day] || 0) + exp.amount;
    });

    // Sort dates for chart (ascending)
    const sortedDates = Object.keys(dailyMap).sort((a, b) => new Date(a) - new Date(b));
    const dailyLabels = sortedDates.map(d =>
      new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    );
    const dailyData = sortedDates.map(d => dailyMap[d]);

    res.render("dashboard", {
      recentExpenses,
      categoryLabels,
      categoryData,
      dailyLabels,
      dailyData,
      pagination: { page, pages }
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
