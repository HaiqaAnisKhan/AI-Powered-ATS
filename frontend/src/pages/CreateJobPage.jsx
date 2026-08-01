import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    startDate: todayISO(),
    endDate: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMessage("");

    if (!form.endDate) {
      setMessage("Please choose a closing date.");
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setMessage("Closing date must be after the start date.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createJob(form);
      setMessage("Job created successfully!");
      setForm({ title: "", company: "", location: "", description: "", startDate: todayISO(), endDate: "" });
      setTimeout(() => navigate("/dashboard/jobs"), 800);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Create Job</h2>
      <p className="subtitle" style={{ marginTop: -4 }}>
        The job automatically unpublishes once the closing date passes.
      </p>

      <form onSubmit={submit}>
        <input
          className="input"
          placeholder="Job Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <input
          className="input"
          placeholder="Company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          required
        />

        <input
          className="input"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <label>Start date</label>
        <input
          className="input"
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          required
        />

        <label>Closing date</label>
        <input
          className="input"
          type="date"
          value={form.endDate}
          min={form.startDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          required
        />

        <textarea
          rows="8"
          placeholder="Job Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />

        <button className="btn" disabled={submitting}>
          {submitting ? "Creating..." : "Create Job"}
        </button>
      </form>

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}
