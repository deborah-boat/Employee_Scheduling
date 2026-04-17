import { useState, useEffect, useCallback } from "react";
import "./index.css";
import { DAYS, SHIFTS, SHIFT_IDS, MOCK_EMPLOYEES } from "./constants";
import restaurant1 from "./assets/restaurant1.png";
import employerImg from "./assets/Employer.png";
import waiterImg from "./assets/Waiter.png";
import logo from "./assets/logo.png";
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

  // schedule[day][shift] = employeeId | null
  const [schedule, setSchedule] = useState(() => {
    const base = {};
    DAYS.forEach((d) => {
      base[d] = {};
      SHIFTS.forEach((s) => (base[d][s] = null));
    });
    base["Mon"].morning = [1, 2];
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

  // Inverse of SHIFT_IDS: { 1: "morning", 2: "afternoon", 3: "night" }
  const SHIFT_NAMES = Object.fromEntries(Object.entries(SHIFT_IDS).map(([k, v]) => [v, k]));

  // Load all employees' availability from the server and populate local state
  const loadAllAvailability = useCallback(async () => {
    const newAvailability = {};
    await Promise.all(
      employees.map(async (emp) => {
        try {
          const res = await fetch(`${API_BASE_URL}/availability/${emp.id}`);
          if (!res.ok) return;
          const records = await res.json();
          records.forEach((record) => {
            // Match the record's date to the current week's day key
            const recordDateStr = new Date(record.date).toISOString().split("T")[0];
            const dayIndex = DAYS.findIndex((_, i) => {
              const d = new Date(weekStartDate);
              d.setDate(d.getDate() + i);
              return d.toISOString().split("T")[0] === recordDateStr;
            });
            if (dayIndex === -1) return;
            const dayKey = DAYS[dayIndex];
            const shiftName = SHIFT_NAMES[record.shift_id];
            if (!shiftName) return;
            if (!newAvailability[emp.id]) newAvailability[emp.id] = {};
            if (!newAvailability[emp.id][dayKey]) newAvailability[emp.id][dayKey] = {};
            newAvailability[emp.id][dayKey][shiftName] = record.status;
          });
        } catch {
          // server unavailable — skip
        }
      })
    );
    setAvailability((prev) => ({ ...prev, ...newAvailability }));
  }, [employees, weekStartDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload availability from server whenever the user logs in
  useEffect(() => {
    if (user) {
      loadAllAvailability();
    }
  }, [user, loadAllAvailability]);

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
          const val = prev[day][shift];
          if (Array.isArray(val)) {
            const filtered = val.filter((id) => id !== employeeId);
            next[day][shift] = filtered.length === 0 ? null : filtered;
          } else {
            next[day][shift] = val === employeeId ? null : val;
          }
        });
      });

      return next;
    });
  };

  const handleAssignShift = (day, shift, employeeId) => {
    setSchedule((prev) => {
      const current = prev[day]?.[shift];
      const currentArr = Array.isArray(current) ? current : current != null ? [current] : [];
      if (currentArr.includes(employeeId)) return prev;
      const newArr = [...currentArr, employeeId];
      return {
        ...prev,
        [day]: { ...prev[day], [shift]: newArr }
      };
    });
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
      const current = prev[day]?.[shift];
      if (value === "unavailable") {
        if (Array.isArray(current) && current.includes(employeeId)) {
          const filtered = current.filter((id) => id !== employeeId);
          return { ...prev, [day]: { ...prev[day], [shift]: filtered.length === 0 ? null : filtered } };
        } else if (current === employeeId) {
          return { ...prev, [day]: { ...prev[day], [shift]: null } };
        }
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
      <div className="role-screen">
        <div className="role-screen__left" style={{ backgroundImage: `url(${restaurant1})` }}>
          <div className="role-screen__left-overlay">
            <h1 className="role-screen__brand">Sundsgården</h1>
            <p className="role-screen__tagline">Employee Scheduling System</p>
          </div>
        </div>
        <div className="role-screen__right">
          <p className="role-screen__title">Select your role to continue</p>
          <div className="role-cards">
            <button className="role-card" onClick={() => setRole("employer")}>
              <img src={employerImg} alt="Employer" className="role-card__image" />
              <div className="role-card__footer">
                <span className="role-card__title">Employer</span>
                <span className="role-card__btn">Click</span>
              </div>
            </button>
            <button className="role-card" onClick={() => setRole("employee")}>
              <img src={waiterImg} alt="Employee" className="role-card__image" />
              <div className="role-card__footer">
                <span className="role-card__title">Employee</span>
                <span className="role-card__btn">Click</span>
              </div>
            </button>
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
        <div className="topbar__left">
          <div className="topbar__brand">
            <img src={logo} alt="Sundsgården Logo" className="topbar__logo" />
          </div>
        </div>

        <div className="topbar__center">
          <span className="topbar__role">{user.role === "employer" ? "Employer" : "Employee"}</span>
        </div>

        <div className="topbar__right">
          <button className="topbar__notification" aria-label="Notifications">
            <svg className="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span className="notification-badge">1</span>
          </button>
          <div className="topbar__user">
            <div className="topbar__profile">
              <img 
                src={employerImg}
                alt={user.username}
                className="topbar__avatar"
              />
              <div className="topbar__info">
                <span className="topbar__username">{user.username}</span>
              </div>
            </div>
            <div className="topbar__menu">
              <button 
                className="topbar__menu-button"
                aria-label="User menu"
              >
                ⋮
              </button>
              <div className="topbar__dropdown">
                <div className="topbar__dropdown-header">
                  <img 
                    src={employerImg}
                    alt={user.username}
                    className="topbar__dropdown-avatar-image"
                  />
                  <div className="topbar__dropdown-info">
                    <div className="topbar__dropdown-name">{user.username}</div>
                    <div className="topbar__dropdown-role">{user.role === "employer" ? "HR Manager" : "Employee"}</div>
                  </div>
                </div>
                <button 
                  className="topbar__dropdown-logout"
                  onClick={() => { 
                    localStorage.removeItem(AUTH_STORAGE_KEY); 
                    setUser(null); 
                    setRole(null); 
                  }}
                >
                  <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="app-container">
        <aside className="welcome-card">
          <div className="welcome-card__overlay">
            <div className="welcome-card__header">
              <div className="welcome-card__icon">🌙</div>
              <p className="welcome-card__greeting">Welcome,</p>
            </div>
            
            <div className="welcome-card__content">
              <p className="welcome-card__text">You are logged as</p>
              <p className="welcome-card__role">{user.role === "employer" ? "Employer" : "Employee"}</p>
            </div>
          </div>

          <div className="welcome-card__background" style={{ backgroundImage: `url(${restaurant1})` }}>
          </div>

          <button className="welcome-card__settings" aria-label="Settings">
            <svg className="settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6"></path>
              <path d="M4.22 4.22l4.24 4.24"></path>
              <path d="M15.54 15.54l4.24 4.24"></path>
              <path d="M1 12h6m6 0h6"></path>
              <path d="M4.22 19.78l4.24-4.24"></path>
              <path d="M15.54 8.46l4.24-4.24"></path>
            </svg>
            <span className="settings-label">Settings</span>
          </button>
        </aside>

        <main className="app-main">
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
            />
          ) : (
            <EmployeeView
              employees={employees}
              schedule={schedule}
              availability={availability}
              onSetAvailability={handleSetAvailability}
              weekStartDate={weekStartDate}
              user={user}
            />
          )}
        </main>
      </div>
    </div>
  );
}