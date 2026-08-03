const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Only the recruiter who owns the job behind this application may see/add notes.
async function loadOwnedApplication(applicationId, recruiterId) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!application) return { error: 404, message: "Application not found" };
  if (application.job.recruiterId !== recruiterId) {
    return { error: 403, message: "You can only manage notes for your own job's applicants." };
  }
  return { application };
}

router.get("/application/:applicationId", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const { error, message } = await loadOwnedApplication(applicationId, req.user.id);
    if (error) return res.status(error).json({ error: message });

    const notes = await prisma.note.findMany({
      where: { applicationId },
      include: { recruiter: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notes." });
  }
});

router.post("/application/:applicationId", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Note text is required." });
    }

    const { error, message } = await loadOwnedApplication(applicationId, req.user.id);
    if (error) return res.status(error).json({ error: message });

    const note = await prisma.note.create({
      data: {
        applicationId,
        recruiterId: req.user.id,
        text: text.trim(),
      },
      include: { recruiter: { select: { id: true, name: true } } },
    });

    res.status(201).json({ note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add note." });
  }
});

router.delete("/:id", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) return res.status(404).json({ error: "Note not found." });
    if (note.recruiterId !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own notes." });
    }

    await prisma.note.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete note." });
  }
});

module.exports = router;
