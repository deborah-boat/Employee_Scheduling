import { useState } from "react";
import { DAYS, SHIFTS } from "../constants";

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

export default function EmployeeView({ employees, availability, onSetAvailability, weekStartDate }) {
  // Currently selected employee (demo—in production this would be the logged-in user)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id ?? null);

  // Modal state: which day is open, the top-level choice, and preferred shifts
  const [modalDay, setModalDay] = useState(null);
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

  const canConfirm = topChoice !== null || preferredShifts.length > 0;

  return (
    <div className="content">
      <div className="card av-card">

        {/* Header row: title + brand */}
        <div className="av-header">
          <h2 className="av-title">{employee.name}'s Availability</h2>
          <div className="av-brand">
            <span className="av-brand-title">Sundsgården</span>
            <span className="av-brand-sub">HOTELL | KONFERENS</span>
          </div>
        </div>

        {/* Demo employee selector */}
        <div className="av-selector-row">
          <label className="av-selector-label">
            Viewing as:
            <select
              className="av-selector-select"
              value={selectedEmployeeId || ""}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
            >
              {employees.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Availability grid */}
        <div className="av-grid-wrap">
          <table className="av-table">
            <thead>
              <tr>
                <th className="av-th av-th-empty" />
                {dayColumns.map(({ dayKey, label }) => (
                  <th key={dayKey} className="av-th av-th-day">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHIFTS.map((shift) => (
                <tr key={shift}>
                  <td className="av-td av-shift-label">{SHIFT_LABELS[shift]}</td>
                  {dayColumns.map(({ dayKey }) => {
                    const status = availability[employee.id]?.[dayKey]?.[shift] || "";
                    return (
                      <td
                        key={dayKey}
                        className="av-td av-cell"
                        style={{ background: STATUS_COLORS[status] || "" }}
                      >
                        {status && (
                          <span className="av-status-label">
                            {status === "available" ? "Available" : "Unavailable"}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* "Choose availability" button row — one button per day */}
              <tr className="av-picker-row">
                <td className="av-td" />
                {dayColumns.map(({ dayKey }) => (
                  <td key={dayKey} className="av-td av-picker-cell">
                    <button
                      type="button"
                      className="av-choose-btn"
                      onClick={() => openModal(dayKey)}
                    >
                      Choose<br />availability
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Availability modal */}
      {modalDay && (
        <div className="av-modal-overlay" onClick={closeModal}>
          <div className="av-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="av-modal-title">Select availability</h3>

            {/* Top-level choice: available all day or unavailable */}
            <div className="av-modal-top-row">
              <button
                type="button"
                className={`av-modal-top-btn av-available-btn${topChoice === "available_all" ? " active" : ""}`}
                onClick={() => { setTopChoice("available_all"); setPreferredShifts([]); }}
              >
                Available all day
              </button>
              <button
                type="button"
                className={`av-modal-top-btn av-unavailable-btn${topChoice === "unavailable" ? " active" : ""}`}
                onClick={() => { setTopChoice("unavailable"); setPreferredShifts([]); }}
              >
                Unavailable
              </button>
            </div>

            {/* Preferred shifts section */}
            <p className="av-modal-prefer-label">I prefer:</p>
            <div className="av-modal-shifts">
              {SHIFTS.map((shift) => {
                const isSelected = preferredShifts.includes(shift);
                return (
                  <button
                    key={shift}
                    type="button"
                    className={`av-modal-shift-btn${isSelected ? " selected" : ""}`}
                    style={{ background: isSelected ? SHIFT_MODAL_COLORS[shift] : "#fff" }}
                    onClick={() => togglePreferredShift(shift)}
                  >
                    <span className="av-modal-shift-name">{SHIFT_LABELS[shift]}</span>
                    <span className="av-modal-shift-time">{SHIFT_TIMES[shift]}</span>
                  </button>
                );
              })}
            </div>

            {/* Cancel / Confirm */}
            <div className="av-modal-actions">
              <button type="button" className="av-modal-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="button"
                className="av-modal-confirm"
                disabled={!canConfirm}
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

