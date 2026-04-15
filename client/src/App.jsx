import { useState } from "react";
import "./index.css";
import { DAYS, SHIFTS, SHIFT_IDS, MOCK_EMPLOYEES } from "./constants";
import LoginScreen from "./components/LoginScreen";
import EmployerView from "./components/EmployerView";
import EmployeeView from "./components/EmployeeView";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const AUTH_STORAGE_KEY = "employee-auth";

function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { role: null, user: null };

    const parsed = JSON.parse(raw);
    if (!parsed?.user || !parsed?.role) {
      return { role: null, user: null };
    }

    return {
      role: parsed.role,
      user: parsed.user
    };
  } catch {
    return { role: null, user: null };
  }
}

export default function App() {
  const storedAuth = getStoredAuth();

  const [role, setRole] = useState(storedAuth.role);
  const [user, setUser] = useState(storedAuth.user);
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(1);

  const welcomeName = user
    ? String(user.username).split("@")[0].split(" ")[0]
    : "";
  const welcomeRole = user
    ? String(user.role).toUpperCase()
    : "";

  // schedule[day][shift] = employeeId | null
  const [schedule, setSchedule] = useState(() => {
    const base = {};
    DAYS.forEach((d) => {
      base[d] = {};
      SHIFTS.forEach((s) => (base[d][s] = null));
    });
    base["Mon"].morning = 1;
    base["Mon"].afternoon = 2;
    return base;
  });

  // availability[employeeId][day][shift] = "available" | "unavailable"
  const [availability, setAvailability] = useState({});

  // Reference Monday for the current week — used to compute real dates from day names
  const [weekStartDate] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Convert a day abbreviation ("Mon", "Tue", ...) to a YYYY-MM-DD date string
  const dayToDate = (day) => {
    const index = DAYS.indexOf(day); // DAYS starts on Monday
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + index);
    return date.toISOString().split("T")[0];
  };

  const handleLogin = async ({ email, password, rememberMe }) => {
    if (!role) {
      return { ok: false, message: "Please select a role first." };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          role,
          rememberMe
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          message: data?.message || "Login failed"
        };
      }

      setUser({
        id: data.user?.id,
        username: data.user?.displayName || data.user?.email || email,
        email: data.user?.email || email,
        role: data.user?.role || role,
        token: data.token
      });

      if (rememberMe) {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            role: data.user?.role || role,
            user: {
              id: data.user?.id,
              username: data.user?.displayName || data.user?.email || email,
              email: data.user?.email || email,
              role: data.user?.role || role,
              token: data.token
            }
          })
        );
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return { ok: true };
    } catch {
      return {
        ok: false,
        message: "Unable to reach server. Please try again."
      };
    }
  };

  const handleRegisterEmployee = (data) => {
    const id = employees.length + 1;
    const newEmp = { id, ...data };
    setEmployees((prev) => [...prev, newEmp]);
  };

  const handleUpdateEmployee = (employeeId, updates) => {
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === employeeId
          ? { ...employee, ...updates }
          : employee
      )
    );
  };

  const handleDeleteEmployee = (employeeId) => {
    setEmployees((prev) => {
      const nextEmployees = prev.filter((employee) => employee.id !== employeeId);
      if (selectedEmployeeId === employeeId) {
        setSelectedEmployeeId(nextEmployees[0]?.id ?? null);
      }
      return nextEmployees;
    });

    setAvailability((prev) => {
      const nextAvailability = { ...prev };
      delete nextAvailability[employeeId];
      return nextAvailability;
    });

    setSchedule((prev) => {
      const next = {};

      DAYS.forEach((day) => {
        next[day] = {};
        SHIFTS.forEach((shift) => {
          next[day][shift] = prev[day][shift] === employeeId ? null : prev[day][shift];
        });
      });

      return next;
    });
  };

  const handleAssignShift = (day, shift, employeeId) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [shift]: employeeId }
    }));
  };

  const handleSetAvailability = async (employeeId, day, shift, value) => {
    // Update local state immediately (optimistic)
    setAvailability((prev) => ({
      ...prev,
      [employeeId]: {
        ...(prev[employeeId] || {}),
        [day]: {
          ...((prev[employeeId] || {})[day] || {}),
          [shift]: value
        }
      }
    }));

    // If the employee is now unavailable and was assigned to this slot, free it
    setSchedule((prev) => {
      const current = prev[day]?.[shift] ?? null;
      if (value === "unavailable" && current === employeeId) {
        return { ...prev, [day]: { ...prev[day], [shift]: null } };
      }
      return prev;
    });

    // Persist to the server
    try {
      await fetch(`${API_BASE_URL}/availability/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dayToDate(day),
          shift_id: SHIFT_IDS[shift],
          status: value
        })
      });
    } catch {
      // Server is unreachable — local state already updated, no further action needed
    }
  };

  if (!role) {
    return (
      <div className="app">
        <div className="card narrow">
          <h1>Sundsgården</h1>
          <p>Select role to continue:</p>
          <div className="role-buttons">
            <button onClick={() => setRole("employer")}>Employer</button>
            <button onClick={() => setRole("employee")}>Employee</button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen role={role} onLogin={handleLogin} onBack={() => setRole(null)} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>Sundsgården – {user.role === "employer" ? "Employer" : "Employee"}</div>
        <div>
          <span className="username">{user.username}</span>
          <button onClick={() => { localStorage.removeItem(AUTH_STORAGE_KEY); setUser(null); setRole(null); }}>Logout</button>
        </div>
      </header>

      <main className="welcome-layout">
        <section className="welcome-center">
          <h1>Welcome, {welcomeName}!</h1>
          <p>
            You are logged in as <strong>{welcomeRole}</strong>.
          </p>
        </section>
      </main>

      {user.role === "employer" ? (
        <EmployerView
          employees={employees}
          schedule={schedule}
          availability={availability}
          onRegisterEmployee={handleRegisterEmployee}
          onUpdateEmployee={handleUpdateEmployee}
          onDeleteEmployee={handleDeleteEmployee}
          onAssignShift={handleAssignShift}
          selectedEmployeeId={selectedEmployeeId}
          setSelectedEmployeeId={setSelectedEmployeeId}
          weekStartDate={weekStartDate}
        />
      ) : (
        <EmployeeView
          employees={employees}
          schedule={schedule}
          availability={availability}
          onSetAvailability={handleSetAvailability}
          weekStartDate={weekStartDate}
        />
      )}
    </div>
  );
}