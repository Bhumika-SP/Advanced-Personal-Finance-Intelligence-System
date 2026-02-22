const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Expense = require("../models/Expense");

function normalizeVendor(desc = "") {
  const d = String(desc).toLowerCase();
  const cleaned = d.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const stop = new Set(["payment","upi","to","from","transfer","bank","debit","credit","card","txn","order","purchase","at","the"]);
  const tokens = cleaned.split(" ").filter(t => t && !stop.has(t) && !/^\d+$/.test(t));
  return tokens.slice(0, 2).join(" ");
}

function isMonthlyCadence(dates) {
  if (dates.length < 3) return false;
  const diffs = [];
  for (let i = 1; i < dates.length; i++) {
    const ms = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    diffs.push(ms);
  }
  const avg = diffs.reduce((a,b)=>a+b,0)/diffs.length;
  return avg > 25 && avg < 35;
}

function lowVariance(nums) {
  if (nums.length < 3) return false;
  const avg = nums.reduce((a,b)=>a+b,0)/nums.length;
  const variance = nums.reduce((a,v)=>a+Math.pow(v-avg,2),0)/nums.length;
  const std = Math.sqrt(variance);
  return std <= Math.max(50, avg * 0.15);
}

router.get("/", auth, async (req, res) => {
  try {
    const monthsBack = 6;
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - monthsBack);

    const items = await Expense.find({ user: req.userId, date: { $gte: start, $lte: end } }).sort({ date: 1 });

    const byVendor = new Map();
    for (const e of items) {
      const vendor = normalizeVendor(e.description);
      if (!vendor) continue;
      if (!byVendor.has(vendor)) byVendor.set(vendor, []);
      byVendor.get(vendor).push(e);
    }

    const subs = [];
    for (const [vendor, rows] of byVendor.entries()) {
      if (rows.length < 3) continue;
      const dates = rows.map(r => new Date(r.date)).sort((a,b)=>a-b);
      const amounts = rows.map(r => r.amount);
      const monthly = isMonthlyCadence(dates);
      const stable = lowVariance(amounts);
      if (!(monthly || stable)) continue;
      const total = rows.reduce((a,r)=>a+r.amount,0);
      const avg = total / rows.length;
      const lastDate = dates[dates.length - 1];
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      subs.push({
        vendor,
        count: rows.length,
        avgAmount: Math.round(avg),
        total,
        lastDate,
        nextDate,
        category: rows[rows.length - 1].category
      });
    }

    subs.sort((a,b)=> b.total - a.total);
    res.render("subscriptions", { subs });
  } catch (e) {
    console.error("SUBSCRIPTIONS ERROR:", e.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
