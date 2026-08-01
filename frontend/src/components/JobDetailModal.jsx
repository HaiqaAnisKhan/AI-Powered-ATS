import { useEffect, useState } from "react";
import { api } from "../api";
import AnalysisModal from "./AnalysisModal";

export default function JobDetailModal({ job, onClose, onStatusChange }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showApplicants, setShowApplicants] = useState(false);
  const [status, setStatus] = useState(job.status);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getJobApplicants(job.id)
      .then((data) => {
        if (!cancelled) setApplicants(data.applications);
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
  }, [job.id]);

  async function toggleStatus() {
    const next = status === "OPEN" ? "CLOSED" : "OPEN";
    await api.updateJobStatus(job.id, next);
    setStatus(next);
    onStatusChange?.(job.id, next);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-secondary modal-close" onClick={onClose}>
          Close
        </button>

        <h2>{job.title}</h2>
        <p style={{ color: "var(--text-dim)" }}>
          {job.company} {job.location ? `· ${job.location}` : ""}
        </p>

        <span className={`pill ${status === "OPEN" ? "pill-open" : "pill-closed"}`}>
          {status === "OPEN" ? "Published" : "Unpublished"}
        </span>

        <div style={{ marginTop: 14, display: "flex", gap: 20, color: "var(--text-dim)", fontSize: 13 }}>
          {job.startDate && <span>Opens: {new Date(job.startDate).toLocaleDateString()}</span>}
          {job.endDate && <span>Closes: {new Date(job.endDate).toLocaleDateString()}</span>}
        </div>

        <div style={{ marginTop: 18 }}>
          <strong>Job Description</strong>
          <p style={{ marginTop: 8, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{job.description}</p>
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button className="btn" onClick={toggleStatus}>
            {status === "OPEN" ? "Unpublish" : "Publish"}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowApplicants((s) => !s)}>
            {showApplicants ? "Hide" : "View"} Applicants ({applicants.length})
          </button>
        </div>

        {showApplicants && (
          <div style={{ marginTop: 20 }}>
            {error && <div className="error-box">{error}</div>}
            {loading ? (
              <p style={{ color: "var(--text-dim)" }}>Loading applicants...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Email</th>
                    <th>Resume</th>
                    <th>AI Score</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((a) => (
                    <tr key={a.id}>
                      <td>{a.applicant.name}</td>
                      <td>{a.applicant.email}</td>
                      <td>{a.resume?.filename || "-"}</td>
                      <td>{a.resume?.analyses?.length > 0 ? `${a.resume.analyses[0].score}%` : "-"}</td>
                      <td>{a.status}</td>
                      <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                      <td>
                        {a.resume?.analyses?.length > 0 && (
                          <button className="btn btn-secondary" onClick={() => setSelectedAnalysis(a.resume.analyses[0])}>
                            View Analysis
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {applicants.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: 20, color: "var(--text-dim)" }}>
                        No applicants yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        <AnalysisModal analysis={selectedAnalysis} onClose={() => setSelectedAnalysis(null)} />
      </div>
    </div>
  );
}
