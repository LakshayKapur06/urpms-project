const express = require("express");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const {
  isValidEmail,
  isNonEmptyString,
  isNonNegativeNumber,
  isOptionalString,
  isNumberInRange,
} = require("../utils/validation");

const router = express.Router();

router.use(authenticateToken);

router.post("/", (req, res) => {
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
      skills
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
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
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }

      return res.status(201).json({
        message: "Candidate added successfully",
        candidate_id: result.insertId,
      });
    },
  );
});

router.get("/", (req, res) => {
  const { minCgpa, minExperience } = req.query;
  const where = [];
  const params = [];

  if (minCgpa !== undefined && minCgpa !== "") {
    if (!isNonNegativeNumber(minCgpa)) {
      return res.status(400).json({ error: "minCgpa must be a non-negative number" });
    }
    where.push("COALESCE(cgpa, 0) >= ?");
    params.push(Number(minCgpa));
  }

  if (minExperience !== undefined && minExperience !== "") {
    if (!isNonNegativeNumber(minExperience)) {
      return res.status(400).json({ error: "minExperience must be a non-negative number" });
    }
    where.push("COALESCE(experience_years, 0) >= ?");
    params.push(Number(minExperience));
  }

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
      created_at
    FROM candidate
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY created_at DESC, candidate_id DESC
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.json(results);
  });
});

module.exports = router;
