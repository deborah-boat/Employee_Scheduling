import { Fragment, useState } from "react";
import { SHIFTS, DAYS } from "../constants";

const today = new Date();
const day = today.getDay();
const diff = day === 0 ? -6 : 1 - day;

const weekStartDate = new Date(today);
weekStartDate.setDate(today.getDate() + diff);

const DAY_LABELS = DAYS.map((day, index) => {
    if (weekStartDate) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + index);
      return { day, label: `${day} ${date.getDate()}/${date.getMonth() + 1}` };
    }
    return { day, label: day };
  });

const DAY_ORDER = ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"];

const SHIFT_LABELS = {
  morning: "Morning shift",
  afternoon: "Afternoon shift",
  night: "Night shift"
};

const SHIFT_TIMES = {
  morning: "07-16:00",
  afternoon: "15:30-22:00",
  night: "21:30-07:15"
};

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function JobSchedule({
  employees,
  schedule,
  availability,
  onAssignShift,
  selectedEmployeeId,
  setSelectedEmployeeId
}) {
  // { mode: "assign"|"replace", day, shift, employee, avStatus, currentEmployee? }
  const [confirmRequest, setConfirmRequest] = useState(null);

  const handleCellClick = (day, shift) => {
    const assignedId = schedule[day]?.[shift] ?? null;
    const assignedEmployee = employees.find((e) => e.id === assignedId) || null;
    const employee = employees.find((e) => e.id === selectedEmployeeId);
    const avStatus = availability?.[selectedEmployeeId]?.[day]?.[shift] ?? null;

    if (assignedEmployee) {
      setConfirmRequest({ mode: "replace", day, shift, employee, avStatus, currentEmployee: assignedEmployee });
    } else {
      setConfirmRequest({ mode: "assign", day, shift, employee, avStatus });
    }
  };

  const closeModal = () => setConfirmRequest(null);

  const handleAccept = () => {
    if (!confirmRequest) return;
    onAssignShift(confirmRequest.day, confirmRequest.shift, confirmRequest.employee.id);
    closeModal();
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

        <div className="job-grid-scroll">
        <div className="job-grid" role="grid">
          <div className="job-corner" />
          {DAY_LABELS.map(({day, label}) => (
            <div key={day} className="job-day-header">{label}</div>
          ))}

          {SHIFTS.map((shift) => (
            <Fragment key={shift}>
              <div className="job-shift-label">{SHIFT_LABELS[shift]}</div>
              {DAY_ORDER.map((day) => {
                const assignedId = schedule[day]?.[shift] ?? null;
                const assignedEmployee = employees.find((e) => e.id === assignedId) || null;
                const avStatus = availability?.[selectedEmployeeId]?.[day]?.[shift] ?? null;
                const selEmp = employees.find((e) => e.id === selectedEmployeeId);

                // ── Slot already confirmed ──────────────────────────────
                if (assignedEmployee) {
                  return (
                    <button
                      key={`${day}-${shift}`}
                      type="button"
                      className="job-cell"
                      onClick={() => handleCellClick(day, shift)}
                    >
                      <div className="jc-card jc-card-confirmed">
                        <div className="jc-avatar jc-av-confirmed">{initials(assignedEmployee.name)}</div>
                        <div className="jc-info">
                          <span className="jc-name">{assignedEmployee.name}</span>
                          <span className="jc-badge jc-badge-confirmed">✓ Confirmed</span>
                        </div>
                      </div>
                    </button>
                  );
                }

                // ── Employee marked available ───────────────────────────
                if (avStatus === "available") {
                  return (
                    <button
                      key={`${day}-${shift}`}
                      type="button"
                      className="job-cell"
                      onClick={() => handleCellClick(day, shift)}
                    >
                      <div className="jc-card jc-card-available">
                        <div className="jc-avatar jc-av-available">{initials(selEmp.name)}</div>
                        <div className="jc-info">
                          <span className="jc-name">{selEmp.name}</span>
                          <span className="jc-badge jc-badge-available">Available</span>
                        </div>
                      </div>
                    </button>
                  );
                }

                // ── Employee marked unavailable ────────────────────────
                if (avStatus === "unavailable") {
                  return (
                    <button
                      key={`${day}-${shift}`}
                      type="button"
                      className="job-cell"
                      onClick={() => handleCellClick(day, shift)}
                    >
                      <div className="jc-card jc-card-unavailable">
                        <div className="jc-avatar jc-av-unavailable">{initials(selEmp.name)}</div>
                        <div className="jc-info">
                          <span className="jc-name">{selEmp.name}</span>
                          <span className="jc-badge jc-badge-unavailable">Unavailable</span>
                        </div>
                      </div>
                    </button>
                  );
                }

                // ── No availability set ────────────────────────────────
                return (
                  <button
                    key={`${day}-${shift}`}
                    type="button"
                    className="job-cell job-cell-empty"
                    onClick={() => handleCellClick(day, shift)}
                  >
                    <span className="job-available">—</span>
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
        </div>
      </div>

      {confirmRequest && (
        <div className="jc-overlay" onClick={closeModal}>
          <div className="jc-modal" onClick={(e) => e.stopPropagation()}>

            {confirmRequest.mode === "replace" ? (
              <>
                <h3 className="jc-modal-title">Replacement</h3>
                <p className="jc-modal-sub">Manager Approval</p>
                <div className="jc-modal-swap">
                  <div className="jc-modal-person">
                    <div className="jc-avatar jc-av-confirmed jc-av-lg">{initials(confirmRequest.currentEmployee.name)}</div>
                    <span className="jc-modal-pname">{confirmRequest.currentEmployee.name.split(" ")[0]}</span>
                    <span className="jc-badge jc-badge-confirmed">Current</span>
                  </div>
                  <span className="jc-swap-arrow">⇄</span>
                  <div className="jc-modal-person">
                    <div className={`jc-avatar jc-av-lg ${confirmRequest.avStatus === "unavailable" ? "jc-av-unavailable" : "jc-av-available"}`}>
                      {initials(confirmRequest.employee.name)}
                    </div>
                    <span className="jc-modal-pname">{confirmRequest.employee.name.split(" ")[0]}</span>
                    <span className={`jc-badge ${confirmRequest.avStatus === "unavailable" ? "jc-badge-unavailable" : "jc-badge-available"}`}>
                      {confirmRequest.avStatus === "unavailable" ? "Unavailable" : "Available"}
                    </span>
                  </div>
                </div>
                {confirmRequest.avStatus === "unavailable" && (
                  <p className="jc-modal-warning">⚠ This employee marked this shift as unavailable.</p>
                )}
              </>
            ) : (
              <>
                <div className="jc-modal-person jc-modal-single">
                  <div className={`jc-avatar jc-av-lg ${confirmRequest.avStatus === "unavailable" ? "jc-av-unavailable" : "jc-av-available"}`}>
                    {initials(confirmRequest.employee.name)}
                  </div>
                  <div className="jc-modal-pinfo">
                    <span className="jc-modal-pname-lg">{confirmRequest.employee.name}</span>
                    <span className="jc-modal-shift">{SHIFT_LABELS[confirmRequest.shift]} · {SHIFT_TIMES[confirmRequest.shift]}</span>
                  </div>
                </div>
                <h3 className="jc-modal-title">
                  {confirmRequest.avStatus === "unavailable" ? "Assign anyway?" : "Confirm shift?"}
                </h3>
                {confirmRequest.avStatus === "unavailable" && (
                  <p className="jc-modal-warning">⚠ This employee marked this shift as unavailable.</p>
                )}
              </>
            )}

            <div className="jc-modal-actions">
              <button type="button" className="jc-btn-decline" onClick={closeModal}>Decline</button>
              <button type="button" className="jc-btn-accept" onClick={handleAccept}>Accept</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

