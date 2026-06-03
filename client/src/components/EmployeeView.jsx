import { useState } from "react";
// DAYS and SHIFTS are the shared lists used across the whole app
import { DAYS, SHIFTS } from "../constants";
import "../styles/EmployeeView.css";

// Human-readable labels for each shift key
const SHIFT_LABELS = {
  morning: "Morning Shift",
  afternoon: "Afternoon Shift",
  night: "Evening Shift"
};

// Time ranges displayed inside the grid cells
const SHIFT_TIMES = {
  morning: "7-15",
  afternoon: "15-18",
  night: "18-23"
};

// Background colour for each availability status in the grid
const STATUS_COLORS = {
  available: "#d1fae5",
  unavailable: "#fee2e2"
};

// Background colour for each shift button inside the modal
const SHIFT_MODAL_COLORS = {
  morning: "#fef3c7",
  afternoon: "#d1fae5",
  night: "#dbeafe"
};

export default function EmployeeView({ employees, schedule, availability, onSetAvailability, weekStartDate, user }) {
  // Try to match the logged-in user to an employee by name, fall back to the first employee
  const matchedId = employees.find((e) => e.name === user?.username)?.id ?? employees[0]?.id ?? null;
  // eslint-disable-next-line no-unused-vars
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(matchedId);

  // modalDay: which day column has the availability modal open (null = closed)
  const [modalDay, setModalDay] = useState(null);
  // cancelTarget: which { day, shift } slot the cancel confirmation is for
  const [cancelTarget, setCancelTarget] = useState(null);
  // dayAllModal: which day the "set whole day" modal is open for
  const [dayAllModal, setDayAllModal] = useState(null);
  // topChoice: the quick-pick option the employee selected in the modal
  const [topChoice, setTopChoice] = useState(null);       // "available_all" | "unavailable" | null
  // preferredShifts: the specific shifts the employee toggled as preferred
  const [preferredShifts, setPreferredShifts] = useState([]);

  // Find the full employee object for the currently selected ID
  const employee = employees.find((item) => item.id === selectedEmployeeId);

  // If no employee is found, show a friendly message instead of crashing
  if (!employee) {
    return (
      <div className="content">
        <div className="card av-card">
          <h2>My Availability</h2>
          <p>No employees available yet.</p>
        </div>
      </div>
    );
  }

  // Build the column headers with the actual date for each day, e.g. "Wed 1/4"
  const dayColumns = DAYS.map((dayKey, index) => {
    if (weekStartDate) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + index);
      return { dayKey, label: `${dayKey} ${date.getDate()}/${date.getMonth() + 1}` };
    }
    return { dayKey, label: dayKey };
  });

  // Open the availability modal for a specific day and reset any previous selections
  const openModal = (dayKey) => {
    setModalDay(dayKey);
    setTopChoice(null);
    setPreferredShifts([]);
  };

  // Close the modal without saving anything
  const closeModal = () => {
    setModalDay(null);
    setTopChoice(null);
    setPreferredShifts([]);
  };

  // Open the cancel confirmation for a single shift slot
  const openCancelModal = (dayKey, shift) => {
    setCancelTarget({ day: dayKey, shift });
  };

  // Confirm removing a single shift's availability status
  const handleCancelShift = () => {
    if (!cancelTarget) return;
    onSetAvailability(employee.id, cancelTarget.day, cancelTarget.shift, "");
    setCancelTarget(null);
  };

  // Set every shift of a day to the same status at once
  const handleDayAll = (status) => {
    if (!dayAllModal) return;
    SHIFTS.forEach((shift) => onSetAvailability(employee.id, dayAllModal, shift, status));
    setDayAllModal(null);
  };

  // Toggle a shift on or off in the preferred list
  const togglePreferredShift = (shift) => {
    setPreferredShifts((prev) =>
      prev.includes(shift) ? prev.filter((s) => s !== shift) : [...prev, shift]
    );
    // Deselect the quick-pick option when the employee picks specific shifts
    setTopChoice(null);
  };

  // Save the availability choices and close the modal
  const handleConfirm = () => {
    if (!modalDay) return;

    if (topChoice === "available_all") {
      // Mark every shift as available
      SHIFTS.forEach((shift) => onSetAvailability(employee.id, modalDay, shift, "available"));
    } else if (topChoice === "unavailable") {
      // Mark every shift as unavailable
      SHIFTS.forEach((shift) => onSetAvailability(employee.id, modalDay, shift, "unavailable"));
    } else if (preferredShifts.length > 0) {
      // Preferred shifts get "available", everything else gets "unavailable"
      SHIFTS.forEach((shift) => {
        const status = preferredShifts.includes(shift) ? "available" : "unavailable";
        onSetAvailability(employee.id, modalDay, shift, status);
      });
    }

    closeModal();
  };

  // The Confirm button is only active when at least one shift has been selected
  const canConfirm = preferredShifts.length > 0;

  return (
    <>
      <div className="ev-section">

        {/* Section heading with an edit icon */}
        <div className="ev-heading">
          <svg className="ev-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <h2 className="ev-title">Availability</h2>
          <span className="ev-underline" />
        </div>

        {/* Read-only field showing the logged-in employee's name */}
        <div className="ev-name-wrap">
          <input
            className="ev-name-input"
            type="text"
            readOnly
            value={employee.name}
          />
        </div>

        {/* Scrollable availability grid */}
        <div className="ev-grid-scroll">
          <div className="ev-grid" role="grid">

            {/* Top-left corner cell + one header cell per day — clicking a day opens the day-all modal */}
            <div className="ev-cell ev-cell-header">Shifts/Days</div>
            {dayColumns.map(({ dayKey, label }) => (
              <div
                key={dayKey}
                className="ev-cell ev-cell-header ev-cell-clickable"
                role="button"
                tabIndex={0}
                title="Click to set all shifts for this day"
                onClick={() => setDayAllModal(dayKey)}
                onKeyDown={(e) => e.key === "Enter" && setDayAllModal(dayKey)}
              >{label}</div>
            ))}

            {/* One row per shift — each cell shows the current status or a button to set it */}
            {SHIFTS.map((shift) => (
              <>
                {/* Row label on the left */}
                <div key={`${shift}-label`} className="ev-cell ev-cell-label">
                  {SHIFT_LABELS[shift]}
                </div>
                {dayColumns.map(({ dayKey }) => {
                  // Check if this employee is already scheduled for this slot
                  const raw = schedule?.[dayKey]?.[shift] ?? null;
                  const assignedIds = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
                  const isScheduled = assignedIds.includes(employee.id);

                  // If scheduled, show a locked "Scheduled" cell — cannot be changed by the employee
                  if (isScheduled) {
                    return (
                      <div key={`${shift}-${dayKey}`} className="ev-cell ev-cell-scheduled">
                        Scheduled <br />
                        <small>{SHIFT_TIMES[shift]}</small>
                        <span className="ev-cell-check" aria-hidden="true">
                          <svg viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="1,4 4,7 9,1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                    );
                  }

                  // Read the current availability status for this cell
                  const status = availability[employee.id]?.[dayKey]?.[shift] || "";
                  let cls = "ev-cell ev-cell-empty";
                  let text = "";
                  if (status === "available")   { cls = "ev-cell ev-cell-available";   text = "Available"; }
                  if (status === "unavailable") { cls = "ev-cell ev-cell-unavailable"; text = "Unavailable"; }

                  // If a status is already set, clicking the cell opens the cancel confirmation
                  return status ? (
                    <div
                      key={`${shift}-${dayKey}`}
                      className={cls + " ev-cell-clickable"}
                      role="button"
                      tabIndex={0}
                      title="Click to cancel this shift"
                      onClick={() => openCancelModal(dayKey, shift)}
                      onKeyDown={(e) => e.key === "Enter" && openCancelModal(dayKey, shift)}
                    >
                      {text}
                    </div>
                  ) : (
                    // If no status is set, show a "Choose Availability" button
                    <div key={`${shift}-${dayKey}`} className="ev-cell" style={{ padding: 0, border: "1.5px solid #e5e7eb" }}>
                      <button
                        type="button"
                        className="ev-choose-btn"
                        onClick={() => openModal(dayKey)}
                      >
                        Choose<br />Availability
                      </button>
                    </div>
                  );
                })}
              </>
            ))}

          </div>
        </div>

        {/* Hint text at the bottom explaining the day-header click behaviour */}
        <p className="ev-footnote">
          If you want to select all day <span className="ev-footnote-available">Available</span> or <span className="ev-footnote-unavailable">Unavailable</span>, click on the date — a modal will open to choose.
        </p>

      </div>

      {/* Modal: set all shifts for a whole day at once */}
      {dayAllModal && (
        <div className="ev-modal-overlay" onClick={() => setDayAllModal(null)}>
          <div className="ev-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="ev-modal-title">Set all shifts for {dayColumns.find((d) => d.dayKey === dayAllModal)?.label}</h3>
            <p className="ev-cancel-modal-text">Choose a status to apply to all shifts on this day.</p>
            <div className="ev-modal-top-row" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className="ev-modal-top-btn ev-available-btn"
                onClick={() => handleDayAll("available")}
              >
                Available all day
              </button>
              <button
                type="button"
                className="ev-modal-top-btn ev-unavailable-btn"
                onClick={() => handleDayAll("unavailable")}
              >
                Unavailable
              </button>
            </div>
            <div className="ev-modal-actions" style={{ marginTop: 16 }}>
              <button type="button" className="ev-modal-cancel" onClick={() => setDayAllModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirm removing a single shift's availability status */}
      {cancelTarget && (
        <div className="ev-modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="ev-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="ev-modal-title">Cancel shift?</h3>
            <p className="ev-cancel-modal-text">
              Do you want to remove your{" "}
              <strong>
                {availability[employee.id]?.[cancelTarget.day]?.[cancelTarget.shift] === "available"
                  ? "Available"
                  : "Unavailable"}
              </strong>{" "}
              status for <strong>{SHIFT_LABELS[cancelTarget.shift]}</strong> on{" "}
              <strong>{dayColumns.find((d) => d.dayKey === cancelTarget.day)?.label}</strong>?
            </p>
            <div className="ev-modal-actions">
              <button type="button" className="ev-modal-cancel" onClick={() => setCancelTarget(null)}>Keep it</button>
              <button type="button" className="ev-modal-confirm" onClick={handleCancelShift}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: pick preferred shifts for a specific day */}
      {modalDay && (
        <div className="ev-modal-overlay" onClick={closeModal}>
          <div className="ev-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="ev-modal-title">Select availability</h3>

            <p className="ev-modal-prefer-label">I prefer:</p>
            <div className="ev-modal-shifts">
              {SHIFTS.map((shift) => {
                const isSelected = preferredShifts.includes(shift);
                return (
                  <button
                    key={shift}
                    type="button"
                    className={`ev-modal-shift-btn${isSelected ? " selected" : ""}`}
                    style={{ background: isSelected ? SHIFT_MODAL_COLORS[shift] : "#fff" }}
                    onClick={() => togglePreferredShift(shift)}
                  >
                    <span className="ev-modal-shift-name">{SHIFT_LABELS[shift]}</span>
                    <span className="ev-modal-shift-time">{SHIFT_TIMES[shift]}</span>
                  </button>
                );
              })}
            </div>

            <div className="ev-modal-actions">
              <button type="button" className="ev-modal-cancel" onClick={closeModal}>Cancel</button>
              <button
                type="button"
                className="ev-modal-confirm"
                disabled={!canConfirm}
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

