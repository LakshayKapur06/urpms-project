const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

router.get("/", (req, res) => {
  db.query("SELECT * FROM employee", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.json(results);
  });
});

module.exports = router;
