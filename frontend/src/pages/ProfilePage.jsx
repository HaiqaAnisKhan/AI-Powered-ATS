import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { api } from "../api";

export default function ProfilePage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nameMatchWarning, setNameMatchWarning] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.myResumes();
      setResumes(data.resumes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    setNameMatchWarning("");
    if (!file) {
      setError("Choose a PDF resume first.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const data = await api.uploadResume(formData);
      if (data.nameMatchWarning) setNameMatchWarning(data.nameMatchWarning);
      setFile(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h1>Profile & Resume</h1>
      <p className="subtitle">Your account details and resume history.</p>

      {error && <div className="error-box">{error}</div>}
      {nameMatchWarning && <div className="warning-box">⚠ {nameMatchWarning}</div>}

      <div className="card">
        <h2>Account</h2>
        <p>
          <strong>Name:</strong> {user?.name}
        </p>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
      </div>

      <div className="card">
        <h2>Upload a resume</h2>
        <p className="subtitle" style={{ marginTop: -4 }}>
          We check that your name or email actually appears on the file, as a basic safeguard against uploading the
          wrong CV.
        </p>
        <form onSubmit={handleUpload}>
          <input
            className="input"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button className="btn" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Resume history</h2>
        {loading ? (
          <p style={{ color: "var(--text-dim)" }}>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Uploaded</th>
                <th>Linked application</th>
              </tr>
            </thead>
            <tbody>
              {resumes.map((r) => (
                <tr key={r.id}>
                  <td>{r.filename}</td>
                  <td>{new Date(r.uploadedAt).toLocaleDateString()}</td>
                  <td>{r.application ? `${r.application.jobTitle} (${r.application.status})` : "-"}</td>
                </tr>
              ))}
              {resumes.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: 20, color: "var(--text-dim)" }}>
                    No resumes uploaded yet.
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
