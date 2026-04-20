const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/payments", (req, res) => {
  db.query("SELECT * FROM payment_record", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Update payment status
router.put("/payment/:payroll_id", (req, res) => {
  const payroll_id = req.params.payroll_id;
  const { status } = req.body;

  const validStatuses = ["PENDING", "COMPLETED"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const query = `
    UPDATE payment_record
    SET payment_status = ?
    WHERE payroll_id = ?
  `;

  db.query(query, [status, payroll_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Payroll not found" });
    }

    res.json({
      message: "Payment status updated successfully"
    });
  });
});

module.exports = router;