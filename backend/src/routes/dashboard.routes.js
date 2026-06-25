const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

router.get("/metrics", async (req, res) => {
  try {
    // Run all three queries in parallel for better performance
    const [candidatesByStage, conversionRate, employeesPerDept] = await Promise.all([
      db.query(`
        SELECT status, COUNT(*) AS count
        FROM application WHERE is_archived = FALSE GROUP BY status
      `),
      db.query(`
        SELECT
          COALESCE((COUNT(CASE WHEN status = 'HIRED' THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0), 0)
          AS conversion_rate
        FROM application WHERE is_archived = FALSE
      `),
      db.query(`
        SELECT department, COUNT(*) AS total
        FROM employee GROUP BY department
      `),
    ]);

    return res.json({
      candidatesByStage: candidatesByStage[0],
      conversionRate: conversionRate[0][0],
      employeesPerDept: employeesPerDept[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load dashboard metrics" });
  }
});

module.exports = router;
