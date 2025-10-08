


const express = require("express");
const router = express.Router();
const Trip = require("../models/Trips");
const auth = require("../middleware/auth");

// ➝ Render trips list
router.get("/", auth, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user.id }).sort({ startDate: -1 });
    res.render("trips", { trips });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ➝ Render new trip form
router.get("/new", auth, (req, res) => {
  res.render("trips_form", { trip: null });
});

// ➝ Render edit trip form
router.get("/edit/:id", auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user.id });
    if (!trip) return res.status(404).send("Trip not found");
    res.render("trips_form", { trip });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ➝ Add new trip
router.post("/", auth, async (req, res) => {
  try {
    const { title, destination, budget, startDate, endDate } = req.body;
    const trip = new Trip({
      title,
      destination,
      budget,
      startDate,
      endDate,
      user: req.user.id,
    });
    await trip.save();
    res.redirect("/trips");
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
});

// ➝ Update trip
router.post("/edit/:id", auth, async (req, res) => {
  try {
    await Trip.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    res.redirect("/trips");
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
});

// ➝ Delete trip
router.post("/delete/:id", auth, async (req, res) => {
  try {
    await Trip.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.redirect("/trips");
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
