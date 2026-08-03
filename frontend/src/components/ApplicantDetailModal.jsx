import { useState, useEffect } from "react";
import { api } from "../api";

export default function ApplicantDetailModal({ applicationId, applicantName, analysis, onClose }) {
  const [tab, setTab] = useState("evaluation");

  if (!analysis && !applicationId) return null;

  let feedback = null;
  if (analysis) {
    try {
      feedback = typeof analysis.feedback === "string" ? JSON.parse(analysis.feedback) : analysis.feedback;
    } catch {
      feedback = null;
    }
  }

  const disabledTip = !applicationId ? "Available once this candidate has applied to a job" : "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-secondary modal-close" onClick={onClose}>
          Close
        </button>
        <h2>{applicantName ? `${applicantName}` : "Candidate Detail"}</h2>

        <div className="tab-row">
          <button className={`tab-btn ${tab === "evaluation" ? "active" : ""}`} onClick={() => setTab("evaluation")}>
            AI Evaluation
          </button>
          <button
            className={`tab-btn ${tab === "questions" ? "active" : ""}`}
            onClick={() => setTab("questions")}
            disabled={!applicationId}
            title={disabledTip}
          >
            Interview Questions
          </button>
          <button
            className={`tab-btn ${tab === "notes" ? "active" : ""}`}
            onClick={() => setTab("notes")}
            disabled={!applicationId}
            title={disabledTip}
          >
            Notes
          </button>
        </div>

        <div className="tab-panel">
          {tab === "evaluation" && <EvaluationTab analysis={analysis} feedback={feedback} />}
          {tab === "questions" && applicationId && <QuestionsTab applicationId={applicationId} />}
          {tab === "notes" && applicationId && <NotesTab applicationId={applicationId} />}
        </div>
      </div>
    </div>
  );
}

function EvaluationTab({ analysis, feedback }) {
  if (!analysis) {
    return <p style={{ color: "var(--text-dim)" }}>No AI analysis available for this candidate yet.</p>;
  }

  return (
    <div>
      <p>
        <strong>Match Score:</strong> {analysis.score}%
      </p>

      <h3>Strengths</h3>
      <ul className="feedback-list">
        {feedback?.strengths?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
        {(!feedback?.strengths || feedback.strengths.length === 0) && <li>No data.</li>}
      </ul>

      <h3>Missing Skills</h3>
      <ul className="feedback-list">
        {feedback?.missingKeywords?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
        {(!feedback?.missingKeywords || feedback.missingKeywords.length === 0) && <li>No data.</li>}
      </ul>

      <h3>Recruitment Insights</h3>
      <ul className="feedback-list">
        {feedback?.suggestions?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
        {(!feedback?.suggestions || feedback.suggestions.length === 0) && <li>No data.</li>}
      </ul>
    </div>
  );
}

function QuestionsTab({ applicationId }) {
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getInterviewQuestions(applicationId);
      setQuestions(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p style={{ color: "var(--text-dim)", marginBottom: 14, fontSize: 13 }}>
        Generates 5 questions tailored to this candidate's resume, the job description, and their AI evaluation.
      </p>
      <button className="btn" onClick={generate} disabled={loading}>
        {loading ? "Generating..." : questions ? "Regenerate Questions" : "Generate Questions"}
      </button>

      {error && (
        <div className="error-box" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}

      {questions && questions.length > 0 && (
        <ol className="feedback-list" style={{ marginTop: 16, paddingLeft: 20 }}>
          {questions.map((q, index) => (
            <li key={index} style={{ marginBottom: 10 }}>
              {q}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function NotesTab({ applicationId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getNotes(applicationId)
      .then((data) => {
        if (!cancelled) setNotes(data.notes);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  async function addNote(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError("");
    try {
      const data = await api.addNote(applicationId, text.trim());
      setNotes((prev) => [data.note, ...prev]);
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeNote(id) {
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <form onSubmit={addNote} style={{ marginBottom: 16 }}>
        <textarea
          className="input"
          rows={3}
          placeholder="Add a private note about this candidate..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn" disabled={saving || !text.trim()}>
          {saving ? "Saving..." : "Add Note"}
        </button>
      </form>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <p style={{ color: "var(--text-dim)" }}>Loading notes...</p>
      ) : notes.length === 0 ? (
        <p style={{ color: "var(--text-dim)" }}>No notes yet.</p>
      ) : (
        <ul className="notes-list">
          {notes.map((n) => (
            <li key={n.id} className="note-item">
              <div className="note-meta">
                <span>{n.recruiter?.name || "You"}</span>
                <span>{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p>{n.text}</p>
              <button className="btn-link" onClick={() => removeNote(n.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
