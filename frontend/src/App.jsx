import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import PatientList from "./pages/PatientList";
import PatientDetail from "./pages/PatientDetail";
import PatientForm from "./pages/PatientForm";
import PatientEmptyState from "./pages/PatientEmptyState";

function Shell() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="app-shell">
      {isAuthenticated && <Topbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <PatientList />
            </ProtectedRoute>
          }
        >
          <Route index element={<PatientEmptyState />} />
          <Route path="new" element={<PatientForm />} />
          <Route path=":id" element={<PatientDetail />} />
          <Route path=":id/edit" element={<PatientForm />} />
        </Route>
        <Route path="/" element={<Navigate to="/patients" replace />} />
        <Route path="*" element={<Navigate to="/patients" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
