const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const auth = require("../middleware/auth");

router.get("/dashboard", auth, async (req, res) => {
  try {
    const month = req.query.month; // YYYY-MM
    let dateFilter = {};
    let range = { start: null, end: null };
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
      dateFilter = { date: { $gte: start, $lte: end } };
      range = { start, end };
    }
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // 🔹 Total count for pagination
    const totalExpenses = await Expense.countDocuments({ user: req.userId, ...dateFilter });
    const pages = Math.ceil(totalExpenses / limit) || 1;

    // 🔹 Recent expenses (table)
    const recentExpenses = await Expense.find({ user: req.userId, ...dateFilter })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 🔹 All expenses (for charts only)
    const allExpenses = await Expense.find({ user: req.userId, ...dateFilter });

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

    const totals = dailyData;
    const mean = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
    const variance = totals.length ? totals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / totals.length : 0;
    const std = Math.sqrt(variance);
    const threshold = mean + 2 * std;
    const anomalies = sortedDates
      .map((d, i) => ({ date: d, amount: dailyData[i] }))
      .filter(x => x.amount > threshold)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(x => ({
        label: new Date(x.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        amount: x.amount
      }));

    const topCategories = Object.entries(categoryMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    res.render("dashboard", {
      recentExpenses,
      categoryLabels,
      categoryData,
      dailyLabels,
      dailyData,
      dailyKeys: sortedDates,
      insights: { topCategories, anomalies, mean, std },
      month: month || "",
      range,
      pagination: { page, pages }
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
