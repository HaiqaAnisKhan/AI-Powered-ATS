import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function ProtectedRoute({ children, requireRole }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (requireRole && user.role !== requireRole) {
    return <Navigate to={user.role === "recruiter" ? "/dashboard" : "/applicant"} replace />;
  }
  return children;
}
