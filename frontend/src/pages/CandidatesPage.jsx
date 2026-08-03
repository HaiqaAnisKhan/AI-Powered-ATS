import { useEffect, useState } from "react";
import { api } from "../api";
import ApplicantDetailModal from "../components/ApplicantDetailModal";

export default function CandidatesPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.getMyJobs().then((data) => setJobs(data.jobs));
  }, []);

  async function loadGeneral() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (minScore) params.set("minScore", minScore);
      const data = await api.allResumes(params.toString());
      setCandidates(data.resumes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadForJob(jobId) {
    setLoading(true);
    setError("");
    try {
      const data = await api.getJobApplicants(jobId);
      setSelectedJob(data.job);
      let apps = data.applications;
      if (minScore) {
        apps = apps.filter((a) => a.resume?.analyses?.[0] && a.resume.analyses[0].score >= Number(minScore));
      }
      setCandidates(
        apps.map((a) => ({
          id: a.resume?.id,
          applicationId: a.id,
          filename: a.resume?.filename,
          applicant: a.applicant,
          latestScore: a.resume?.analyses?.[0]?.score ?? null,
          latestFeedback: a.resume?.analyses?.[0]?.feedback ? JSON.parse(a.resume.analyses[0].feedback) : null,
          rawAnalysis: a.resume?.analyses?.[0] || null,
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedJobId) {
      loadForJob(selectedJobId);
    } else {
      setSelectedJob(null);
      loadGeneral();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId]);

  function handleFilterSubmit(e) {
    e.preventDefault();
    if (selectedJobId) loadForJob(selectedJobId);
    else loadGeneral();
  }

  return (
    <div>
      <h1>All Candidates</h1>
      <p className="subtitle">Search across every applicant, or pick a job to see only its applicants.</p>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <form className="filter-row" onSubmit={handleFilterSubmit}>
          <select className="input" value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
            <option value="">All jobs (search everyone)</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} - {job.company}
              </option>
            ))}
          </select>

          {!selectedJobId && (
            <input
              className="input"
              placeholder="Search by name, email, or filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          <input
            className="input"
            style={{ maxWidth: 140 }}
            type="number"
            placeholder="Min score"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
          />

          <button className="btn" style={{ maxWidth: 120 }}>
            Filter
          </button>
        </form>

        {selectedJob && (
          <div
            style={{
              marginTop: 4,
              marginBottom: 20,
              padding: 18,
              border: "1px solid #334155",
              borderRadius: 10,
              background: "#172033",
            }}
          >
            <h3 style={{ marginBottom: 10 }}>{selectedJob.title}</h3>
            <p>
              <strong>Company:</strong> {selectedJob.company}
            </p>
            <p style={{ marginTop: 10, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{selectedJob.description}</p>
          </div>
        )}

        {loading ? (
          <p style={{ color: "var(--text-dim)" }}>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Email</th>
                <th>Resume</th>
                <th>AI Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id}>
                  <td>{c.applicant.name}</td>
                  <td>{c.applicant.email}</td>
                  <td>{c.filename}</td>
                  <td>{c.latestScore !== null ? `${c.latestScore}%` : "-"}</td>
                  <td>
                    {(c.applicationId || c.latestScore !== null) && (
                      <button className="btn" onClick={() => setSelected(c)}>
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "var(--text-dim)" }}>
                    No candidates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <ApplicantDetailModal
          applicationId={selected.applicationId}
          applicantName={selected.applicant?.name}
          analysis={
            selected.rawAnalysis ||
            (selected.latestScore !== null
              ? { score: selected.latestScore, feedback: JSON.stringify(selected.latestFeedback) }
              : null)
          }
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
