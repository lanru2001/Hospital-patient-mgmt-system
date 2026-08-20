import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__mark" aria-hidden="true" />
        Chartline
      </div>
      {role && (
        <div className="topbar__user">
          <span className="role-badge">{role}</span>
          <button className="btn-link" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
