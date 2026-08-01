const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { analyzeResume } = require("../lib/analyze");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Very-lightweight identity sanity check: does the account holder's name (or
// email handle) actually show up somewhere in the resume text? This can't
// prove ownership, but it catches the common case of someone uploading
// somebody else's CV by mistake (or on purpose) and never renaming it.
function checkNameMatch(fullName, email, extractedText) {
  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1);

  const textWords = new Set(normalize(extractedText));
  const nameParts = normalize(fullName);
  const emailHandle = (email || "").split("@")[0].toLowerCase();

  if (nameParts.length === 0) return { matched: true }; // nothing to check against

  const matchedParts = nameParts.filter((part) => textWords.has(part));
  const matchRatio = matchedParts.length / nameParts.length;

  // Consider it a match if most of the name appears, or the first part of
  // the email (a common resume "contact" line) appears verbatim.
  const matched = matchRatio >= 0.5 || (emailHandle.length > 2 && extractedText.toLowerCase().includes(emailHandle));

  return { matched, matchRatio };
}

router.post("/upload", requireAuth, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Field name must be 'resume'." });
    }

    const parsed = await pdfParse(req.file.buffer);
    const extractedText = parsed.text.trim();

    if (!extractedText) {
      return res.status(400).json({ error: "Could not extract text from PDF. Try a different file." });
    }

    const { matched } = checkNameMatch(req.user.name, req.user.email, extractedText);

    const resume = await prisma.resume.create({
      data: {
        userId: req.user.id,
        filename: req.file.originalname,
        extractedText,
      },
    });

    res.status(201).json({
      resume: { id: resume.id, filename: resume.filename, uploadedAt: resume.uploadedAt },
      nameMatch: matched,
      nameMatchWarning: matched
        ? null
        : "We couldn't find your name or email on this resume. Please double check you uploaded your own CV before applying.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
});

router.post("/:id/analyze", requireAuth, async (req, res) => {
  try {
    const resumeId = parseInt(req.params.id, 10);
    const { jobId } = req.body;

if (!jobId) {
  return res.status(400).json({
    error: "Please select a job.",
  });
}

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    if (resume.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only analyze your own resumes" });
    }

    const job = await prisma.job.findUnique({
  where: {
    id: Number(jobId),
  },
});

if (!job) {
  return res.status(404).json({
    error: "Job not found",
  });
}

const result = await analyzeResume(
  resume.extractedText,
  job.description
);

    const analysis = await prisma.analysis.create({
      data: {
        resumeId: resume.id,
        jobDescription: job.description,
        score: result.score,
        feedback: JSON.stringify({
          strengths: result.strengths,
          missingKeywords: result.missingKeywords,
          suggestions: result.suggestions,
        }),
      },
    });

    res.status(201).json({
      analysis: {
        id: analysis.id,
        score: analysis.score,
        feedback: JSON.parse(analysis.feedback),
        createdAt: analysis.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed: " + err.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: req.user.id },
      include: {
  analyses: {
    orderBy: {
      createdAt: "desc",
    },
  },

  application: {
    include: {
      job: true,
    },
  },
},
      orderBy: { uploadedAt: "desc" },
    });

    const formatted = resumes.map((r) => ({
  id: r.id,
  filename: r.filename,
  uploadedAt: r.uploadedAt,

  application: r.application
  ? {
      jobId: r.application.jobId,
      jobTitle: r.application.job.title,
      company: r.application.job.company,
      location: r.application.job.location,
      description: r.application.job.description,
      status: r.application.status,
      appliedAt: r.application.appliedAt,
    }
  : null,

  analyses: r.analyses.map((a) => ({
    id: a.id,
    score: a.score,
    jobDescription: a.jobDescription,
    feedback: JSON.parse(a.feedback),
    createdAt: a.createdAt,
  })),
}));

    res.json({ resumes: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

router.get("/", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const { search, minScore, maxScore } = req.query;

    const resumes = await prisma.resume.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        analyses: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { uploadedAt: "desc" },
    });

    let results = resumes.map((r) => {
      const latest = r.analyses[0];
      return {
        id: r.id,
        filename: r.filename,
        uploadedAt: r.uploadedAt,
        applicant: r.user,
        latestScore: latest ? latest.score : null,
        latestFeedback: latest ? JSON.parse(latest.feedback) : null,
        analyzedAt: latest ? latest.createdAt : null,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.applicant.name.toLowerCase().includes(s) ||
          r.applicant.email.toLowerCase().includes(s) ||
          r.filename.toLowerCase().includes(s)
      );
    }

    if (minScore) {
      results = results.filter((r) => r.latestScore !== null && r.latestScore >= parseInt(minScore, 10));
    }

    if (maxScore) {
      results = results.filter((r) => r.latestScore !== null && r.latestScore <= parseInt(maxScore, 10));
    }

    res.json({ resumes: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

module.exports = router;
