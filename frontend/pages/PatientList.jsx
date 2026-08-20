import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function formatDob(dob) {
  return new Date(dob + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PatientList() {
  const { token, role } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | error

  const refresh = useCallback(
    async (q = query) => {
      setStatus("loading");
      try {
        const data = await api.listPatients(token, q);
        setPatients(data);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    },
    [token, query]
  );

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => refresh(query), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const canCreate = role === "admin" || role === "clinician" || role === "staff";

  return (
    <div className="main-area">
      <aside className="list-pane">
        <div className="list-pane__header">
          <h2>Patients</h2>
          <input
            className="search-input"
            placeholder="Search by name or MRN…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search patients"
          />
        </div>

        {canCreate && (
          <div style={{ padding: "0.75rem 0.85rem 0" }}>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => navigate("/patients/new")}
            >
              + New patient
            </button>
          </div>
        )}

        {status === "error" && (
          <p className="list-pane__empty">Couldn't load patients. Try refreshing.</p>
        )}
        {status === "ready" && patients.length === 0 && (
          <p className="list-pane__empty">No patients match that search.</p>
        )}

        <ul className="chart-list">
          {patients.map((p) => (
            <li key={p.id}>
              <NavLink
                to={`/patients/${p.id}`}
                className={({ isActive }) =>
                  `chart-tab ${p.allergies ? "has-allergy" : ""} ${isActive ? "is-active" : ""}`
                }
              >
                <div className="chart-tab__name">
                  {p.last_name}, {p.first_name}
                </div>
                <div className="chart-tab__meta">
                  <span>{p.mrn}</span>
                  <span>·</span>
                  <span>{formatDob(p.date_of_birth)}</span>
                  {p.allergies && <span className="chart-tab__allergy-flag">⚠ Allergy</span>}
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      <Outlet context={{ refresh }} />
    </div>
  );
}
