


const express = require("express");
const router = express.Router();
const Income = require("../models/Income");
const auth = require("../middleware/auth");

// ➝ Show all income (EJS page)
router.get("/", auth, async (req, res) => {
    try {
        const incomes = await Income.find({ user: req.user.id }).sort({ date: -1 });
        res.render("income", { incomes });  // render income.ejs
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// ➝ Show add income form
router.get("/new", auth, (req, res) => {
    res.render("income_form", { income: null });
});

// ➝ Add new income
router.post("/", auth, async (req, res) => {
    try {
        const { amount, source, description } = req.body;

        const income = new Income({
            amount,
            source,
            description,
            user: req.user.id
        });

        await income.save();
        res.redirect("/income"); // redirect back to income list
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// ➝ Show edit income form
router.get("/edit/:id", auth, async (req, res) => {
    try {
        const income = await Income.findOne({ _id: req.params.id, user: req.user.id });

        if (!income) {
            return res.status(404).send("Income not found");
        }

        res.render("income_form", { income });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// ➝ Update income
router.post("/edit/:id", auth, async (req, res) => {
    try {
        const { amount, source, description } = req.body;

        await Income.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { amount, source, description }
        );

        res.redirect("/income");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// ➝ Delete income
router.post("/delete/:id", auth, async (req, res) => {
    try {
        await Income.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.redirect("/income");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

module.exports = router;
