const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendApplicationStatusEmail } = require("../lib/email");
const { generateInterviewQuestions } = require("../lib/analyze");

const router = express.Router();

const VALID_STATUSES = ["Applied", "Under Review", "Interview", "Accepted", "Rejected"];


router.post("/", requireAuth, requireRole("applicant"), async (req, res) => {
  try {
    const { jobId, resumeId } = req.body;

    if (!jobId || !resumeId) {
  return res.status(400).json({
    error: "jobId and resumeId are required",
  });
}

const job = await prisma.job.findUnique({
  where: {
    id: Number(jobId),
  },
});

if (!job) {
  return res.status(404).json({
    error: "Job not found.",
  });
}

if (job.status === "CLOSED") {
  return res.status(400).json({
    error: "This job is no longer accepting applications.",
  });
}

const existingApplication = await prisma.application.findFirst({
  where: {
    applicantId: req.user.id,
    jobId: Number(jobId),
  },
});

if (existingApplication) {
  return res.status(400).json({
    error: "You have already applied for this job.",
  });
}
    const application = await prisma.application.create({
      data: {
        applicantId: req.user.id,
        jobId: Number(jobId),
        resumeId: Number(resumeId),
      },
    });

    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to create application.",
    });
  }
});

router.patch("/:id/status", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const { status } = req.body;
    const id = Number(req.params.id);

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const existing = await prisma.application.findUnique({
      where: { id },
      include: { job: true, applicant: true },
    });
    if (!existing) return res.status(404).json({ error: "Application not found." });
    if (existing.job.recruiterId !== req.user.id) {
      return res.status(403).json({ error: "You can only update applications for your own jobs." });
    }

    const application = await prisma.application.update({
      where: { id },
      data: { status },
    });

    // Fire-and-forget: a slow/unconfigured mail provider should never
    // hold up the recruiter's status-update request.
    sendApplicationStatusEmail({
      to: existing.applicant.email,
      applicantName: existing.applicant.name,
      jobTitle: existing.job.title,
      company: existing.job.company,
      status,
    }).catch((err) => console.error("[email] notification error:", err));

    res.json({ application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update application status." });
  }
});

// Generate (or regenerate) AI interview questions for this applicant, cached
// on the application row so repeat views don't re-call the model.
router.post("/:id/interview-questions", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        resume: { include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } } },
      },
    });
    if (!application) return res.status(404).json({ error: "Application not found." });
    if (application.job.recruiterId !== req.user.id) {
      return res.status(403).json({ error: "You can only do this for your own jobs' applicants." });
    }
    if (!application.resume) {
      return res.status(400).json({ error: "This applicant has no resume on file." });
    }

    const latestAnalysis = application.resume.analyses[0];
    const feedback = latestAnalysis ? JSON.parse(latestAnalysis.feedback) : null;

    const questions = await generateInterviewQuestions(
      application.resume.extractedText,
      application.job.description,
      feedback
    );

    await prisma.application.update({
      where: { id },
      data: { interviewQuestions: JSON.stringify(questions) },
    });

    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate interview questions: " + err.message });
  }
});

router.get("/", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
  applicant: true,

  resume: {
    include: {
      analyses: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  },

  job: true,
},
      orderBy: {
        appliedAt: "desc",
      },
    });

    res.json({
      applications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch applications.",
    });
  }
});

module.exports = router;