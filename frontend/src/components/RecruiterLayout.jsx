import { NavLink, Outlet } from "react-router-dom";

export default function RecruiterLayout() {
  return (
    <div className="app-layout">
      <div className="sidebar">
        <NavLink to="/dashboard/overview" className={({ isActive }) => (isActive ? "active" : "")}>
          Overview
        </NavLink>
        <NavLink to="/dashboard/create-job" className={({ isActive }) => (isActive ? "active" : "")}>
          Create Job
        </NavLink>
        <NavLink to="/dashboard/jobs" className={({ isActive }) => (isActive ? "active" : "")}>
          My Jobs
        </NavLink>
        <NavLink to="/dashboard/candidates" className={({ isActive }) => (isActive ? "active" : "")}>
          All Candidates
        </NavLink>
      </div>
      <div className="layout-content">
        <Outlet />
      </div>
    </div>
  );
}
