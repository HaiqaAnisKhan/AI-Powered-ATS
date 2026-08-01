const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();


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
  const { status } = req.body;

  const application = await prisma.application.update({
    where: {
      id: Number(req.params.id),
    },
    data: {
      status,
    },
  });

  res.json({ application });
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