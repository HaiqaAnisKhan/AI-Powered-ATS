const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

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

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
  temperature: 0.2,
  maxOutputTokens: 2048,
  responseMimeType: "application/json",
},
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
 
console.dir(data, { depth: null });
  const rawText = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";

  const cleaned = rawText.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini returned invalid JSON:", cleaned);
throw new Error("AI returned an invalid response. Please try again.");
  }

  return {
    score: typeof parsed.score === "number" ? parsed.score : 0,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  };
}

module.exports = { analyzeResume };