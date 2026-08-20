import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function Field({ label, value, mono }) {
  return (
    <div className="record-field">
      <span className="k">{label}</span>
      <span className={`v ${mono ? "mono" : ""} ${!value ? "empty" : ""}`}>
        {value || "Not on file"}
      </span>
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const { token, role } = useAuth();
  const { refresh } = useOutletContext();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    api
      .getPatient(token, id)
      .then((p) => {
        setPatient(p);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [id, token]);

  async function handleDelete() {
    if (!window.confirm("Remove this patient record? This can be reversed by an administrator.")) return;
    await api.deletePatient(token, id);
    await refresh();
    navigate("/patients");
  }

  if (status === "loading") return <div className="detail-pane__empty">Loading chart…</div>;
  if (status === "error" || !patient)
    return <div className="detail-pane__empty">Couldn't find that patient.</div>;

  const canEdit = role === "admin" || role === "clinician";
  const canDelete = role === "admin";

  return (
    <section className="detail-pane">
      <div className="chart-header">
        <div>
          <h1>
            {patient.first_name} {patient.last_name}
          </h1>
          <div className="wristband">
            <span>{patient.mrn}</span>
            <span>·</span>
            <span>DOB {patient.date_of_birth}</span>
          </div>
        </div>
        <div className="header-actions">
          {canEdit && (
            <button className="btn btn-secondary" onClick={() => navigate(`/patients/${id}/edit`)}>
              Edit
            </button>
          )}
          {canDelete && (
            <button className="btn btn-danger" onClick={handleDelete}>
              Remove
            </button>
          )}
        </div>
      </div>

      {patient.allergies && (
        <div className="allergy-banner">
          <strong>Allergy on file:</strong> {patient.allergies}
        </div>
      )}

      <div className="record-grid">
        <Field label="Sex" value={patient.sex} />
        <Field label="Insurance ID" value={patient.insurance_id} mono />
        <Field label="Phone" value={patient.phone} />
        <Field label="Email" value={patient.email} />
        <Field label="Address" value={patient.address} />
      </div>

      <p className="section-label">Clinical notes</p>
      <div className="notes-block">{patient.notes || "No notes recorded."}</div>
    </section>
  );
}
