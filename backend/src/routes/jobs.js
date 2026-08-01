const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { assessJobDescription } = require("../lib/textQuality");

const router = express.Router();

// Auto-unpublish any job whose end date has passed. Cheap to run on every
// read since it's a single indexed updateMany.
async function closeExpiredJobs() {
  await prisma.job.updateMany({
    where: {
      status: "OPEN",
      endDate: { lt: new Date() },
    },
    data: { status: "CLOSED" },
  });
}

router.post("/", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const { title, company, location, description, startDate, endDate } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({
        error: "Title, company and description are required.",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Start date and end (closing) date are required.",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid start or end date." });
    }

    if (end <= start) {
      return res.status(400).json({ error: "Closing date must be after the start date." });
    }

    const quality = assessJobDescription(description);
    if (!quality.valid) {
      return res.status(400).json({ error: quality.reason });
    }

    const job = await prisma.job.create({
      data: {
        recruiterId: req.user.id,
        title,
        company,
        location,
        description,
        startDate: start,
        endDate: end,
        status: "OPEN",
      },
    });

    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create job." });
  }
});

router.get("/mine", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    await closeExpiredJobs();

    const jobs = await prisma.job.findMany({
      where: {
        recruiterId: req.user.id,
      },
      include: {
        applications: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch jobs.",
    });
  }
});

// All applicants for a single job the recruiter owns, with resume + latest score.
// Used by the "My Jobs" detail card and the Candidates page's job filter.
router.get("/:id/applicants", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ error: "You can only view applicants for your own jobs." });
    }

    const applications = await prisma.application.findMany({
      where: { jobId: id },
      include: {
        applicant: { select: { id: true, name: true, email: true } },
        resume: {
          include: {
            analyses: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    res.json({ job, applications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch applicants." });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    await closeExpiredJobs();

    const jobs = await prisma.job.findMany({
      where: {
        status: "OPEN",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        recruiter: {
          select: {
            name: true,
          },
        },
      },
    });

    res.json({ jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch jobs." });
  }
});


router.get("/:id", requireAuth, async (req, res) => {
  try {
    await closeExpiredJobs();

    const id = Number(req.params.id);

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        recruiter: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({
        error: "Job not found",
      });
    }

    // Applicants should never be able to open a job that isn't currently
    // published, even by guessing its id directly.
    if (req.user.role !== "recruiter" && job.status !== "OPEN") {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch job.",
    });
  }
});

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("recruiter"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const job = await prisma.job.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          status,
        },
      });

      res.json({ job });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: "Failed to update job status.",
      });
    }
  }
);

module.exports = router;