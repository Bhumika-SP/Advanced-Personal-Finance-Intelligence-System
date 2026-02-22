const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { suggestCategory } = require("../services/ai");

router.post("/categorize", auth, async (req, res) => {
  try {
    const { description, amount, candidates } = req.body || {};
    if (!description && !amount) {
      return res.status(400).json({ error: "description or amount required" });
    }
    const result = await suggestCategory({ description, amount, candidates });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "server_error" });
  }
});

module.exports = router;
