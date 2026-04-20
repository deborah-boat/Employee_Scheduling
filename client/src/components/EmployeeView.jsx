import { useState } from "react";
import { DAYS, SHIFTS } from "../constants";
import "../styles/EmployeeView.css";

// Labels and time ranges shown in the grid and modal
const SHIFT_LABELS = {
  morning: "Morning Shift",
  afternoon: "Afternoon Shift",
  night: "Evening Shift"
};

const SHIFT_TIMES = {
  morning: "7-15",
  afternoon: "15-18",
  night: "18-23"
};

// Background colour for each status in the grid cell
const STATUS_COLORS = {
  available: "#d1fae5",
  unavailable: "#fee2e2"
};

// Colours for each shift option in the modal
const SHIFT_MODAL_COLORS = {
  morning: "#fef3c7",
  afternoon: "#d1fae5",
  night: "#dbeafe"
};

export default function EmployeeView({ employees, schedule, availability, onSetAvailability, weekStartDate, user }) {
  // Find the employee that matches the logged-in user by display name, fallback to first
  const matchedId = employees.find((e) => e.name === user?.username)?.id ?? employees[0]?.id ?? null;
  // eslint-disable-next-line no-unused-vars
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(matchedId);

  // Modal state: which day is open, the top-level choice, and preferred shifts
  const [modalDay, setModalDay] = useState(null);
  // Cancel-shift modal state: { day, shift } or null
  const [cancelTarget, setCancelTarget] = useState(null);
  // Day-all modal: set entire day available or unavailable
  const [dayAllModal, setDayAllModal] = useState(null); // dayKey string or null
  const [topChoice, setTopChoice] = useState(null);       // "available_all" | "unavailable" | null
  const [preferredShifts, setPreferredShifts] = useState([]); // shifts toggled in "I prefer"

  const employee = employees.find((item) => item.id === selectedEmployeeId);

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

  // Build day column labels: "Wed 1/4", "Thu 2/4", …
  const dayColumns = DAYS.map((dayKey, index) => {
    if (weekStartDate) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + index);
      return { dayKey, label: `${dayKey} ${date.getDate()}/${date.getMonth() + 1}` };
    }
    return { dayKey, label: dayKey };
  });

  // Open the modal for a specific day column
  const openModal = (dayKey) => {
    setModalDay(dayKey);
    setTopChoice(null);
    setPreferredShifts([]);
  };

  // Close without saving
  const closeModal = () => {
    setModalDay(null);
    setTopChoice(null);
    setPreferredShifts([]);
  };

  // Open the cancel-shift confirmation modal
  const openCancelModal = (dayKey, shift) => {
    setCancelTarget({ day: dayKey, shift });
  };

  // Confirm clearing a single shift slot
  const handleCancelShift = () => {
    if (!cancelTarget) return;
    onSetAvailability(employee.id, cancelTarget.day, cancelTarget.shift, "");
    setCancelTarget(null);
  };

  // Set all shifts of a day to the same status
  const handleDayAll = (status) => {
    if (!dayAllModal) return;
    SHIFTS.forEach((shift) => onSetAvailability(employee.id, dayAllModal, shift, status));
    setDayAllModal(null);
  };

  // Toggle a shift in the "I prefer" list
  const togglePreferredShift = (shift) => {
    setPreferredShifts((prev) =>
      prev.includes(shift) ? prev.filter((s) => s !== shift) : [...prev, shift]
    );
    // Clear the top-level choice when a specific shift is picked
    setTopChoice(null);
  };

  // Apply the selection and close the modal
  const handleConfirm = () => {
    if (!modalDay) return;

    if (topChoice === "available_all") {
      SHIFTS.forEach((shift) => onSetAvailability(employee.id, modalDay, shift, "available"));
    } else if (topChoice === "unavailable") {
      SHIFTS.forEach((shift) => onSetAvailability(employee.id, modalDay, shift, "unavailable"));
    } else if (preferredShifts.length > 0) {
      // Preferred shifts → available; others → unavailable
      SHIFTS.forEach((shift) => {
        const status = preferredShifts.includes(shift) ? "available" : "unavailable";
        onSetAvailability(employee.id, modalDay, shift, status);
      });
    }

    closeModal();
  };

  const canConfirm = preferredShifts.length > 0;

  return (
    <>
      <div className="ev-section">

        {/* Heading */}
        <div className="ev-heading">
          <svg className="ev-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <h2 className="ev-title">Availability</h2>
          <span className="ev-underline" />
        </div>

        {/* Employee name display */}
        <div className="ev-name-wrap">
          <input
            className="ev-name-input"
            type="text"
            readOnly
            value={employee.name}
          />
        </div>

        {/* Grid */}
        <div className="ev-grid-scroll">
          <div className="ev-grid" role="grid">

            {/* Corner + day headers */}
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

            {/* Shift rows */}
            {SHIFTS.map((shift) => (
              <>
                <div key={`${shift}-label`} className="ev-cell ev-cell-label">
                  {SHIFT_LABELS[shift]}
                </div>
                {dayColumns.map(({ dayKey }) => {
                  const raw = schedule?.[dayKey]?.[shift] ?? null;
                  const assignedIds = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
                  const isScheduled = assignedIds.includes(employee.id);

                  if (isScheduled) {
                    return (
                      <div key={`${shift}-${dayKey}`} className="ev-cell ev-cell-scheduled">
                        Scheduled
                        <span className="ev-cell-check" aria-hidden="true">
                          <svg viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="1,4 4,7 9,1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                    );
                  }

                  const status = availability[employee.id]?.[dayKey]?.[shift] || "";
                  let cls = "ev-cell ev-cell-empty";
                  let text = "";
                  if (status === "available")   { cls = "ev-cell ev-cell-available";   text = "Available"; }
                  if (status === "unavailable") { cls = "ev-cell ev-cell-unavailable"; text = "Unavailable"; }
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

        {/* Footnote */}
        <p className="ev-footnote">
          If you want to select all day <span className="ev-footnote-available">Available</span> or <span className="ev-footnote-unavailable">Unavailable</span>, click on the date — a modal will open to choose.
        </p>

      </div>

      {/* Day-all modal */}
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

      {/* Cancel-shift confirmation modal */}
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

      {/* Availability modal */}
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

