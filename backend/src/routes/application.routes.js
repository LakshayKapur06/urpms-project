const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { isNonNegativeNumber, isPositiveInteger } = require("../utils/validation");

const router = express.Router();

router.use(authenticateToken);

router.get("/", (req, res) => {
  db.query("SELECT * FROM application", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.json(results);
  });
});

router.post("/", requireRole("ADMIN"), (req, res) => {
  const { candidate_id, job_id } = req.body;

  if (!isPositiveInteger(candidate_id) || !isPositiveInteger(job_id)) {
    return res.status(400).json({ error: "candidate_id and job_id must be positive integers" });
  }

  const query = `
    INSERT INTO application (candidate_id, job_id)
    VALUES (?, ?)
  `;

  db.query(query, [Number(candidate_id), Number(job_id)], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.status(201).json({
      message: "Application created",
      application_id: result.insertId,
    });
  });
});

router.put("/:id/status", requireRole("ADMIN"), (req, res) => {
  const application_id = Number(req.params.id);
  const { new_status } = req.body;

  if (!isPositiveInteger(application_id)) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  if (typeof new_status !== "string" || !new_status.trim()) {
    return res.status(400).json({ error: "new_status is required" });
  }

  const nextStatus = new_status.trim().toUpperCase();

  db.query(
    "SELECT status FROM application WHERE application_id = ?",
    [application_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "DB error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Application not found" });
      }

      const current_status = result[0].status;
      const validTransitions = {
        APPLIED: ["SCREENING"],
        SCREENING: ["SHORTLISTED"],
        SHORTLISTED: ["INTERVIEWED"],
        INTERVIEWED: ["OFFERED"],
        OFFERED: ["HIRED"],
      };

      if (nextStatus !== "REJECTED" && !validTransitions[current_status]?.includes(nextStatus)) {
        return res.status(400).json({ error: "Invalid status transition" });
      }

      db.query(
        "UPDATE application SET status = ? WHERE application_id = ?",
        [nextStatus, application_id],
        (updateErr) => {
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({ error: "Update failed" });
          }

          const historyQuery = `
            INSERT INTO status_history (application_id, old_status, new_status)
            VALUES (?, ?, ?)
          `;

          db.query(historyQuery, [application_id, current_status, nextStatus], (historyErr) => {
            if (historyErr) {
              console.error(historyErr);
              return res.status(500).json({ error: "History insert failed" });
            }

            return res.json({
              message: "Status updated",
              from: current_status,
              to: nextStatus,
            });
          });
        },
      );
    },
  );
});

router.post("/:id/hire", requireRole("ADMIN"), (req, res) => {
  const application_id = Number(req.params.id);
  const { base_salary, bonus } = req.body;

  if (!isPositiveInteger(application_id)) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  if (!isNonNegativeNumber(base_salary) || !isNonNegativeNumber(bonus)) {
    return res.status(400).json({ error: "base_salary and bonus must be non-negative numbers" });
  }

  db.query("CALL hire_candidate(?, ?, ?)", [application_id, Number(base_salary), Number(bonus)], (err) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ error: "Hire operation failed" });
    }

    return res.json({
      message: "Candidate hired successfully",
    });
  });
});

module.exports = router;
