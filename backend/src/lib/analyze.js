const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

console.log("=== Gemini Config ===");
console.log("Model:", GEMINI_API_URL);
console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
console.log(
  "API Key starts with:",
  process.env.GEMINI_API_KEY?.substring(0, 8)
);
console.log("=====================");

/**
 * Calls the Gemini API with automatic retry on 429 (rate limit / quota) errors.
 * Uses exponential backoff, and respects the server's suggested retryDelay when present.
 */
async function callGeminiWithRetry(body, { maxRetries = 3 } = {}) {
  let attempt = 0;

  while (true) {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return response.json();
    }

    const errText = await response.text();

    // Only retry on 429 (rate limit / quota exceeded). Other errors fail immediately.
    if (response.status === 429 && attempt < maxRetries) {
      let retryDelaySeconds = null;
      try {
        const parsedErr = JSON.parse(errText);
        const retryInfo = parsedErr?.error?.details?.find(
          (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
        );
        if (retryInfo?.retryDelay) {
          retryDelaySeconds = parseFloat(retryInfo.retryDelay.replace("s", ""));
        }
      } catch (_) {
        // ignore parse failure, fall back to exponential backoff
      }

      const backoffSeconds =
        retryDelaySeconds ?? Math.pow(2, attempt + 1); // 2s, 4s, 8s...
      const waitMs = Math.ceil(backoffSeconds * 1000);

      console.warn(
        `Gemini API 429 (attempt ${attempt + 1}/${maxRetries}). Retrying in ${backoffSeconds}s...`
      );

      await new Promise((resolve) => setTimeout(resolve, waitMs));
      attempt++;
      continue;
    }

    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }
}

/**
 * Strips markdown fences and extracts the outermost {...} block from a raw
 * Gemini text response, then parses it as JSON.
 */
function parseGeminiJson(rawText, { context = "" } = {}) {
  let cleaned = rawText.replace(/```json|```/g, "").trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(`Gemini returned invalid JSON${context ? ` (${context})` : ""}:`, cleaned);
    throw new Error("AI returned an invalid response. Please try again.");
  }
}

function getResponseText(data) {
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";
}

async function analyzeResume(resumeText, jobDescription) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to backend/.env before running analysis."
    );
  }

  const prompt = `You are an expert technical recruiter and resume reviewer. Compare the RESUME to the JOB DESCRIPTION below.

RESUME:
"""
${resumeText.slice(0, 5000)}
"""

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 2500)}
"""

Return ONLY valid JSON.

Do not use markdown.
Do not include explanations.
Do not include comments.
Do not truncate the JSON.
Ensure every array is closed.
Ensure the final character is }.

Return exactly this JSON structure:
{
  "score": <integer 0-100, overall match score>,
  "strengths": [<2-5 short strings, specific strengths matching the job>],
  "missingKeywords": [<2-8 short strings, important skills/keywords from the job description missing in the resume>],
  "suggestions": [<2-5 short, actionable strings to improve the resume for this job>]
}`;

  const data = await callGeminiWithRetry({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  console.log("Gemini Resume Analysis Response:");
  console.log(JSON.stringify(data, null, 2));

  const rawText = getResponseText(data);
  const parsed = parseGeminiJson(rawText, { context: "analyzeResume" });

  return {
    score: typeof parsed.score === "number" ? parsed.score : 0,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  };
}

async function generateInterviewQuestions(resumeText, jobDescription, analysisFeedback) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to backend/.env before running analysis."
    );
  }

  const missing = Array.isArray(analysisFeedback?.missingKeywords)
    ? analysisFeedback.missingKeywords.join(", ")
    : "";
  const strengths = Array.isArray(analysisFeedback?.strengths)
    ? analysisFeedback.strengths.join(", ")
    : "";

  const prompt = `You are an expert technical interviewer preparing questions for a recruiter.

RESUME:
"""
${resumeText.slice(0, 3000)}
"""

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 1500)}
"""

Previously identified strengths: ${strengths || "none provided"}
Previously identified gaps/missing skills: ${missing || "none provided"}

Generate 5 interview questions tailored to this specific candidate and role. Mix in:
- 1-2 questions that probe the identified gaps
- 1-2 questions that let the candidate expand on their strengths
- 1-2 general role-fit / behavioral questions

Return ONLY valid JSON, no markdown, no commentary. Return exactly this structure:
{
  "questions": [<5 short strings, each a single interview question>]
}`;

  const data = await callGeminiWithRetry({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  console.log("Gemini Response:");
  console.log(JSON.stringify(data, null, 2));

  const rawText = getResponseText(data);
  const parsed = parseGeminiJson(rawText, { context: "generateInterviewQuestions" });

  return Array.isArray(parsed.questions) ? parsed.questions : [];
}

module.exports = { analyzeResume, generateInterviewQuestions };
