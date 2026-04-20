const express = require("express");
require("./config/db");

const candidateRoutes = require("./routes/candidate.routes");

const app = express();
app.use(express.json());

app.use("/candidates", candidateRoutes);

const applicationRoutes = require("./routes/application.routes");
app.use("/applications", applicationRoutes);

app.get("/", (req, res) => {
  res.send("URPMS Backend Running");
});

const payrollRoutes = require("./routes/payroll.routes");
app.use("/payroll", payrollRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});