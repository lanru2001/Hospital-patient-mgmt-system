const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const message = data?.detail || res.statusText || "Request failed";
    throw new ApiError(
      typeof message === "string" ? message : JSON.stringify(message),
      res.status
    );
  }
  return data;
}

export const api = {
  login: (email, password) => {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    return request("/auth/login", { method: "POST", body: form, form: true });
  },
  listPatients: (token, q = "") =>
    request(`/patients${q ? `?q=${encodeURIComponent(q)}` : ""}`, { token }),
  getPatient: (token, id) => request(`/patients/${id}`, { token }),
  createPatient: (token, payload) =>
    request("/patients", { method: "POST", body: payload, token }),
  updatePatient: (token, id, payload) =>
    request(`/patients/${id}`, { method: "PATCH", body: payload, token }),
  deletePatient: (token, id) =>
    request(`/patients/${id}`, { method: "DELETE", token }),
};

export { ApiError };
