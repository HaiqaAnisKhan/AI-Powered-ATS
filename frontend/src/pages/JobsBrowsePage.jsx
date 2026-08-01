import { useEffect, useState } from "react";
import { api } from "../api";

export default function JobsBrowsePage() {
  const [file, setFile] = useState(null);
  const [uploadedResumeId, setUploadedResumeId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [nameMatchWarning, setNameMatchWarning] = useState("");
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [latestResult, setLatestResult] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);

  async function loadAppliedJobs() {
    try {
      const data = await api.myResumes();
      setAppliedJobs([...new Set(data.resumes.filter((r) => r.application).map((r) => r.application.jobId))]);
    } catch {
      // ignore on first load
    }
  }

  useEffect(() => {
    loadAppliedJobs();
    api.getJobs().then((data) => setJobs(data.jobs));
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    setNameMatchWarning("");
    if (!file) {
      setError("Please choose a PDF resume first.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const data = await api.uploadResume(formData);
      setUploadedResumeId(data.resume.id);
      if (data.nameMatchWarning) setNameMatchWarning(data.nameMatchWarning);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    setError("");
    if (!uploadedResumeId) {
      setError("Upload a resume first.");
      return;
    }
    if (!selectedJob) {
      setError("Please select a job.");
      return;
    }
    setAnalyzing(true);
    try {
      const data = await api.analyzeResume(uploadedResumeId, selectedJob);
      await api.applyJob({ jobId: selectedJob, resumeId: uploadedResumeId });
      setLatestResult(data.analysis);
      loadAppliedJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      <h1>Job Applications</h1>
      <p className="subtitle">Browse available jobs and submit your application.</p>

      {error && <div className="error-box">{error}</div>}
      {nameMatchWarning && <div className="warning-box">⚠ {nameMatchWarning}</div>}

      <div className="card">
        <h2>1. Upload resume (PDF)</h2>
        <form onSubmit={handleUpload}>
          <input
            className="input"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button className="btn" disabled={uploading || analyzing}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
          {analyzing && <p style={{ marginTop: 12, color: "#38bdf8" }}>AI is analyzing your resume...</p>}
          {uploadedResumeId && (
            <span style={{ marginLeft: 12, color: "var(--good)", fontSize: 13 }}>
              ✓ Uploaded — ready to analyze
            </span>
          )}
        </form>
      </div>

      <div className="card">
        <h2>2. Select Job</h2>

        <select
          className="input"
          value={selectedJob || ""}
          disabled={analyzing}
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelectedJob(id);
            const job = jobs.find((j) => j.id === id);
            setSelectedJobDetails(job);
          }}
        >
          <option value="">Choose a Job</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title} - {job.company}
            </option>
          ))}
        </select>

        {selectedJobDetails && (
          <div
            style={{
              marginTop: 20,
              padding: 18,
              border: "1px solid #334155",
              borderRadius: 10,
              background: "#172033",
            }}
          >
            <h3 style={{ marginBottom: 10 }}>{selectedJobDetails.title}</h3>
            <p>
              <strong>Company:</strong> {selectedJobDetails.company}
            </p>
            <p>
              <strong>Location:</strong> {selectedJobDetails.location}
            </p>
            {selectedJobDetails.endDate && (
              <p>
                <strong>Closes:</strong> {new Date(selectedJobDetails.endDate).toLocaleDateString()}
              </p>
            )}
            <div style={{ marginTop: 15 }}>
              <strong>Job Description</strong>
              <p style={{ marginTop: 8, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>
                {selectedJobDetails.description}
              </p>
            </div>
          </div>
        )}

        <button
          className="btn"
          style={{ marginTop: 16 }}
          onClick={handleAnalyze}
          disabled={analyzing || appliedJobs.includes(selectedJob)}
        >
          {appliedJobs.includes(selectedJob) ? "Already Applied" : analyzing ? "Analyzing..." : "Apply & Analyze"}
        </button>
      </div>

      {latestResult && (
        <div className="card">
          <h2>Application Submitted ✅</h2>
          <p style={{ marginTop: 12 }}>Your application has been submitted successfully.</p>
          <p style={{ marginTop: 10 }}>
            <strong>Status:</strong>
            <span style={{ color: "#38bdf8", marginLeft: 8 }}>Applied</span>
          </p>
          <p style={{ marginTop: 16, color: "#94a3b8" }}>Your application is now waiting for recruiter review.</p>
        </div>
      )}
    </div>
  );
}
