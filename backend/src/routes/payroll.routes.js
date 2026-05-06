const express = require("express");
const db = require("../config/db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { isNonNegativeNumber, isPositiveInteger } = require("../utils/validation");

const router = express.Router();

router.use(authenticateToken);

router.post("/generate", requireRole("ADMIN"), (req, res) => {
  const { employee_id, month, year } = req.body;

  if (!isPositiveInteger(employee_id) || !isPositiveInteger(month) || !isPositiveInteger(year)) {
    return res.status(400).json({ error: "employee_id, month, and year must be positive integers" });
  }

  db.query("CALL generate_payroll(?, ?, ?)", [Number(employee_id), Number(month), Number(year)], (err) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ error: err.sqlMessage || "Failed to generate payroll" });
    }

    return res.status(201).json({ message: "Payroll generated successfully" });
  });
});

router.get("/payments", (req, res) => {
  const query = `
    SELECT
      p.payroll_id,
      p.employee_id,
      p.payroll_month,
      p.payroll_year,
      p.gross_salary,
      pr.payment_status
    FROM payroll_transaction p
    JOIN payment_record pr ON pr.payroll_id = p.payroll_id
    ORDER BY p.payroll_year DESC, p.payroll_month DESC, p.payroll_id DESC
  `;

  db.query(query, (err, results) => {
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

  db.query(
    `
      UPDATE payment_record
      SET payment_status = ?
      WHERE payroll_id = ?
    `,
    [status, payroll_id],
    (err, result) => {
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
    },
  );
});

module.exports = router;
