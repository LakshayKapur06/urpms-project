const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/metrics", (req, res) => {
  const queries = {
    candidatesByStage: `
      SELECT status, COUNT(*) AS count
      FROM application GROUP BY status
    `,
    conversionRate: `
      SELECT 
        (COUNT(CASE WHEN status = 'HIRED' THEN 1 END) * 100.0) / COUNT(*) 
        AS conversion_rate
      FROM application
    `,
    employeesPerDept: `
      SELECT department, COUNT(*) AS total
      FROM employee GROUP BY department
    `
  };

  const results = {};

  db.query(queries.candidatesByStage, (err, data1) => {
    if (err) return res.status(500).json(err);
    results.candidatesByStage = data1;

    db.query(queries.conversionRate, (err, data2) => {
      if (err) return res.status(500).json(err);
      results.conversionRate = data2[0];

      db.query(queries.employeesPerDept, (err, data3) => {
        if (err) return res.status(500).json(err);
        results.employeesPerDept = data3;

        res.json(results);
      });
    });
  });
});

module.exports = router;