const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req, res) => {
  try {
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

    const [results] = await db.query(query);
    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
