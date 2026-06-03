import { useState } from "react";
// Import all the tab content components
import EmployeeList from "./EmployeeList";
import RegisterEmployeeForm from "./RegisterEmployeeForm";
import JobSchedule from "./JobSchedule";
import WorkSchedule from "./WorkSchedule";

// EmployerView is the main dashboard for employers.
// It receives all the data and handler functions from App and passes them down to each tab.
export default function EmployerView({
  employees,
  schedule,
  availability,
  onRegisterEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onAssignShift,
  onUnassignShift,
  selectedEmployeeId,
  setSelectedEmployeeId,
  weekStartDate
}) {
  // "tab" controls which section is currently visible — defaults to the employee list
  const [tab, setTab] = useState("employees");

  return (
    <div className="content">
      {/* Navigation bar — each button switches the active tab */}
      <nav className="tabs">
        <button className={tab === "employees" ? "active" : ""} onClick={() => setTab("employees")}>
          Employees
        </button>
        <button className={tab === "register" ? "active" : ""} onClick={() => setTab("register")}>
          Register employee
        </button>
        <button className={tab === "jobschedule" ? "active" : ""} onClick={() => setTab("jobschedule")}>
          Job schedule
        </button>
        <button className={tab === "workschedule" ? "active" : ""} onClick={() => setTab("workschedule")}>
          Work schedule
        </button>
      </nav>

      {/* Show the employee list — clicking "Register" inside it switches to the register tab */}
      {tab === "employees" && (
        <EmployeeList employees={employees} onRegisterClick={() => setTab("register")} />
      )}

      {/* Show the register/edit form — passes handlers for creating, updating, and deleting */}
      {tab === "register" && (
        <RegisterEmployeeForm
          onSubmit={onRegisterEmployee}
          employees={employees}
          onUpdateEmployee={onUpdateEmployee}
          onDeleteEmployee={onDeleteEmployee}
        />
      )}

      {/* Show the job schedule — employer assigns employees to shift slots here */}
      {tab === "jobschedule" && (
        <JobSchedule
          employees={employees}
          schedule={schedule}
          availability={availability}
          onAssignShift={onAssignShift}
          onUnassignShift={onUnassignShift}
          selectedEmployeeId={selectedEmployeeId}
          setSelectedEmployeeId={setSelectedEmployeeId}
          weekStartDate={weekStartDate}
        />
      )}

      {/* Show the work schedule — a read-only overview of all assigned shifts */}
      {tab === "workschedule" && (
        <WorkSchedule employees={employees} schedule={schedule} availability={availability} />
      )}
    </div>
  );
}