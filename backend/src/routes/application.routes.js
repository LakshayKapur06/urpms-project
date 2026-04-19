const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Create application
router.post("/", (req, res) => {
  const { candidate_id, job_id } = req.body;

  const query = `
    INSERT INTO application (candidate_id, job_id)
    VALUES (?, ?)
  `;

  db.query(query, [candidate_id, job_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      message: "Application created",
      application_id: result.insertId
    });
  });
});

module.exports = router;

// Update application status
router.put("/:id/status", (req, res) => {
  const application_id = req.params.id;
  const { new_status } = req.body;

  // Step 1: Get current status
  const getQuery = "SELECT status FROM application WHERE application_id = ?";

  db.query(getQuery, [application_id], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });

    if (result.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const current_status = result[0].status;

    // Step 2: Validate transition
    const validTransitions = {
      APPLIED: ["SCREENING"],
      SCREENING: ["SHORTLISTED"],
      SHORTLISTED: ["INTERVIEWED"],
      INTERVIEWED: ["OFFERED"],
      OFFERED: ["HIRED"],
    };

    if (
      new_status !== "REJECTED" &&
      !validTransitions[current_status]?.includes(new_status)
    ) {
      return res.status(400).json({ error: "Invalid status transition" });
    }

    // Step 3: Update status
    const updateQuery =
      "UPDATE application SET status = ? WHERE application_id = ?";

    db.query(updateQuery, [new_status, application_id], (err) => {
      if (err) return res.status(500).json({ error: "Update failed" });

      // Step 4: Insert into history
      const historyQuery = `
        INSERT INTO status_history (application_id, old_status, new_status)
        VALUES (?, ?, ?)
      `;

      db.query(
        historyQuery,
        [application_id, current_status, new_status],
        (err) => {
          if (err)
            return res.status(500).json({ error: "History insert failed" });

          res.json({
            message: "Status updated",
            from: current_status,
            to: new_status,
          });
        }
      );
    });
  });
});