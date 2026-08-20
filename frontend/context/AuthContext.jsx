import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

function decodeRole(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { role: payload.role, sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("pms_token"));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem("pms_token", token);
    else localStorage.removeItem("pms_token");
  }, [token]);

  const claims = useMemo(() => (token ? decodeRole(token) : null), [token]);

  // Treat an expired token as logged out.
  useEffect(() => {
    if (claims?.exp && claims.exp * 1000 < Date.now()) {
      setToken(null);
    }
  }, [claims]);

  async function login(email, password) {
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await api.login(email, password);
      setToken(access_token);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
  }

  const value = {
    token,
    role: claims?.role || null,
    isAuthenticated: !!token,
    login,
    logout,
    error,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
