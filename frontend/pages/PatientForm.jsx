import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const EMPTY = {
  mrn: "",
  first_name: "",
  last_name: "",
  date_of_birth: "",
  sex: "",
  phone: "",
  email: "",
  address: "",
  insurance_id: "",
  allergies: "",
  notes: "",
};

export default function PatientForm() {
  const { id } = useParams(); // present when editing
  const isEdit = !!id;
  const { token } = useAuth();
  const { refresh } = useOutletContext();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.getPatient(token, id).then((p) =>
      setForm({ ...EMPTY, ...p, date_of_birth: p.date_of_birth })
    );
  }, [id, isEdit, token]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        // MRN and DOB are immutable once created — send only editable fields
        const { mrn, date_of_birth, ...editable } = form;
        await api.updatePatient(token, id, editable);
        await refresh();
        navigate(`/patients/${id}`);
      } else {
        const created = await api.createPatient(token, form);
        await refresh();
        navigate(`/patients/${created.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="form-page">
      <h1>{isEdit ? "Edit patient" : "New patient"}</h1>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="first_name">First name</label>
            <input
              id="first_name"
              required
              value={form.first_name}
              onChange={(e) => update("first_name", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="last_name">Last name</label>
            <input
              id="last_name"
              required
              value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="mrn">Medical record number</label>
            <input
              id="mrn"
              required
              disabled={isEdit}
              value={form.mrn}
              onChange={(e) => update("mrn", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="dob">Date of birth</label>
            <input
              id="dob"
              type="date"
              required
              disabled={isEdit}
              value={form.date_of_birth}
              onChange={(e) => update("date_of_birth", e.target.value)}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="sex">Sex</label>
            <select id="sex" value={form.sex || ""} onChange={(e) => update("sex", e.target.value)}>
              <option value="">Not specified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="insurance_id">Insurance ID</label>
            <input
              id="insurance_id"
              value={form.insurance_id || ""}
              onChange={(e) => update("insurance_id", e.target.value)}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email || ""}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="address">Address</label>
          <input id="address" value={form.address || ""} onChange={(e) => update("address", e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="allergies">Allergies</label>
          <input
            id="allergies"
            placeholder="e.g. Penicillin, latex"
            value={form.allergies || ""}
            onChange={(e) => update("allergies", e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="notes">Clinical notes</label>
          <textarea
            id="notes"
            rows={5}
            value={form.notes || ""}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create patient"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(isEdit ? `/patients/${id}` : "/patients")}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
