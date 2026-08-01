import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../api";

export default function RecruiterOverviewPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .dashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Recruiter Dashboard</h1>
      <p className="subtitle">Overview of all applicant resumes and AI match scores.</p>

      {error && <div className="error-box">{error}</div>}
      {loading && <p style={{ color: "var(--text-dim)" }}>Loading...</p>}

      {stats && (
        <>
          <div className="stat-grid">
            <div className="stat-box">
              <div className="value">{stats.totalApplicants}</div>
              <div className="label">Applicants</div>
            </div>
            <div className="stat-box">
              <div className="value">{stats.totalResumes}</div>
              <div className="label">Resumes submitted</div>
            </div>
            <div className="stat-box">
              <div className="value">{stats.totalAnalyses}</div>
              <div className="label">Analyses run</div>
            </div>
            <div className="stat-box">
              <div className="value">{stats.avgScore}</div>
              <div className="label">Avg match score</div>
            </div>
          </div>

          <div className="card">
            <h2>Score distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
