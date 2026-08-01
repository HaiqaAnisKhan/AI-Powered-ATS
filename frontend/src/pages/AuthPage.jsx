import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "applicant" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await api.login({ email: form.email, password: form.password })
          : await api.signup(form);
      login(data.token, data.user);
      navigate(data.user.role === "recruiter" ? "/dashboard" : "/applicant");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell" style={{ maxWidth: 420, marginTop: 60 }}>
      <div className="card">
        <h1>AI-Powered Applicant Tracking System</h1>
        <p className="subtitle">Intelligent recruitment powered by AI-driven resume analysis and applicant tracking.</p>

        <div className="auth-toggle">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Log In
          </button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
            Sign Up
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label>Full name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </>
          )}

          <label>Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />

          <label>Password</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            minLength={6}
          />

          {mode === "signup" && (
            <>
              <label>I am a...</label>
              <select value={form.role} onChange={(e) => update("role", e.target.value)}>
                <option value="applicant">Applicant (checking my resume)</option>
                <option value="recruiter">Recruiter (reviewing candidates)</option>
              </select>
            </>
          )}

          <button className="btn" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
