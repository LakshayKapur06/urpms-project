const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

router.get("/", (req, res) => {
  const query = `
    SELECT
      e.employee_id,
      e.candidate_id,
      e.department,
      e.joining_date,
      c.first_name,
      c.last_name,
      c.email
    FROM employee e
    LEFT JOIN candidate c ON c.candidate_id = e.candidate_id
    ORDER BY e.employee_id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.json(results);
  });
});

module.exports = router;
