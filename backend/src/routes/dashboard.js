const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.get("/stats", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const analyses = await prisma.analysis.findMany({
      orderBy: { createdAt: "desc" },
      include: { resume: { include: { user: true } } },
    });

    const totalApplicants = await prisma.user.count({ where: { role: "applicant" } });
    const totalResumes = await prisma.resume.count();
    const totalAnalyses = analyses.length;

    const avgScore =
      totalAnalyses > 0
        ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / totalAnalyses)
        : 0;

    const buckets = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
    analyses.forEach((a) => {
      if (a.score <= 20) buckets["0-20"]++;
      else if (a.score <= 40) buckets["21-40"]++;
      else if (a.score <= 60) buckets["41-60"]++;
      else if (a.score <= 80) buckets["61-80"]++;
      else buckets["81-100"]++;
    });
    const scoreDistribution = Object.entries(buckets).map(([range, count]) => ({ range, count }));

    const recent = analyses.slice(0, 8).map((a) => ({
      id: a.id,
      applicantName: a.resume.user.name,
      score: a.score,
      createdAt: a.createdAt,
    }));

    res.json({
      totalApplicants,
      totalResumes,
      totalAnalyses,
      avgScore,
      scoreDistribution,
      recent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

module.exports = router;
