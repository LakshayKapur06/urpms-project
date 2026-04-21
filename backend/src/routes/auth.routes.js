const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = "secretkey";

// Register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
    [email, hash, "ADMIN"],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "User created" });
    }
  );
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (results.length === 0) return res.status(401).json({ error: "Invalid" });

      const user = results[0];

      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) return res.status(401).json({ error: "Invalid" });

      const token = jwt.sign({ user_id: user.user_id }, SECRET);

      res.json({ token });
    }
  );
});

module.exports = router;