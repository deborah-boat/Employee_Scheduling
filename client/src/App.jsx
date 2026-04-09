import { useState } from "react";
import "./index.css";
import { DAYS, SHIFTS, MOCK_EMPLOYEES } from "./constants";
import LoginScreen from "./components/LoginScreen";
import EmployerView from "./components/EmployerView";
import EmployeeView from "./components/EmployeeView";

export default function App() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(1);

  const welcomeMessage = user
    ? user.role === "employer"
      ? `Welcome back, ${user.username}. You are in the Employer dashboard.`
      : `Welcome back, ${user.username}. You are in the Employee dashboard.`
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

  const handleLogin = (username) => {
    if (!role) return;
    setUser({ username, role });
  };

  const handleRegisterEmployee = (data) => {
    const id = employees.length + 1;
    const newEmp = { id, ...data };
    setEmployees((prev) => [...prev, newEmp]);
  };

  const handleAssignShift = (day, shift, employeeId) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [shift]: employeeId }
    }));
  };

  const handleSetAvailability = (employeeId, day, shift, value) => {
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
          <button onClick={() => { setUser(null); setRole(null); }}>Logout</button>
        </div>
      </header>

      <div className="content">
        <div className="card welcome-card">
          <h2>{welcomeMessage}</h2>
        </div>
      </div>

      {user.role === "employer" ? (
        <EmployerView
          employees={employees}
          schedule={schedule}
          availability={availability}
          onRegisterEmployee={handleRegisterEmployee}
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
        />
      )}
    </div>
  );
}
