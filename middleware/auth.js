const jwt = require("jsonwebtoken");
const JWT_SECRET = "secret"; // must match everywhere

function auth(req, res, next) {
  try {
    // Check cookie first
    const token = req.cookies.token;

    if (!token) {
      return res.redirect("/login");
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    res.clearCookie("token");
    return res.redirect("/login");
  }
}

module.exports = auth;
