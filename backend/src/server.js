
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");

const authRoutes = require("./routes/auth");
const resumeRoutes = require("./routes/resumes");
const dashboardRoutes = require("./routes/dashboard");
const jobsRoutes = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationRoutes);
const fs = require("fs");

app.get("/debug-db", (req, res) => {
  res.json({
    cwd: process.cwd(),
    databaseUrl: process.env.DATABASE_URL,
    prismaFolderExists: fs.existsSync("./prisma"),
    databaseExists: fs.existsSync("./prisma/dev.db"),
    prismaFiles: fs.existsSync("./prisma")
      ? fs.readdirSync("./prisma")
      : [],
  });
});

app.get("/debug-users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Resume Checker API running on port ${PORT}`);
});
