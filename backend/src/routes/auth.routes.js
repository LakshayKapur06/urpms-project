const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { attachUser, JWT_SECRET, requireRole } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/security");
const { isValidEmail, isNonEmptyString } = require("../utils/validation");

const router = express.Router();

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyFn: (req) => `${req.ip}:${String(req.body?.email || "").trim().toLowerCase()}`,
});

function signToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "8h" },
  );
}

router.post(
  "/register",
  attachUser,
  async (req, res, next) => {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }

    if (!isNonEmptyString(password) || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    try {
      const [countResults] = await db.query("SELECT COUNT(*) AS userCount FROM users");
      const userCount = countResults[0]?.userCount || 0;

      if (userCount > 0) {
        return requireRole("ADMIN")(req, res, next);
      }

      return next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to check registration state" });
    }
  },
  async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const hash = await bcrypt.hash(password, 12);

      await db.query(
        "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
        [normalizedEmail, hash, "ADMIN"],
      );

      return res.status(201).json({ message: "User created" });
    } catch (err) {
      console.error(err);

      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "User already exists" });
      }

      return res.status(500).json({ error: "Unable to create user" });
    }
  },
);

router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!isValidEmail(normalizedEmail) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [results] = await db.query(
      "SELECT user_id, email, password_hash, role FROM users WHERE email = ?",
      [normalizedEmail],
    );

    if (!results || results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = results[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
