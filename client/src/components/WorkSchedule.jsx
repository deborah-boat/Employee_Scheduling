import { Fragment, useMemo, useRef, useState } from "react";
import { SHIFTS } from "../constants";
import "../styles/WorkSchedule.css";

// Short labels for days and months used in date display
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Maximum number of employees allowed per shift
const SHIFT_CAPACITY = { morning: 2, afternoon: 3, night: 3 };

// Human-readable time ranges for each shift
const SHIFT_TIMES = {
  morning: "7-15",
  afternoon: "15-18",
  night: "18-23"
};

// Determine the availability status of an employee for a given day
// eslint-disable-next-line no-unused-vars
function getStatus(availabilityByDay = {}, assignedShift) {
  const availableShift = SHIFTS.find((shift) => availabilityByDay?.[shift] === "available");
  if (availableShift) {
    return {
      type: "prefer",
      label: `Prefers to work ${SHIFT_TIMES[availableShift]}`
    };
  }

  const hasUnavailable = SHIFTS.some((shift) => availabilityByDay?.[shift] === "unavailable");
  if (hasUnavailable) {
    return {
      type: "unavailable",
      label: "Unavailable"
    };
  }

  if (assignedShift) {
    return {
      type: "prefer",
      label: `Prefers to work ${SHIFT_TIMES[assignedShift]}`
    };
  }

  return {
    type: "available",
    label: "Available"
  };
}

// Return a new Date shifted by the given number of days
function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

// Format a Date as "YYYY-MM-DD" for the date input value
function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format the week range label shown in the navigation bar (e.g. "Apr 1-7")
function formatRangeLabel(startDate) {
  const endDate = addDays(startDate, 6);
  const sameMonth = startDate.getMonth() === endDate.getMonth();
  const monthLabel = MONTH_SHORT[startDate.getMonth()];

  if (sameMonth) {
    return `${monthLabel} ${startDate.getDate()}-${endDate.getDate()}`;
  }

  return `${MONTH_SHORT[startDate.getMonth()]} ${startDate.getDate()}-${MONTH_SHORT[endDate.getMonth()]} ${endDate.getDate()}`;
}

// Aggregate all shifts for one employee on one day into a readable summary
function getDetailStatus(availabilityByDay = {}) {
  const available = SHIFTS.filter((s) => availabilityByDay?.[s] === "available");
  const unavailable = SHIFTS.filter((s) => availabilityByDay?.[s] === "unavailable");

  if (available.length === SHIFTS.length) return { type: "available", text: "Available all day" };
  if (unavailable.length === SHIFTS.length) return { type: "unavailable", text: "Unavailable" };
  if (available.length > 0) {
    return { type: "prefer", text: available.map((s) => `Prefers ${SHIFT_TIMES[s]}`).join(", ") };
  }
  return { type: "available", text: "Available" };
}

// Weekly schedule grid showing each employee's availability per day
export default function WorkSchedule({ employees, schedule, availability }) {
  const [detailEmployee, setDetailEmployee] = useState(null);
  const dateInputRef = useRef(null);
  // Start the calendar on April 1, 2026 by default
  const [weekStartDate, setWeekStartDate] = useState(() => new Date(2026, 3, 1));

  // Build the array of 7 day objects for the current week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStartDate, index);
      const dayKey = DAY_SHORT[date.getDay()];
      return {
        dayKey,
        label: `${dayKey} ${date.getDate()}/${date.getMonth() + 1}`
      };
    });
  }, [weekStartDate]);

  // Open the native date picker
  const openDatePicker = () => {
    if (dateInputRef.current?.showPicker) {
      dateInputRef.current.showPicker();
      return;
    }
    dateInputRef.current?.click();
  };

  // Navigate one week back
  const goToPreviousWeek = () => {
    setWeekStartDate((prev) => addDays(prev, -7));
  };

  // Navigate one week forward
  const goToNextWeek = () => {
    setWeekStartDate((prev) => addDays(prev, 7));
  };

  // Jump to the current week
  const goToToday = () => {
    setWeekStartDate(new Date());
  };

  return (
    <>
      <div className="ws-section">

        {/* Heading */}
        <div className="ws-heading">
          <svg className="ws-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2 className="ws-title">Work Schedule</h2>
          <span className="ws-underline" />
        </div>

        {/* Controls */}
        <div className="ws-controls">
          <button type="button" className="ws-btn" onClick={goToToday}>Today</button>
          <div className="ws-select-wrap">
            <select className="ws-select" defaultValue="Week">
              <option value="Week">Week</option>
            </select>
          </div>
          <button type="button" className="ws-nav-btn" aria-label="Previous week" onClick={goToPreviousWeek}>&lt;</button>
          <button type="button" className="ws-range-label" onClick={openDatePicker}>
            {formatRangeLabel(weekStartDate)}
          </button>
          <button type="button" className="ws-nav-btn" aria-label="Next week" onClick={goToNextWeek}>&gt;</button>
          <input
            ref={dateInputRef}
            className="ws-date-input"
            type="date"
            value={formatDateInputValue(weekStartDate)}
            onChange={(e) => {
              if (!e.target.value) return;
              setWeekStartDate(new Date(`${e.target.value}T00:00:00`));
            }}
          />
        </div>

        {/* Grid — rows = shifts, cols = days */}
        <div className="ws-grid-scroll">
          <div className="ws-grid" role="grid">

            {/* Corner + day headers */}
            <div className="ws-cell ws-cell-header">Shifts/Days</div>
            {weekDays.map((day) => (
              <div key={day.label} className="ws-cell ws-cell-header">{day.label}</div>
            ))}

            {/* One row per shift */}
            {SHIFTS.map((shift) => (
              <Fragment key={shift}>
                <div className="ws-cell ws-cell-label">
                  {shift === "morning" ? "Morning Shift" : shift === "afternoon" ? "Afternoon Shift" : "Night Shift"}
                </div>

                {weekDays.map((day) => {
                  // Support both single ID and array of IDs in schedule
                  const raw = schedule[day.dayKey]?.[shift];
                  const assignedIds = Array.isArray(raw) ? raw : raw ? [raw] : [];
                  const capacity = SHIFT_CAPACITY[shift];
                  const assignedEmployees = employees.filter((emp) => assignedIds.includes(emp.id));
                  const isFull = assignedEmployees.length >= capacity;

                  if (assignedEmployees.length === 0) {
                    return (
                      <div key={`${shift}-${day.label}`} className="ws-cell ws-cell-free">
                        <span>Available</span>
                        <span className="ws-capacity-badge">{assignedEmployees.length}/{capacity}</span>
                      </div>
                    );
                  }

                  return (
                    <div key={`${shift}-${day.label}`} className={`ws-cell ws-cell-assigned${isFull ? " ws-cell-full" : ""}`}>
                      {assignedEmployees.map((emp) => (
                        <div
                          key={emp.id}
                          className="ws-emp-card"
                          role="button"
                          tabIndex={0}
                          title={emp.name}
                          onClick={() => setDetailEmployee(emp)}
                          onKeyDown={(e) => e.key === "Enter" && setDetailEmployee(emp)}
                        >
                          {emp.profilePicture ? (
                            <img src={emp.profilePicture} alt={emp.name} className="ws-emp-avatar" />
                          ) : (
                            <div className="ws-emp-avatar-fallback">
                              {emp.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="ws-emp-name">{emp.name.split(" ")[0]}</span>
                        </div>
                      ))}
                      <span className={`ws-capacity-badge${isFull ? " ws-capacity-full" : ""}`}>
                        {assignedEmployees.length}/{capacity}
                      </span>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Footnote */}
        <p className="ws-footnote">Click an employee name to view their availability details.</p>

      </div>

      {/* Detail modal */}
      {detailEmployee && (
        <div className="ws-detail-overlay" onClick={() => setDetailEmployee(null)}>
          <div className="ws-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ws-detail-header">
              <span className="ws-detail-name">{detailEmployee.name}</span>
              <button className="ws-detail-close" onClick={() => setDetailEmployee(null)} aria-label="Close">✕</button>
            </div>
            <div className="ws-detail-subtitle">Weekly availability</div>
            <div className="ws-detail-grid">
              {weekDays.map((day) => {
                const status = getDetailStatus(availability?.[detailEmployee.id]?.[day.dayKey]);
                return (
                  <div key={day.label} className="ws-detail-row">
                    <span className="ws-detail-day">{day.label}</span>
                    <span className={`ws-detail-badge ws-detail-${status.type}`}>{status.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
