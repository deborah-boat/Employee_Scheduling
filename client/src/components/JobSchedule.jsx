import { Fragment, useState } from "react";
import { SHIFTS } from "../constants";
import "../styles/JobSchedule.css";

const DAY_LABELS = {
  Mon: "Mon 6/4",
  Tue: "Tue 7/4",
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
  const [dontShowAgain, setDontShowAgain] = useState(false);
  // { [day]: { [shift]: true } } — tracks employer-declined slots
  const [declinedShifts, setDeclinedShifts] = useState({});

  const handleCellClick = (day, shift) => {
    const raw = schedule[day]?.[shift] ?? null;
    const assignedIds = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
    const isSelectedAssigned = assignedIds.includes(selectedEmployeeId);
    const employee = employees.find((e) => e.id === selectedEmployeeId);
    const avStatus = availability?.[selectedEmployeeId]?.[day]?.[shift] ?? null;

    // If the selected employee is already in this slot, do nothing
    if (isSelectedAssigned) return;

    const otherEmployee = employees.find((e) => assignedIds.includes(e.id) && e.id !== selectedEmployeeId) || null;
    if (otherEmployee) {
      setConfirmRequest({ mode: "replace", day, shift, employee, avStatus, currentEmployee: otherEmployee });
    } else {
      setConfirmRequest({ mode: "assign", day, shift, employee, avStatus });
    }
  };

  const closeModal = () => setConfirmRequest(null);

  const handleAccept = () => {
    if (!confirmRequest) return;
    // Clear any prior declined state for this slot
    setDeclinedShifts((prev) => {
      const next = { ...prev };
      if (next[confirmRequest.day]) {
        const d = { ...next[confirmRequest.day] };
        delete d[confirmRequest.shift];
        next[confirmRequest.day] = d;
      }
      return next;
    });
    onAssignShift(confirmRequest.day, confirmRequest.shift, confirmRequest.employee.id);
    closeModal();
  };

  const handleDecline = () => {
    if (!confirmRequest) return;
    setDeclinedShifts((prev) => ({
      ...prev,
      [confirmRequest.day]: { ...(prev[confirmRequest.day] || {}), [confirmRequest.shift]: true }
    }));
    closeModal();
  };

  return (
    <>
      <div className="js-section">

        {/* Heading */}
        <div className="js-heading">
          <svg className="js-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2 className="js-title">Job Schedule</h2>
          <span className="js-underline" />
        </div>

        {/* Employee selector */}
        <div className="js-selector-row">
          <div className="js-selector-wrap">
            <select
              className="js-select"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="js-grid-scroll">
          <div className="js-grid" role="grid">

            {/* Corner */}
            <div className="js-cell js-cell-header">Shifts/Days</div>
            {DAY_ORDER.map((day) => (
              <div key={day} className="js-cell js-cell-header">{DAY_LABELS[day]}</div>
            ))}

            {SHIFTS.map((shift) => (
              <Fragment key={shift}>
                <div className="js-cell js-cell-label">{SHIFT_LABELS[shift]}</div>
                {DAY_ORDER.map((day) => {
                  const raw = schedule[day]?.[shift] ?? null;
                  const assignedIds = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
                  const isSelectedAssigned = assignedIds.includes(selectedEmployeeId);
                  const avStatus = availability?.[selectedEmployeeId]?.[day]?.[shift] ?? null;
                  const isDeclined = declinedShifts[day]?.[shift] ?? false;

                  if (isDeclined) {
                    return (
                      <button
                        key={`${day}-${shift}`}
                        type="button"
                        className="js-cell js-cell-declined"
                        onClick={() => handleCellClick(day, shift)}
                      >
                        Declined
                        <span className="js-cell-badge js-cell-badge-x" aria-hidden="true">
                          <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="2" y1="2" x2="8" y2="8" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round"/>
                            <line x1="8" y1="2" x2="2" y2="8" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                        </span>
                      </button>
                    );
                  }

                  if (isSelectedAssigned) {
                    return (
                      <button
                        key={`${day}-${shift}`}
                        type="button"
                        className="js-cell js-cell-confirmed"
                        onClick={() => handleCellClick(day, shift)}
                      >
                        Available
                        <span className="js-cell-badge" aria-hidden="true">
                          <svg viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="1,4 4,7 9,1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </button>
                    );
                  }

                  if (avStatus === "available") {
                    return (
                      <button
                        key={`${day}-${shift}`}
                        type="button"
                        className="js-cell js-cell-available"
                        onClick={() => handleCellClick(day, shift)}
                      >
                        Available
                      </button>
                    );
                  }

                  if (avStatus === "unavailable") {
                    return (
                      <button
                        key={`${day}-${shift}`}
                        type="button"
                        className="js-cell js-cell-unavailable"
                        onClick={() => handleCellClick(day, shift)}
                      >
                        Unavailable
                      </button>
                    );
                  }

                  return (
                    <button
                      key={`${day}-${shift}`}
                      type="button"
                      className="js-cell js-cell-empty"
                      onClick={() => handleCellClick(day, shift)}
                    >
                      —
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Footer hints */}
        <div className="js-hints">
          <p className="js-hint">
            Click on <span className="js-hint-available">Available</span> if you want to set a shift.
          </p>
          <p className="js-hint">
            Click on <span className="js-hint-unavailable">Unavailable</span> if you still want to set a shift for the employee.
          </p>
        </div>

      </div>

      {/* Modal */}
      {confirmRequest && (
        <div className="jsm-overlay" onClick={closeModal}>
          <div className="jsm-modal" onClick={(e) => e.stopPropagation()}>

            {/* Top bar */}
            <div className="jsm-top">
              <div className="jsm-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <button type="button" className="jsm-close" onClick={closeModal} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Title */}
            <h3 className="jsm-title">
              {confirmRequest.mode === "replace"
                ? "Replace shift?"
                : confirmRequest.avStatus === "unavailable"
                  ? "Assign anyway?"
                  : "Confirm shift?"}
            </h3>

            {/* Subtitle */}
            {confirmRequest.avStatus === "unavailable" && (
              <p className="jsm-subtitle">This employee marked this shift as unavailable.</p>
            )}
            {confirmRequest.mode === "replace" && confirmRequest.avStatus !== "unavailable" && (
              <p className="jsm-subtitle">Currently assigned: {confirmRequest.currentEmployee.name}</p>
            )}

            {/* Employee row — for replace mode show both, else show selected employee */}
            {confirmRequest.mode === "replace" ? (
              <div className="jsm-swap-row">
                <div className="jsm-swap-person">
                  {confirmRequest.currentEmployee.profilePicture ? (
                    <img src={confirmRequest.currentEmployee.profilePicture} alt="" className="jsm-emp-avatar" />
                  ) : (
                    <div className="jsm-emp-avatar-fallback">{initials(confirmRequest.currentEmployee.name)}</div>
                  )}
                  <div className="jsm-emp-info">
                    <span className="jsm-emp-name">{confirmRequest.currentEmployee.name}</span>
                    <span className="jsm-emp-shift">{SHIFT_LABELS[confirmRequest.shift]} {SHIFT_TIMES[confirmRequest.shift]}</span>
                  </div>
                </div>
                <span className="jsm-swap-arrow">→</span>
                <div className="jsm-swap-person">
                  {confirmRequest.employee.profilePicture ? (
                    <img src={confirmRequest.employee.profilePicture} alt="" className="jsm-emp-avatar" />
                  ) : (
                    <div className="jsm-emp-avatar-fallback">{initials(confirmRequest.employee.name)}</div>
                  )}
                  <div className="jsm-emp-info">
                    <span className="jsm-emp-name">{confirmRequest.employee.name}</span>
                    <span className="jsm-emp-shift">{SHIFT_LABELS[confirmRequest.shift]} {SHIFT_TIMES[confirmRequest.shift]}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="jsm-emp-row">
                {confirmRequest.employee.profilePicture ? (
                  <img src={confirmRequest.employee.profilePicture} alt="" className="jsm-emp-avatar" />
                ) : (
                  <div className="jsm-emp-avatar-fallback">{initials(confirmRequest.employee.name)}</div>
                )}
                <div className="jsm-emp-info">
                  <span className="jsm-emp-name">{confirmRequest.employee.name}</span>
                  <span className="jsm-emp-shift">{SHIFT_LABELS[confirmRequest.shift]} {SHIFT_TIMES[confirmRequest.shift]}</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="jsm-footer">
              <label className="jsm-checkbox-label">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                Don't show again
              </label>
              <div className="jsm-actions">
                <button type="button" className="jsm-btn-decline" onClick={handleDecline}>Decline</button>
                <button type="button" className="jsm-btn-accept" onClick={handleAccept}>Accept</button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

