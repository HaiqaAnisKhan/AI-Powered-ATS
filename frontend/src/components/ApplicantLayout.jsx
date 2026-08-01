import { NavLink, Outlet } from "react-router-dom";

export default function ApplicantLayout() {
  return (
    <div className="app-layout">
      <div className="sidebar">
        <NavLink to="/applicant/jobs" className={({ isActive }) => (isActive ? "active" : "")}>
          Browse & Apply
        </NavLink>
        <NavLink to="/applicant/applications" className={({ isActive }) => (isActive ? "active" : "")}>
          My Applications
        </NavLink>
        <NavLink to="/applicant/profile" className={({ isActive }) => (isActive ? "active" : "")}>
          Profile & Resume
        </NavLink>
      </div>
      <div className="layout-content">
        <Outlet />
      </div>
    </div>
  );
}
