const nodemailer = require("nodemailer");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

const isConfigured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

const STATUS_COPY = {
  "Under Review": "Your application is now under review.",
  Interview: "Good news — you've been moved to the interview stage!",
  Accepted: "Congratulations — your application has been accepted!",
  Rejected: "There's an update on your application status.",
};

/**
 * Sends a status-change notification email. Never throws — a failed or
 * unconfigured email should never break the status-update request itself,
 * it just gets logged.
 */
async function sendApplicationStatusEmail({ to, applicantName, jobTitle, company, status }) {
  const subject = `Update on your application for ${jobTitle} at ${company}`;
  const headline = STATUS_COPY[status] || `Your application status is now: ${status}.`;
  const text = `Hi ${applicantName},\n\n${headline}\n\nJob: ${jobTitle} at ${company}\nStatus: ${status}\n\nYou can view the full details by logging into your account.\n`;

  if (!isConfigured) {
    console.log(`[email] SMTP not configured, skipping notification to ${to}: "${subject}"`);
    return { sent: false, reason: "not_configured" };
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM || SMTP_USER,
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] Failed to send status notification:", err.message);
    return { sent: false, reason: "send_failed" };
  }
}

module.exports = { sendApplicationStatusEmail };
