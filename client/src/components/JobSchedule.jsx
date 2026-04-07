import { Fragment, useState } from "react";
import { DAYS, SHIFTS, SHIFT_COLORS } from "../constants";

const DAY_LABELS = {
  Mon: "Mon 6/4",
  Tue: "Tue 6/4",
  Wed: "Wed 1/4",
  Thu: "Thu 2/4",
  Fri: "Fri 3/4",
  Sat: "Sat 4/4",
  Sun: "Sun 5/4"
};

const DAY_ORDER = ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"];

const SHIFT_LABELS = {
  morning: "Morning shift",
  afternoon: "Afternoon shift",
  night: "Night shift"
};

const SHIFT_TIMES = {
  morning: "7-15",
  afternoon: "15-18",
  night: "18-23"
};

const CHIP_COLORS = {
  morning: "#A9CCF5",
  afternoon: "#E9B3B3",
  night: "#C9E3B8"
};

export default function JobSchedule({
  employees,
  schedule,
  onAssignShift,
  selectedEmployeeId,
  setSelectedEmployeeId
}) {
  const [replacementRequest, setReplacementRequest] = useState(null);

  const handleCellClick = (day, shift, assignedEmployee) => {
    if (!assignedEmployee) {
      onAssignShift(day, shift, selectedEmployeeId);
      return;
    }

    const requestedEmployee = employees.find((employee) => employee.id === selectedEmployeeId) || null;
    setReplacementRequest({
      day,
      shift,
      currentEmployee: assignedEmployee,
      requestedEmployee
    });
  };

  const closeReplacementModal = () => {
    setReplacementRequest(null);
  };

  const acceptReplacement = () => {
    if (!replacementRequest?.requestedEmployee) {
      closeReplacementModal();
      return;
    }

    onAssignShift(
      replacementRequest.day,
      replacementRequest.shift,
      replacementRequest.requestedEmployee.id
    );
    closeReplacementModal();
  };

  return (
    <>
      <div className="card job-card">
        <div className="job-header">
          <h2>Job Schedule</h2>
          <div className="job-brand">
            <div className="brand-title">Sundsgarden</div>
            <div className="brand-subtitle">HOTELL | KONFERENS</div>
          </div>
        </div>

        <label className="job-assign-control">
          Assign employee
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
          >
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>

        <div className="job-grid" role="grid">
          <div className="job-corner" />
          {DAY_ORDER.map((day) => (
            <div key={day} className="job-day-header">
              {DAY_LABELS[day]}
            </div>
          ))}

          {SHIFTS.map((shift) => (
            <Fragment key={shift}>
              <div className="job-shift-label">{SHIFT_LABELS[shift]}</div>
              {DAY_ORDER.map((day) => {
                const employeeId = schedule[day]?.[shift] ?? null;
                const assignedEmployee = employees.find((employee) => employee.id === employeeId);
                const badgeColor = assignedEmployee ? CHIP_COLORS[shift] : "#f3f4f6";

                return (
                  <button
                    key={`${day}-${shift}`}
                    type="button"
                    className="job-cell"
                    onClick={() => handleCellClick(day, shift, assignedEmployee)}
                  >
                    {assignedEmployee ? (
                      <div className="job-chip" style={{ backgroundColor: badgeColor, borderColor: SHIFT_COLORS[shift] }}>
                        <span className="job-chip-check" aria-hidden="true">✓</span>
                        <div className="job-chip-time">{SHIFT_TIMES[shift]}</div>
                        <div className="job-chip-name">{assignedEmployee.name}</div>
                      </div>
                    ) : (
                      <span className="job-available">Available</span>
                    )}
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {replacementRequest && (
        <div className="replacement-overlay" role="dialog" aria-modal="true">
          <div className="replacement-modal">
            <div className="replacement-people-row">
              <div className="replacement-person">
                <div className="replacement-avatar">👤</div>
                <div className="replacement-name">{replacementRequest.currentEmployee.name.split(" ")[0]}</div>
              </div>

              <div className="replacement-arrow">⇄</div>

              <div className="replacement-person">
                <div className="replacement-avatar">👤</div>
                <div className="replacement-name">
                  {replacementRequest.requestedEmployee
                    ? replacementRequest.requestedEmployee.name.split(" ")[0]
                    : "Select"}
                </div>
              </div>
            </div>

            <div className="replacement-title">Replacement</div>
            <div className="replacement-subtitle">Manager Approval</div>

            <div className="replacement-actions">
              <button type="button" className="replacement-decline" onClick={closeReplacementModal}>
                Decline
              </button>
              <button
                type="button"
                className="replacement-accept"
                onClick={acceptReplacement}
                disabled={
                  !replacementRequest.requestedEmployee ||
                  replacementRequest.requestedEmployee.id === replacementRequest.currentEmployee.id
                }
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
