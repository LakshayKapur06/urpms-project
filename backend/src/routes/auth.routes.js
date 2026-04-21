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
  (req, res, next) => {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }

    if (!isNonEmptyString(password) || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    db.query("SELECT COUNT(*) AS userCount FROM users", async (countErr, countResults) => {
      if (countErr) {
        console.error(countErr);
        return res.status(500).json({ error: "Failed to check registration state" });
      }

      const userCount = countResults[0]?.userCount || 0;

      if (userCount > 0) {
        return requireRole("ADMIN")(req, res, next);
      }

      return next();
    });
  },
  async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const hash = await bcrypt.hash(password, 12);

      db.query(
        "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
        [normalizedEmail, hash, "ADMIN"],
        (err) => {
          if (err) {
            console.error(err);

            if (err.code === "ER_DUP_ENTRY") {
              return res.status(409).json({ error: "User already exists" });
            }

            return res.status(500).json({ error: "Unable to create user" });
          }

          return res.status(201).json({ message: "User created" });
        },
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to create user" });
    }
  },
);

router.post("/login", loginLimiter, (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!isValidEmail(normalizedEmail) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  db.query(
    "SELECT user_id, email, password_hash, role FROM users WHERE email = ?",
    [normalizedEmail],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Login failed" });
      }

      if (!results || results.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = results[0];

      try {
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
      } catch (compareError) {
        console.error(compareError);
        return res.status(500).json({ error: "Login failed" });
      }
    },
  );
});

module.exports = router;
