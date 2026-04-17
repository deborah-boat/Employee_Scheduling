import { useState } from "react";
import EmployeeList from "./EmployeeList";
import RegisterEmployeeForm from "./RegisterEmployeeForm";
import JobSchedule from "./JobSchedule";
import WorkSchedule from "./WorkSchedule";

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
  setSelectedEmployeeId
}) {
  const [tab, setTab] = useState("employees");

  return (
    <div className="content">
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

      {tab === "employees" && (
        <EmployeeList employees={employees} onRegisterClick={() => setTab("register")} />
      )}
      {tab === "register" && (
        <RegisterEmployeeForm
          onSubmit={onRegisterEmployee}
          employees={employees}
          onUpdateEmployee={onUpdateEmployee}
          onDeleteEmployee={onDeleteEmployee}
        />
      )}
      {tab === "jobschedule" && (
        <JobSchedule
          employees={employees}
          schedule={schedule}
          availability={availability}
          onAssignShift={onAssignShift}
          onUnassignShift={onUnassignShift}
          selectedEmployeeId={selectedEmployeeId}
          setSelectedEmployeeId={setSelectedEmployeeId}
        />
      )}
      {tab === "workschedule" && (
        <WorkSchedule employees={employees} schedule={schedule} availability={availability} />
      )}
    </div>
  );
}