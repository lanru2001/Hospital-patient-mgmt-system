export default function PatientEmptyState() {
  return (
    <div className="detail-pane" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p className="detail-pane__empty">Select a patient from the list, or create a new chart.</p>
    </div>
  );
}
