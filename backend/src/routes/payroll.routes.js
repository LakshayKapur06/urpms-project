const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

router.get("/payments", (req, res) => {
  db.query("SELECT * FROM payment_record", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.json(results);
  });
});

router.put("/payment/:payroll_id", requireRole("ADMIN"), (req, res) => {
  const payroll_id = Number(req.params.payroll_id);
  const { status } = req.body;
  const validStatuses = ["PENDING", "COMPLETED"];

  if (!Number.isInteger(payroll_id) || payroll_id <= 0) {
    return res.status(400).json({ error: "Invalid payroll id" });
  }

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

    return res.json({
      message: "Payment status updated successfully",
    });
  });
});

module.exports = router;
