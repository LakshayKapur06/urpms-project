const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  isNonEmptyString,
  isNonNegativeNumber,
  isNumberInRange,
  isPositiveInteger,
} = require("../utils/validation");

const router = express.Router();

router.use(authenticateToken);

const validTransitions = {
  APPLIED: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["INTERVIEW_SCHEDULED", "REJECTED"],
  INTERVIEW_SCHEDULED: ["INTERVIEWED", "REJECTED"],
  INTERVIEWED: ["OFFERED", "REJECTED"],
  OFFERED: ["HIRED", "REJECTED"],
};

async function getApplicationById(application_id) {
  const [rows] = await db.query(
    "SELECT application_id, status FROM application WHERE application_id = ?",
    [application_id],
  );
  return rows[0] || null;
}

function latestFeedbackJoin() {
  return `
    LEFT JOIN (
      SELECT f1.*
      FROM interview_feedback f1
      INNER JOIN (
        SELECT application_id, MAX(feedback_id) AS latest_feedback_id
        FROM interview_feedback
        GROUP BY application_id
      ) latest
        ON latest.latest_feedback_id = f1.feedback_id
    ) feedback ON feedback.application_id = a.application_id
  `;
}

async function getApplicationDetailsById(application_id) {
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
      a.interview_date,
      a.interviewer_name,
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
    ${latestFeedbackJoin()}
    WHERE a.application_id = ? AND a.is_archived = FALSE
    LIMIT 1
  `;

  const [rows] = await db.query(query, [application_id]);
  return rows[0] || null;
}

function formatInterviewDateTime(value) {
  if (!isNonEmptyString(value, 100)) {
    return null;
  }

  return value.trim().replace("T", " ");
}

// GET all applications (with optional minScore filter)
router.get("/", async (req, res) => {
  const { minScore } = req.query;
  const params = [req.user.user_id];
  let scoreFilter = "";

  if (minScore !== undefined && minScore !== "") {
    if (!isNonNegativeNumber(minScore)) {
      return res.status(400).json({ error: "minScore must be a non-negative number" });
    }
    scoreFilter = "WHERE COALESCE(feedback.overall_score, 0) >= ?";
    params.push(Number(minScore));
  }

  try {
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
        a.interview_date,
        a.interviewer_name,
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
        feedback.remarks,
        EXISTS(SELECT 1 FROM interview_feedback WHERE application_id = a.application_id AND user_id = ?) AS user_has_feedback
      FROM application a
      JOIN candidate c ON c.candidate_id = a.candidate_id
      ${latestFeedbackJoin()}
      WHERE a.is_archived = FALSE
      ${scoreFilter ? 'AND ' + scoreFilter.replace('WHERE ', '') : ''}
      ORDER BY a.applied_at DESC, a.application_id DESC
    `;

    const [results] = await db.query(query, params);
    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
});

// GET filtered applications via stored procedure
router.get("/filter", async (req, res) => {
  const { minCgpa = 0, minExp = 0, maxSalary = 999999999, minScore } = req.query;

  if (!isNonNegativeNumber(minCgpa) || !isNonNegativeNumber(minExp) || !isNonNegativeNumber(maxSalary)) {
    return res.status(400).json({ error: "Filter values must be non-negative numbers" });
  }

  if (minScore !== undefined && minScore !== "" && !isNonNegativeNumber(minScore)) {
    return res.status(400).json({ error: "minScore must be a non-negative number" });
  }

  try {
    const [procResults] = await db.query(
      "CALL filter_candidates(?, ?, ?)",
      [Number(minCgpa), Number(minExp), Number(maxSalary)],
    );

    const filtered = (procResults[0] || []).filter(row => !row.is_archived);

    if (!filtered.length) {
      return res.json([]);
    }

    const applicationIds = filtered.map((row) => row.application_id);
    const placeholders = applicationIds.map(() => "?").join(", ");

    const feedbackQuery = `
      SELECT
        f1.application_id,
        f1.technical_score,
        f1.communication_score,
        f1.overall_score,
        f1.remarks,
        EXISTS(SELECT 1 FROM interview_feedback sub WHERE sub.application_id = f1.application_id AND sub.user_id = ?) AS user_has_feedback
      FROM interview_feedback f1
      INNER JOIN (
        SELECT application_id, MAX(feedback_id) AS latest_feedback_id
        FROM interview_feedback
        WHERE application_id IN (${placeholders})
        GROUP BY application_id
      ) latest
        ON latest.latest_feedback_id = f1.feedback_id
    `;

    const [feedbackRows] = await db.query(feedbackQuery, [req.user.user_id, ...applicationIds]);

    const feedbackMap = new Map(feedbackRows.map((row) => [row.application_id, row]));
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to filter applications" });
  }
});

// POST create application
router.post("/", requireRole("ADMIN"), async (req, res) => {
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

  try {
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

    const [result] = await db.query(query, [
      Number(candidate_id),
      job_role.trim(),
      expected_salary === "" || expected_salary === undefined || expected_salary === null
        ? null
        : Number(expected_salary),
      notice_period === "" || notice_period === undefined || notice_period === null
        ? null
        : Number(notice_period),
      application_source?.trim() || null,
    ]);

    return res.status(201).json({
      message: "Application created",
      application_id: result.insertId,
    });
  } catch (err) {
    console.error(err);

    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "Candidate not found" });
    }

    return res.status(500).json({ error: "Database error" });
  }
});

// PUT update status
router.put("/:id/status", requireRole("ADMIN"), async (req, res) => {
  const application_id = Number(req.params.id);
  const { new_status } = req.body;

  if (!isPositiveInteger(application_id)) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  if (typeof new_status !== "string" || !new_status.trim()) {
    return res.status(400).json({ error: "new_status is required" });
  }

  const nextStatus = new_status.trim().toUpperCase();

  try {
    const application = await getApplicationById(application_id);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const current_status = String(application.status || "").toUpperCase();

    if (!validTransitions[current_status]?.includes(nextStatus)) {
      return res.status(400).json({ error: "Invalid status transition" });
    }

    await db.query(
      "UPDATE application SET status = ? WHERE application_id = ?",
      [nextStatus, application_id],
    );

    let updatedApplication = null;
    try {
      updatedApplication = await getApplicationDetailsById(application_id);
    } catch (fetchErr) {
      console.error(fetchErr);
    }

    return res.json({
      message: "Status updated",
      from: current_status,
      to: nextStatus,
      application: updatedApplication,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Update failed" });
  }
});

// PUT schedule interview
router.put("/:id/schedule-interview", requireRole("ADMIN"), async (req, res) => {
  const application_id = Number(req.params.id);
  const { interview_date, interviewer_name } = req.body;

  if (!isPositiveInteger(application_id)) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  if (!isNonEmptyString(interview_date, 100) || !isNonEmptyString(interviewer_name, 100)) {
    return res.status(400).json({ error: "interview_date and interviewer_name are required" });
  }

  const normalizedInterviewDate = formatInterviewDateTime(interview_date);

  try {
    const application = await getApplicationById(application_id);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const current_status = String(application.status || "").toUpperCase();

    if (!validTransitions[current_status]?.includes("INTERVIEW_SCHEDULED")) {
      return res.status(400).json({ error: "Only shortlisted applications can be scheduled for interview" });
    }

    await db.query(
      `
        UPDATE application
        SET status = 'INTERVIEW_SCHEDULED',
            interview_date = ?,
            interviewer_name = ?
        WHERE application_id = ?
      `,
      [normalizedInterviewDate, interviewer_name.trim(), application_id],
    );

    let updatedApplication = null;
    try {
      updatedApplication = await getApplicationDetailsById(application_id);
    } catch (fetchErr) {
      console.error(fetchErr);
    }

    return res.json({
      message: "Interview scheduled successfully",
      from: current_status,
      to: "INTERVIEW_SCHEDULED",
      application: updatedApplication,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to schedule interview" });
  }
});

// PUT mark interviewed
router.put("/:id/interviewed", requireRole("ADMIN"), async (req, res) => {
  const application_id = Number(req.params.id);

  if (!isPositiveInteger(application_id)) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  try {
    const application = await getApplicationById(application_id);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const current_status = String(application.status || "").toUpperCase();

    if (!validTransitions[current_status]?.includes("INTERVIEWED")) {
      return res.status(400).json({ error: "Only scheduled interviews can be marked as interviewed" });
    }

    await db.query(
      "UPDATE application SET status = 'INTERVIEWED' WHERE application_id = ?",
      [application_id],
    );

    let updatedApplication = null;
    try {
      updatedApplication = await getApplicationDetailsById(application_id);
    } catch (fetchErr) {
      console.error(fetchErr);
    }

    return res.json({
      message: "Application marked as interviewed",
      from: current_status,
      to: "INTERVIEWED",
      application: updatedApplication,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to mark application as interviewed" });
  }
});

// POST feedback
router.post("/:id/feedback", requireRole("ADMIN"), async (req, res) => {
  const application_id = Number(req.params.id);
  const { technical_score, communication_score, remarks } = req.body;

  if (!isPositiveInteger(application_id)) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  if (!isNumberInRange(technical_score, 0, 100) || !isNumberInRange(communication_score, 0, 100)) {
    return res.status(400).json({ error: "technical_score and communication_score must be between 0 and 100" });
  }

  try {
    const [insertResult] = await db.query(
      `
        INSERT INTO interview_feedback (
          application_id,
          user_id,
          technical_score,
          communication_score,
          remarks
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        application_id,
        req.user.user_id,
        Number(technical_score),
        Number(communication_score),
        remarks?.trim() || null,
      ],
    );

    let feedback = null;
    try {
      const [feedbackRows] = await db.query(
        `
          SELECT feedback_id, application_id, technical_score, communication_score, overall_score, remarks
          FROM interview_feedback
          WHERE feedback_id = ?
        `,
        [insertResult.insertId],
      );
      feedback = feedbackRows[0] || null;
    } catch (fetchErr) {
      console.error(fetchErr);
    }

    let applicationDetails = null;
    try {
      applicationDetails = await getApplicationDetailsById(application_id);
    } catch (appErr) {
      console.error(appErr);
    }

    return res.status(201).json({
      message: "Feedback saved successfully",
      feedback,
      application: applicationDetails,
    });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Feedback already submitted by you for this candidate." });
    }
    return res.status(400).json({
      error: err.sqlMessage || "Failed to save interview feedback",
    });
  }
});

// POST hire
router.post("/:id/hire", requireRole("ADMIN"), async (req, res) => {
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

  try {
    const application = await getApplicationById(application_id);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const current_status = String(application.status || "").toUpperCase();

    if (!validTransitions[current_status]?.includes("HIRED")) {
      return res.status(400).json({ error: "The application must be OFFERED before it can be hired" });
    }

    await db.query(
      "CALL hire_candidate(?, ?, ?, ?)",
      [application_id, department.trim(), Number(base_salary), Number(bonus_percentage)],
    );

    let updatedApplication = null;
    try {
      updatedApplication = await getApplicationDetailsById(application_id);
    } catch (fetchErr) {
      console.error(fetchErr);
    }

    return res.json({
      message: "Candidate hired successfully",
      application_id,
      status: "HIRED",
      application: updatedApplication,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.sqlMessage || "Hire operation failed" });
  }
});

// DELETE bulk-remove
router.delete("/bulk", requireRole("ADMIN"), async (req, res) => {
  const { job_role, status } = req.query;
  
  if (!job_role || !status) {
    return res.status(400).json({ error: "job_role and status are required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT application_id FROM application WHERE job_role = ? AND status = ? AND is_archived = FALSE",
      [job_role, status]
    );

    if (rows.length === 0) {
      return res.json({ message: "No applications matched the criteria", count: 0 });
    }

    const appIds = rows.map(r => r.application_id);

    await Promise.all([
      db.query("DELETE FROM interview_feedback WHERE application_id IN (?)", [appIds]),
      db.query("DELETE FROM status_history WHERE application_id IN (?)", [appIds]),
    ]);

    const [result] = await db.query("UPDATE application SET is_archived = TRUE, archived_stage = status WHERE application_id IN (?)", [appIds]);

    return res.json({ message: `Removed ${result.affectedRows} applications from pipeline`, count: result.affectedRows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to perform bulk remove" });
  }
});

// POST close-position
router.post("/close-position", requireRole("ADMIN"), async (req, res) => {
  const { job_role } = req.body;
  if (!job_role) return res.status(400).json({ error: "job_role is required" });

  try {
    const [rows] = await db.query(
      "SELECT application_id, status FROM application WHERE job_role = ? AND status NOT IN ('HIRED', 'INTERVIEW_SCHEDULED') AND is_archived = FALSE",
      [job_role]
    );

    if (rows.length === 0) {
      return res.json({ message: "No applicable applications found to close.", count: 0 });
    }

    const appIds = rows.map(r => r.application_id);
    const interviewedIds = rows.filter(r => r.status === 'INTERVIEWED').map(r => r.application_id);

    // Insert feedback for INTERVIEWED ones
    if (interviewedIds.length > 0) {
      const feedbackValues = interviewedIds.map(id => [id, req.user.user_id, 0, 0, 'Position closed']);
      await db.query(
        "INSERT IGNORE INTO interview_feedback (application_id, user_id, technical_score, communication_score, remarks) VALUES ?",
        [feedbackValues]
      );
    }

    await Promise.all([
      db.query("DELETE FROM interview_feedback WHERE application_id IN (?)", [appIds]),
      db.query("DELETE FROM status_history WHERE application_id IN (?)", [appIds]),
    ]);

    const [result] = await db.query("UPDATE application SET is_archived = TRUE, archived_stage = status WHERE application_id IN (?)", [appIds]);

    return res.json({ message: `Closed position. Rejected and removed ${result.affectedRows} applications.`, count: result.affectedRows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to close position" });
  }
});

// DELETE application
router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  const application_id = Number(req.params.id);

  if (!isPositiveInteger(application_id)) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  try {
    // Delete dependent records in parallel since they're independent
    await Promise.all([
      db.query("DELETE FROM interview_feedback WHERE application_id = ?", [application_id]),
      db.query("DELETE FROM status_history WHERE application_id = ?", [application_id]),
    ]);

    const [result] = await db.query("UPDATE application SET is_archived = TRUE, archived_stage = status WHERE application_id = ?", [
      application_id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    return res.json({ message: "Application removed from pipeline" });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.sqlMessage || "Failed to remove application" });
  }
});

module.exports = router;
