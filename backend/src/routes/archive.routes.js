const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { isPositiveInteger } = require("../utils/validation");

const router = express.Router();

router.use(authenticateToken);

// GET archived candidates
router.get("/candidates", async (req, res) => {
  try {
    const query = `
      SELECT
        candidate_id,
        first_name,
        last_name,
        email,
        phone,
        college_name,
        degree,
        specialization,
        cgpa,
        experience_years,
        skills,
        job_role,
        created_at
      FROM candidate
      WHERE is_archived = TRUE
      ORDER BY created_at DESC
    `;
    const [results] = await db.query(query);
    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch archived candidates" });
  }
});

// GET archived applications (with full detail for auditing)
router.get("/applications", async (req, res) => {
  try {
    const query = `
      SELECT
        a.application_id,
        a.candidate_id,
        a.job_role,
        a.status,
        a.archived_stage,
        a.expected_salary,
        a.notice_period,
        a.application_source,
        a.applied_at,
        a.interview_date,
        a.interviewer_name,
        c.first_name,
        c.last_name,
        c.email,
        c.cgpa,
        c.experience_years,
        c.specialization,
        f.technical_score,
        f.communication_score,
        f.overall_score,
        f.remarks AS feedback_remarks
      FROM application a
      JOIN candidate c ON c.candidate_id = a.candidate_id
      LEFT JOIN (
        SELECT f1.*
        FROM interview_feedback f1
        INNER JOIN (
          SELECT application_id, MAX(feedback_id) AS latest_feedback_id
          FROM interview_feedback
          GROUP BY application_id
        ) latest ON latest.latest_feedback_id = f1.feedback_id
      ) f ON f.application_id = a.application_id
      WHERE a.is_archived = TRUE
      ORDER BY a.applied_at DESC
    `;
    const [results] = await db.query(query);
    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch archived applications" });
  }
});

// POST restore candidate
router.post("/candidates/:id/restore", requireRole("ADMIN"), async (req, res) => {
  const candidate_id = Number(req.params.id);

  if (!isPositiveInteger(candidate_id)) {
    return res.status(400).json({ error: "Invalid candidate id" });
  }

  try {
    // Only restore if actually archived
    const [result] = await db.query(
      "UPDATE candidate SET is_archived = FALSE WHERE candidate_id = ? AND is_archived = TRUE",
      [candidate_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Archived candidate not found" });
    }
    return res.json({ message: "Candidate restored successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to restore candidate" });
  }
});

// POST restore application
router.post("/applications/:id/restore", requireRole("ADMIN"), async (req, res) => {
  const application_id = Number(req.params.id);

  if (!isPositiveInteger(application_id)) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  try {
    // Verify it is actually archived before restoring
    const [check] = await db.query(
      "SELECT application_id FROM application WHERE application_id = ? AND is_archived = TRUE",
      [application_id]
    );
    if (check.length === 0) {
      return res.status(404).json({ error: "Archived application not found" });
    }

    // Restore application to APPLIED and wipe feedback
    await db.query(
      "UPDATE application SET is_archived = FALSE, status = 'APPLIED', archived_stage = NULL WHERE application_id = ?",
      [application_id]
    );
    await db.query("DELETE FROM interview_feedback WHERE application_id = ?", [application_id]);

    // Log the restore in status history
    await db.query(
      "INSERT INTO status_history (application_id, old_status, new_status) VALUES (?, 'ARCHIVED', 'APPLIED')",
      [application_id]
    );

    return res.json({ message: "Application restored to APPLIED stage and previous feedback wiped." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to restore application" });
  }
});

module.exports = router;
