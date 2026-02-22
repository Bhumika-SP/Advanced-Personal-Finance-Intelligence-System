const router = require("express").Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// ============================
// 📌 Signup
// ============================
router.post("/create", async (req, res) => {
  try {
    const { name, email, password, confirmpassword } = req.body;

    if (!name || !email || !password || !confirmpassword) {
      return res.send("All fields are required");
    }
    if (password !== confirmpassword) {
      return res.send("Passwords do not match");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.send("User already exists with this email");

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hash });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "30d"
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });

    res.redirect("/dashboard");
  } catch (err) {
    console.error("SIGNUP ERROR:", err.message);
    res.send("Something went wrong during signup");
  }
});

// ============================
// 📌 Login
// ============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.send("Email and password are required");

    const user = await User.findOne({ email });
    if (!user) return res.send("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send("Invalid credentials");

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "30d"
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });

    res.redirect("/dashboard");
  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.send("Something went wrong during login");
  }
});

// 📌 Logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

module.exports = router;
