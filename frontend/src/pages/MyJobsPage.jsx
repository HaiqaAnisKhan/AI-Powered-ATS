import { useEffect, useState } from "react";
import { api } from "../api";
import JobDetailModal from "../components/JobDetailModal";

export default function MyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getMyJobs();
      setJobs(data.jobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleStatusChange(jobId, status) {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  }

  return (
    <div>
      <h1>My Jobs</h1>
      <p className="subtitle">Click a job to see its full description and applicants.</p>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-dim)" }}>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Company</th>
                <th>Applicants</th>
                <th>Closes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} style={{ cursor: "pointer" }} onClick={() => setSelectedJob(job)}>
                  <td>{job.title}</td>
                  <td>{job.company}</td>
                  <td>{job.applications.length}</td>
                  <td>{job.endDate ? new Date(job.endDate).toLocaleDateString() : "-"}</td>
                  <td>
                    <span className={`pill ${job.status === "OPEN" ? "pill-open" : "pill-closed"}`}>
                      {job.status === "OPEN" ? "Published" : "Unpublished"}
                    </span>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "var(--text-dim)" }}>
                    No jobs created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
