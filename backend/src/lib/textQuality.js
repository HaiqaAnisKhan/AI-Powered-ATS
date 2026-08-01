// Lightweight heuristics to reject gibberish/keyboard-mash job descriptions
// before they ever reach the AI analysis step. No external calls/dictionary
// needed, so it's fast and works offline.

const COMMON_WORDS = new Set([
  "the", "and", "you", "for", "with", "will", "have", "this", "that", "are",
  "our", "team", "work", "job", "role", "years", "experience", "skills",
  "candidate", "responsibilities", "requirements", "ability", "strong",
  "knowledge", "we", "a", "to", "of", "in", "is", "as", "on", "or", "be",
  "your", "an", "management", "development", "customer", "communication",
  "project", "company", "looking", "must", "should", "who", "can", "using",
  "software", "business", "required", "preferred", "plus", "join", "help",
]);

function looksLikeRealWord(word) {
  const w = word.toLowerCase();
  if (!/^[a-z]+$/.test(w)) return true; // numbers/punctuation-mixed tokens: don't penalize
  if (w.length < 2 || w.length > 22) return false;
  if (!/[aeiou]/.test(w)) return false; // no vowel at all -> almost certainly not a word
  if (/(.)\1{3,}/.test(w)) return false; // 4+ repeated same letter, e.g. "aaaa"
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/.test(w)) return false; // 5+ consonants in a row
  return true;
}

/**
 * Returns { valid: boolean, reason?: string }
 */
function assessJobDescription(description) {
  const text = (description || "").trim();

  if (text.length < 40) {
    return { valid: false, reason: "Job description is too short. Please add more detail (responsibilities, requirements, etc.)." };
  }

  const words = text.split(/\s+/).filter(Boolean);

  if (words.length < 15) {
    return { valid: false, reason: "Job description needs at least 15 words of real content." };
  }

  const realish = words.filter(looksLikeRealWord);
  const ratio = realish.length / words.length;

  if (ratio < 0.65) {
    return { valid: false, reason: "This description doesn't look like readable text. Please rewrite it as a normal job description — the AI analysis needs real words to work with." };
  }

  const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ""));
  const hasCommonWord = lowerWords.some((w) => COMMON_WORDS.has(w));

  if (!hasCommonWord) {
    return { valid: false, reason: "This description doesn't read like a real job posting. Please describe the role, responsibilities, and requirements in plain sentences." };
  }

  return { valid: true };
}

module.exports = { assessJobDescription };
