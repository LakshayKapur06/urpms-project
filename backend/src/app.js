const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const candidateRoutes = require("./routes/candidate.routes");
const applicationRoutes = require("./routes/application.routes");
const payrollRoutes = require("./routes/payroll.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const employeesRoutes = require("./routes/employees.routes");
const authRoutes = require("./routes/auth.routes");
const { securityHeaders } = require("./middleware/security");

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(securityHeaders);
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.send("URPMS Backend Running");
});

app.use("/auth", authRoutes);
app.use("/candidates", candidateRoutes);
app.use("/applications", applicationRoutes);
app.use("/payroll", payrollRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/employees", employeesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

function shutdown() {
  console.log("\nShutting down gracefully...");
  server.close(() => {
    db.end(() => {
      console.log("Database pool closed.");
      process.exit(0);
    });
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
