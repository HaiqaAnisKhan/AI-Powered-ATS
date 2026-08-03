
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");

const authRoutes = require("./routes/auth");
const resumeRoutes = require("./routes/resumes");
const dashboardRoutes = require("./routes/dashboard");
const jobsRoutes = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");
const noteRoutes = require("./routes/notes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <h1>AI-Powered ATS Backend</h1>
    <p>Backend API is running successfully.</p>

    <h3>Available Endpoints</h3>
    <ul>
      <li><a href="/api/health">/api/health</a></li>
    </ul>
  `);
});
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notes", noteRoutes);

app.listen(PORT, () => {
  console.log(`Resume Checker API running on port ${PORT}`);
});
