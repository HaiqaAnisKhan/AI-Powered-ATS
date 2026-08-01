import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import RecruiterLayout from "./components/RecruiterLayout";
import ApplicantLayout from "./components/ApplicantLayout";
import AuthPage from "./pages/AuthPage";
import RecruiterOverviewPage from "./pages/RecruiterOverviewPage";
import CreateJobPage from "./pages/CreateJobPage";
import MyJobsPage from "./pages/MyJobsPage";
import CandidatesPage from "./pages/CandidatesPage";
import JobsBrowsePage from "./pages/JobsBrowsePage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<AuthPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireRole="recruiter">
                <RecruiterLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<RecruiterOverviewPage />} />
            <Route path="create-job" element={<CreateJobPage />} />
            <Route path="jobs" element={<MyJobsPage />} />
            <Route path="candidates" element={<CandidatesPage />} />
          </Route>

          <Route
            path="/applicant"
            element={
              <ProtectedRoute requireRole="applicant">
                <ApplicantLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="jobs" replace />} />
            <Route path="jobs" element={<JobsBrowsePage />} />
            <Route path="applications" element={<MyApplicationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
