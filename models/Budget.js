const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: [1, "Amount must be greater than 0"] },
  period: { type: String, required: true },
  rollover: { type: Boolean, default: false },
  alertsOn: { type: Boolean, default: true }
}, { timestamps: true });

budgetSchema.index({ user: 1, category: 1, period: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
