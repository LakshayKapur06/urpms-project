const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

// GET archived candidates
router.get("/candidates", async (req, res) => {
  try {
    const query = `
      SELECT *
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

// GET archived applications
router.get("/applications", async (req, res) => {
  try {
    const query = `
      SELECT
        a.application_id,
        a.candidate_id,
        a.job_role,
        a.status,
        a.archived_stage,
        a.applied_at,
        c.first_name,
        c.last_name,
        c.email
      FROM application a
      JOIN candidate c ON c.candidate_id = a.candidate_id
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
  try {
    const [result] = await db.query("UPDATE candidate SET is_archived = FALSE WHERE candidate_id = ?", [candidate_id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Candidate not found" });
    return res.json({ message: "Candidate restored successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to restore candidate" });
  }
});

// POST restore application
router.post("/applications/:id/restore", requireRole("ADMIN"), async (req, res) => {
  const application_id = Number(req.params.id);
  try {
    // Restore application to APPLIED and wipe feedback
    await db.query("UPDATE application SET is_archived = FALSE, status = 'APPLIED', archived_stage = NULL WHERE application_id = ?", [application_id]);
    await db.query("DELETE FROM interview_feedback WHERE application_id = ?", [application_id]);
    
    // Log the restore in status history
    await db.query("INSERT INTO status_history (application_id, old_status, new_status) VALUES (?, 'ARCHIVED', 'APPLIED')", [application_id]);

    return res.json({ message: "Application restored to APPLIED stage and previous feedback wiped." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to restore application" });
  }
});

module.exports = router;
