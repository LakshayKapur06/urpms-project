const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const { isValidEmail, isNonEmptyString } = require("../utils/validation");

const router = express.Router();

router.use(authenticateToken);

router.post("/", (req, res) => {
  const { first_name, last_name, email, phone } = req.body;

  if (!isNonEmptyString(first_name, 100) || !isNonEmptyString(last_name, 100)) {
    return res.status(400).json({ error: "First and last name are required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  if (!isNonEmptyString(phone, 30)) {
    return res.status(400).json({ error: "A valid phone number is required" });
  }

  const query = `
    INSERT INTO candidate (first_name, last_name, email, phone)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    query,
    [first_name.trim(), last_name.trim(), email.trim().toLowerCase(), phone.trim()],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }

      return res.status(201).json({
        message: "Candidate added successfully",
        candidate_id: result.insertId,
      });
    },
  );
});

router.get("/", (req, res) => {
  db.query("SELECT * FROM candidate", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.json(results);
  });
});

module.exports = router;
