const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (username, password, role) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password, role }) }),

  getEmployees: () => request("/employees"),
  createEmployee: (data) =>
    request("/employees", { method: "POST", body: JSON.stringify(data) }),
  updateEmployee: (id, data) =>
    request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEmployee: (id) =>
    request(`/employees/${id}`, { method: "DELETE" }),

  getSchedule: (weekStart) =>
    request(`/schedule${weekStart ? `?week_start=${weekStart}` : ""}`),
  assignShift: (day, shift, employeeId, weekStart) =>
    request(`/schedule/${day}/${shift}`, {
      method: "PUT",
      body: JSON.stringify({ employeeId, week_start: weekStart })
    }),

  getAvailability: (employeeId) => request(`/availability/${employeeId}`),
  setAvailability: (employeeId, day, shift, status) =>
    request(`/availability/${employeeId}/${day}/${shift}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    })
};
