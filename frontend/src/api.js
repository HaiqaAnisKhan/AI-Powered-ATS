const BASE = `${import.meta.env.VITE_API_URL}/api`;

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  uploadResume: (formData) => request("/resumes/upload", { method: "POST", body: formData, isForm: true }),
  analyzeResume: (id, jobId) =>
  request(`/resumes/${id}/analyze`, {
    method: "POST",
    body: { jobId },
  }),
  myResumes: () => request("/resumes/me"),
  allResumes: (query) => request(`/resumes${query ? "?" + query : ""}`),
  dashboardStats: () => request("/dashboard/stats"),
  createJob: (payload) => request("/jobs", {
    method: "POST", body: payload,
  }),
  getJobs: () => request("/jobs"),
  applyJob: (payload) =>
  request("/applications", {
    method: "POST",
    body: payload,
  }),
  getApplications: () =>
  request("/applications"),
  getMyJobs: () =>
  request("/jobs/mine"),
  getJobApplicants: (id) =>
  request(`/jobs/${id}/applicants`),
  updateApplicationStatus: (id, status) =>
  request(`/applications/${id}/status`, {
    method: "PATCH",
    body: { status },
  }),
  updateJobStatus: (id, status) =>
  request(`/jobs/${id}/status`, {
    method: "PATCH",
    body: { status },
  }),
};
