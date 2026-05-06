const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  isNonEmptyString,
  isNonNegativeNumber,
  isPositiveInteger,
} = require("../utils/validation");

const router = express.Router();

router.use(authenticateToken);

router.get("/", (req, res) => {
  const { minScore } = req.query;
  const params = [];
  let scoreFilter = "";

  if (minScore !== undefined && minScore !== "") {
    if (!isNonNegativeNumber(minScore)) {
      return res.status(400).json({ error: "minScore must be a non-negative number" });
    }
    scoreFilter = "WHERE COALESCE(feedback.overall_score, 0) >= ?";
    params.push(Number(minScore));
  }

  const query = `
    SELECT
      a.application_id,
      a.candidate_id,
      a.job_role,
      a.expected_salary,
      a.notice_period,
      a.application_source,
      a.status,
      a.applied_at,
      c.first_name,
      c.last_name,
      c.email,
      c.phone,
      c.degree,
      c.specialization,
      c.cgpa,
      c.experience_years,
      feedback.technical_score,
      feedback.communication_score,
      feedback.overall_score,
      feedback.remarks
    FROM application a
    JOIN candidate c ON c.candidate_id = a.candidate_id
    LEFT JOIN (
      SELECT
        application_id,
        MAX(technical_score) AS technical_score,
        MAX(communication_score) AS communication_score,
        MAX(overall_score) AS overall_score,
        MAX(remarks) AS remarks
      FROM interview_feedback
      GROUP BY application_id
    ) feedback ON feedback.application_id = a.application_id
    ${scoreFilter}
    ORDER BY a.applied_at DESC, a.application_id DESC
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.json(results);
  });
});

router.get("/filter", (req, res) => {
  const { minCgpa = 0, minExp = 0, maxSalary = 999999999, minScore } = req.query;

  if (!isNonNegativeNumber(minCgpa) || !isNonNegativeNumber(minExp) || !isNonNegativeNumber(maxSalary)) {
    return res.status(400).json({ error: "Filter values must be non-negative numbers" });
  }

  if (minScore !== undefined && minScore !== "" && !isNonNegativeNumber(minScore)) {
    return res.status(400).json({ error: "minScore must be a non-negative number" });
  }

  db.query(
    "CALL filter_candidates(?, ?, ?)",
    [Number(minCgpa), Number(minExp), Number(maxSalary)],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to filter applications" });
      }

      const filtered = results[0] || [];

      if (!filtered.length) {
        return res.json([]);
      }

      const applicationIds = filtered.map((row) => row.application_id);
      const placeholders = applicationIds.map(() => "?").join(", ");
      const feedbackQuery = `
        SELECT
          application_id,
          MAX(technical_score) AS technical_score,
          MAX(communication_score) AS communication_score,
          MAX(overall_score) AS overall_score,
          MAX(remarks) AS remarks
        FROM interview_feedback
        WHERE application_id IN (${placeholders})
        GROUP BY application_id
      `;

      db.query(feedbackQuery, applicationIds, (feedbackErr, feedbackRows) => {
        if (feedbackErr) {
          console.error(feedbackErr);
          return res.status(500).json({ error: "Failed to load interview feedback" });
        }

        const feedbackMap = new Map(
          feedbackRows.map((row) => [row.application_id, row]),
        );

        const merged = filtered.map((row) => ({
          ...row,
          ...(feedbackMap.get(row.application_id) || {}),
        }));

        const scoreThreshold =
          minScore === undefined || minScore === "" ? null : Number(minScore);

        return res.json(
          scoreThreshold === null
            ? merged
            : merged.filter((row) => Number(row.overall_score || 0) >= scoreThreshold),
        );
      });
    },
  );
});

router.post("/", requireRole("ADMIN"), (req, res) => {
  const {
    candidate_id,
    job_role,
    expected_salary,
    notice_period,
    application_source,
  } = req.body;

  if (!isPositiveInteger(candidate_id)) {
    return res.status(400).json({ error: "candidate_id must be a positive integer" });
  }

  if (!isNonEmptyString(job_role, 100)) {
    return res.status(400).json({ error: "job_role is required" });
  }

  if (
    expected_salary !== undefined &&
    expected_salary !== null &&
    expected_salary !== "" &&
    !isNonNegativeNumber(expected_salary)
  ) {
    return res.status(400).json({ error: "expected_salary must be a non-negative number" });
  }

  if (
    notice_period !== undefined &&
    notice_period !== null &&
    notice_period !== "" &&
    !isNonNegativeNumber(notice_period)
  ) {
    return res.status(400).json({ error: "notice_period must be a non-negative number" });
  }

  const query = `
    INSERT INTO application (
      candidate_id,
      job_role,
      expected_salary,
      notice_period,
      application_source
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      Number(candidate_id),
      job_role.trim(),
      expected_salary === "" || expected_salary === undefined || expected_salary === null
        ? null
        : Number(expected_salary),
      notice_period === "" || notice_period === undefined || notice_period === null
        ? null
        : Number(notice_period),
      application_source?.trim() || null,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }

      return res.status(201).json({
        message: "Application created",
        application_id: result.insertId,
      });
    },
  );
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

      const current_status = String(result[0].status || "").toUpperCase();
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

          return res.json({
            message: "Status updated",
            from: current_status,
            to: nextStatus,
          });
        },
      );
    },
  );
});

router.post("/:id/hire", requireRole("ADMIN"), (req, res) => {
  const application_id = Number(req.params.id);
  const { department, base_salary, bonus_percentage } = req.body;

  if (!isPositiveInteger(application_id)) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  if (!isNonEmptyString(department, 100)) {
    return res.status(400).json({ error: "department is required" });
  }

  if (!isNonNegativeNumber(base_salary) || !isNonNegativeNumber(bonus_percentage)) {
    return res.status(400).json({ error: "base_salary and bonus_percentage must be non-negative numbers" });
  }

  db.query(
    "CALL hire_candidate(?, ?, ?, ?)",
    [application_id, department.trim(), Number(base_salary), Number(bonus_percentage)],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(400).json({ error: err.sqlMessage || "Hire operation failed" });
      }

      return res.json({
        message: "Candidate hired successfully",
        application_id,
        status: "HIRED",
      });
    },
  );
});

router.delete("/:id", requireRole("ADMIN"), (req, res) => {
  const application_id = Number(req.params.id);

  if (!isPositiveInteger(application_id)) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  db.query(
    "DELETE FROM interview_feedback WHERE application_id = ?",
    [application_id],
    (feedbackErr) => {
      if (feedbackErr) {
        console.error(feedbackErr);
        return res.status(500).json({ error: "Failed to remove application feedback" });
      }

      db.query(
        "DELETE FROM status_history WHERE application_id = ?",
        [application_id],
        (historyErr) => {
          if (historyErr) {
            console.error(historyErr);
            return res.status(500).json({ error: "Failed to remove application history" });
          }

          db.query(
            "DELETE FROM application WHERE application_id = ?",
            [application_id],
            (err, result) => {
              if (err) {
                console.error(err);
                return res.status(400).json({ error: err.sqlMessage || "Failed to remove application" });
              }

              if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Application not found" });
              }

              return res.json({ message: "Application removed from pipeline" });
            },
          );
        },
      );
    },
  );
});

module.exports = router;
