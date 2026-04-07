const express = require("express");
require("./config/db");

const candidateRoutes = require("./routes/candidate.routes");

const app = express();
app.use(express.json());

app.use("/candidates", candidateRoutes);

app.get("/", (req, res) => {
  res.send("URPMS Backend Running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});