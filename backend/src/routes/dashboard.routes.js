const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

router.get("/metrics", (req, res) => {
  const queries = {
    candidatesByStage: `
      SELECT status, COUNT(*) AS count
      FROM application GROUP BY status
    `,
    conversionRate: `
      SELECT
        COALESCE((COUNT(CASE WHEN status = 'HIRED' THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0), 0)
        AS conversion_rate
      FROM application
    `,
    employeesPerDept: `
      SELECT department, COUNT(*) AS total
      FROM employee GROUP BY department
    `,
  };

  const results = {};

  db.query(queries.candidatesByStage, (err, data1) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to load dashboard metrics" });
    }

    results.candidatesByStage = data1;

    db.query(queries.conversionRate, (conversionErr, data2) => {
      if (conversionErr) {
        console.error(conversionErr);
        return res.status(500).json({ error: "Failed to load dashboard metrics" });
      }

      results.conversionRate = data2[0];

      db.query(queries.employeesPerDept, (departmentErr, data3) => {
        if (departmentErr) {
          console.error(departmentErr);
          return res.status(500).json({ error: "Failed to load dashboard metrics" });
        }

        results.employeesPerDept = data3;
        return res.json(results);
      });
    });
  });
});

module.exports = router;
