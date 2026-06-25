const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  isValidEmail,
  isNonEmptyString,
  isNonNegativeNumber,
  isOptionalString,
  isNumberInRange,
} = require("../utils/validation");

const router = express.Router();

router.use(authenticateToken);

router.post("/", async (req, res) => {
  const {
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
  } = req.body;

  if (!isNonEmptyString(first_name, 100) || !isNonEmptyString(last_name, 100)) {
    return res.status(400).json({ error: "First and last name are required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  if (!isOptionalString(phone, 30)) {
    return res.status(400).json({ error: "Phone must be 30 characters or fewer" });
  }

  if (
    !isOptionalString(college_name, 255) ||
    !isOptionalString(degree, 100) ||
    !isOptionalString(specialization, 100) ||
    !isOptionalString(skills, 5000)
  ) {
    return res.status(400).json({ error: "One or more candidate fields are too long" });
  }

  if (
    cgpa !== undefined &&
    cgpa !== null &&
    cgpa !== "" &&
    !isNumberInRange(cgpa, 0, 10)
  ) {
    return res.status(400).json({ error: "CGPA must be between 0 and 10" });
  }

  if (
    experience_years !== undefined &&
    experience_years !== null &&
    experience_years !== "" &&
    !isNonNegativeNumber(experience_years)
  ) {
    return res.status(400).json({ error: "Experience years must be a non-negative number" });
  }

  try {
    const query = `
      INSERT INTO candidate (
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
        job_role
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      first_name.trim(),
      last_name.trim(),
      email.trim().toLowerCase(),
      phone?.trim() || null,
      college_name?.trim() || null,
      degree?.trim() || null,
      specialization?.trim() || null,
      cgpa === "" || cgpa === undefined || cgpa === null ? null : Number(cgpa),
      experience_years === "" || experience_years === undefined || experience_years === null
        ? 0
        : Number(experience_years),
      skills?.trim() || null,
      job_role?.trim() || 'Software Engineer',
    ]);

    return res.status(201).json({
      message: "Candidate added successfully",
      candidate_id: result.insertId,
    });
  } catch (err) {
    console.error(err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "A candidate with this email already exists" });
    }

    return res.status(500).json({ error: "Database error" });
  }
});

router.get("/", async (req, res) => {
  const { minCgpa, maxCgpa, minExperience, job_role } = req.query;
  const where = [];
  const params = [];

  if (minCgpa !== undefined && minCgpa !== "") {
    if (!isNonNegativeNumber(minCgpa)) {
      return res.status(400).json({ error: "minCgpa must be a non-negative number" });
    }
    where.push("COALESCE(c.cgpa, 0) >= ?");
    params.push(Number(minCgpa));
  }

  if (maxCgpa !== undefined && maxCgpa !== "") {
    if (!isNonNegativeNumber(maxCgpa)) {
      return res.status(400).json({ error: "maxCgpa must be a non-negative number" });
    }
    where.push("COALESCE(c.cgpa, 0) <= ?");
    params.push(Number(maxCgpa));
  }

  if (minExperience !== undefined && minExperience !== "") {
    if (!isNonNegativeNumber(minExperience)) {
      return res.status(400).json({ error: "minExperience must be a non-negative number" });
    }
    where.push("COALESCE(c.experience_years, 0) >= ?");
    params.push(Number(minExperience));
  }

  if (job_role !== undefined && job_role !== "") {
    where.push("c.job_role = ?");
    params.push(job_role);
  }

  where.push("c.is_archived = FALSE");

  try {
    const query = `
      SELECT
        c.candidate_id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.college_name,
        c.degree,
        c.specialization,
        c.cgpa,
        c.experience_years,
        c.skills,
        c.job_role,
        c.created_at
      FROM candidate c
      LEFT JOIN application a ON a.candidate_id = c.candidate_id
      WHERE a.candidate_id IS NULL
        ${where.length ? `AND ${where.join(" AND ")}` : ""}
      ORDER BY c.created_at DESC, c.candidate_id DESC
    `;

    const [results] = await db.query(query, params);
    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
});

router.delete("/bulk", requireRole("ADMIN"), async (req, res) => {
  const { minCgpa, maxCgpa, minExperience, job_role } = req.query;

  let filterClause = "";
  const params = [];

  if (minCgpa && !isNonNegativeNumber(minCgpa)) return res.status(400).json({ error: "minCgpa must be a number" });
  if (maxCgpa && !isNonNegativeNumber(maxCgpa)) return res.status(400).json({ error: "maxCgpa must be a number" });
  if (minExperience && !isNonNegativeNumber(minExperience)) return res.status(400).json({ error: "minExperience must be a number" });

  if (minCgpa) { filterClause += " AND COALESCE(cgpa, 0) >= ?"; params.push(Number(minCgpa)); }
  if (maxCgpa) { filterClause += " AND COALESCE(cgpa, 0) <= ?"; params.push(Number(maxCgpa)); }
  if (minExperience) { filterClause += " AND COALESCE(experience_years, 0) >= ?"; params.push(Number(minExperience)); }
  if (job_role) { filterClause += " AND job_role = ?"; params.push(job_role); }

  try {
    const query = `
      UPDATE candidate 
      SET is_archived = TRUE 
      WHERE is_archived = FALSE 
        AND candidate_id NOT IN (SELECT candidate_id FROM application)
        ${filterClause}
    `;
    const [result] = await db.query(query, params);
    return res.json({ message: `Archived ${result.affectedRows} candidates.`, count: result.affectedRows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to perform bulk remove" });
  }
});

module.exports = router;
