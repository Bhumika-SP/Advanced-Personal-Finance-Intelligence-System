const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Alert = require("../models/Alert");

router.get("/", auth, async (req, res) => {
  const alerts = await Alert.find({ user: req.userId }).sort({ createdAt: -1 }).limit(200);
  res.render("alerts", { alerts });
});

router.post("/:id/read", auth, async (req, res) => {
  await Alert.updateOne({ _id: req.params.id, user: req.userId }, { $set: { read: true } });
  res.redirect("/alerts");
});

router.post("/read-all", auth, async (req, res) => {
  await Alert.updateMany({ user: req.userId, read: false }, { $set: { read: true } });
  res.redirect("/alerts");
});

module.exports = router;
