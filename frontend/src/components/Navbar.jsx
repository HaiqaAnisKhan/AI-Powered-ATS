import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="navbar">
      <div className="brand">AI-powered Applicant Tracking System</div>
      <div className="nav-right">
        <span>{user.name}</span>
        <span className="role-badge">{user.role}</span>
        <button className="btn btn-secondary" onClick={handleLogout}>Log out</button>
      </div>
    </div>
  );
}
