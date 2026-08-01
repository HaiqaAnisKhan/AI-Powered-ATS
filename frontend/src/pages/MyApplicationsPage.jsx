import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function MyApplicationsPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .myResumes()
      .then((data) => setHistory(data.resumes.filter((r) => r.application)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>My Applications</h1>
      <p className="subtitle">Everything you've applied for so far.</p>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-dim)" }}>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Resume</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.application.jobTitle}</strong>
                    <br />
                    <small style={{ color: "#94a3b8" }}>{r.application.company}</small>
                    <br />
                    <small style={{ color: "#64748b" }}>📍 {r.application.location || "Remote"}</small>
                  </td>
                  <td>{r.filename}</td>
                  <td>
                    <span style={{ color: "#38bdf8", fontWeight: 600 }}>{r.application.status}</span>
                  </td>
                  <td>{new Date(r.application.appliedAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn" onClick={() => navigate("/applicant/jobs")}>
                      Browse Jobs
                    </button>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "var(--text-dim)" }}>
                    No applications yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
