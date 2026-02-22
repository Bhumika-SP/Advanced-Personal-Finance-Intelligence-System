const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  type: { type: String, enum: ["overspend", "anomaly", "bill_due", "subscription_due"], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  meta: { type: Object, default: {} },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Alert", alertSchema);
