export default function AnalysisModal({ analysis, onClose }) {
  if (!analysis) return null;

  let feedback = null;
  try {
    feedback = typeof analysis.feedback === "string" ? JSON.parse(analysis.feedback) : analysis.feedback;
  } catch {
    feedback = null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-secondary modal-close" onClick={onClose}>
          Close
        </button>
        <h2>Candidate Evaluation</h2>

        <p>
          <strong>Match Score:</strong> {analysis.score}%
        </p>

        <h3>Strengths</h3>
        <ul>
          {feedback?.strengths?.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
          {(!feedback?.strengths || feedback.strengths.length === 0) && <li>No data.</li>}
        </ul>

        <h3>Missing Skills</h3>
        <ul>
          {feedback?.missingKeywords?.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
          {(!feedback?.missingKeywords || feedback.missingKeywords.length === 0) && <li>No data.</li>}
        </ul>

        <h3>Recruitment Insights</h3>
        <ul>
          {feedback?.suggestions?.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
          {(!feedback?.suggestions || feedback.suggestions.length === 0) && <li>No data.</li>}
        </ul>
      </div>
    </div>
  );
}
