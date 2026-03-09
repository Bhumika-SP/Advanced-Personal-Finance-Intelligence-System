const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/track_expense`;

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err.message));

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model("User", userSchema);
