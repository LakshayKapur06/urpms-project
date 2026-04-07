const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Add candidate
router.post("/", (req, res) => {
  const { first_name, last_name, email, phone } = req.body;

  const query = `
    INSERT INTO candidate (first_name, last_name, email, phone)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [first_name, last_name, email, phone], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      message: "Candidate added successfully",
      candidate_id: result.insertId
    });
  });
});

// Get all candidates
router.get("/", (req, res) => {
  const query = "SELECT * FROM candidate";

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

module.exports = router;