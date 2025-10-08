


const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const auth = require("../middleware/auth");

// -----------------------------
// 📌 Show "Add Expense" Form
// -----------------------------
router.get("/new", auth, (req, res) => {
  res.render("expense_form", { expense: null });
});

// -----------------------------
// 📌 Add Expense
// -----------------------------
router.post("/", auth, async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;

    if (!amount || !category || !description) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const expense = new Expense({
      amount,
      category,
      description,
      date: date || Date.now(),
      user: req.userId, // ✅ comes from auth middleware
    });

    await expense.save();

    // API request → JSON
    if (req.headers["content-type"] === "application/json") {
      return res.status(201).json(expense);
    }

    // Browser request → redirect
    res.redirect("/expenses");
  } catch (err) {
    console.error("EXPENSE CREATE ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------
// 📌 Get Expenses (filters + pagination)
// -----------------------------
// router.get("/", auth, async (req, res) => {
//   try {
//     const { category, minAmount, maxAmount, startDate, endDate, page = 1, limit = 5 } = req.query;
//     const query = { user: req.userId };

//     if (category) query.category = category;
//     if (minAmount) query.amount = { ...query.amount, $gte: Number(minAmount) };
//     if (maxAmount) query.amount = { ...query.amount, $lte: Number(maxAmount) };
//     if (startDate || endDate) {
//       query.date = {};
//       if (startDate) query.date.$gte = new Date(startDate);
//       if (endDate) query.date.$lte = new Date(endDate);
//     }

//     const total = await Expense.countDocuments(query);
//     const expenses = await Expense.find(query)
//       .sort({ date: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit));

//     // API request → JSON
//     if (req.headers["content-type"] === "application/json") {
//       return res.json({
//         expenses,
//         pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
//       });
//     }

//     // Browser request → render EJS
//     res.render("expenses", {
//       expenses,
//       filter: req.query,
//       pagination: { page: Number(page), pages: Math.ceil(total / limit) },
//     });
//   } catch (err) {
//     console.error("FETCH EXPENSES ERROR:", err.message);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// -----------------------------
// 📌 Get All Expenses (no pagination)
// -----------------------------
router.get("/", auth, async (req, res) => {
  try {
    const { category, minAmount, maxAmount, startDate, endDate } = req.query;
    const query = { user: req.userId };

    if (category) query.category = category;
    if (minAmount) query.amount = { ...query.amount, $gte: Number(minAmount) };
    if (maxAmount) query.amount = { ...query.amount, $lte: Number(maxAmount) };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    // API request → JSON
    if (req.headers["content-type"] === "application/json") {
      return res.json({ expenses });
    }

    // Browser request → render EJS
    res.render("expenses", { expenses, filter: req.query });
  } catch (err) {
    console.error("FETCH EXPENSES ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// -----------------------------
// 📌 Show Edit Form
// -----------------------------
router.get("/edit/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.userId });
    if (!expense) return res.status(404).send("Expense not found");

    res.render("expense_form", { expense });
  } catch (err) {
    console.error("EDIT EXPENSE ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------
// 📌 Update Expense
// -----------------------------
router.post("/edit/:id", auth, async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;

    if (amount && amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { amount, category, description, date },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // API request → JSON
    if (req.headers["content-type"] === "application/json") {
      return res.json(expense);
    }

    // Browser request → redirect
    res.redirect("/expenses");
  } catch (err) {
    console.error("EXPENSE UPDATE ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------
// 📌 Delete Expense
// -----------------------------
router.post("/delete/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.userId });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // API request → JSON
    if (req.headers["content-type"] === "application/json") {
      return res.json({ message: "Expense deleted successfully" });
    }

    // Browser request → redirect
    res.redirect("/expenses");
  } catch (err) {
    console.error("DELETE EXPENSE ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
