import { Fragment, useMemo, useRef, useState } from "react";
import { SHIFTS } from "../constants";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SHIFT_TIMES = {
  morning: "7-15",
  afternoon: "15-18",
  night: "18-23"
};

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

function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatRangeLabel(startDate) {
  const endDate = addDays(startDate, 6);
  const sameMonth = startDate.getMonth() === endDate.getMonth();
  const monthLabel = MONTH_SHORT[startDate.getMonth()];

  if (sameMonth) {
    return `${monthLabel} ${startDate.getDate()}-${endDate.getDate()}`;
  }

  return `${MONTH_SHORT[startDate.getMonth()]} ${startDate.getDate()}-${MONTH_SHORT[endDate.getMonth()]} ${endDate.getDate()}`;
}

export default function WorkSchedule({ employees, schedule, availability }) {
  const dateInputRef = useRef(null);
  const [weekStartDate, setWeekStartDate] = useState(() => new Date(2026, 3, 1));

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

  const openDatePicker = () => {
    if (dateInputRef.current?.showPicker) {
      dateInputRef.current.showPicker();
      return;
    }
    dateInputRef.current?.click();
  };

  const goToPreviousWeek = () => {
    setWeekStartDate((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setWeekStartDate((prev) => addDays(prev, 7));
  };

  const goToToday = () => {
    setWeekStartDate(new Date());
  };

  return (
    <div className="card work-card">
      <h2 className="work-title">Work Schedule</h2>

      <div className="work-controls">
        <button type="button" className="work-control-today" onClick={goToToday}>Today</button>
        <select className="work-control-week" defaultValue="Week">
          <option value="Week">Week</option>
        </select>
        <button type="button" className="work-range-btn" aria-label="Previous week" onClick={goToPreviousWeek}>&lt;</button>
        <button type="button" className="work-range-label" onClick={openDatePicker}>
          {formatRangeLabel(weekStartDate)}
        </button>
        <button type="button" className="work-range-btn" aria-label="Next week" onClick={goToNextWeek}>&gt;</button>
        <input
          ref={dateInputRef}
          className="work-date-picker"
          type="date"
          value={formatDateInputValue(weekStartDate)}
          onChange={(e) => {
            if (!e.target.value) return;
            setWeekStartDate(new Date(`${e.target.value}T00:00:00`));
          }}
        />
      </div>

      <div className="work-grid" role="grid">
        <div className="work-header-empty" />
        {weekDays.map((day) => (
          <div key={day.label} className="work-day-header">{day.label}</div>
        ))}

        {employees.map((employee, employeeIndex) => {
          const showSickLeave = employeeIndex === 2;

          return (
            <Fragment key={employee.id}>
              <div className="work-employee-name">
                <span className="work-user-icon" aria-hidden="true">◉</span>
                {employee.name}
              </div>

              {showSickLeave ? (
                <div className="work-sick-leave">
                  Sick leave
                </div>
              ) : (
                weekDays.map((day) => {
                  const assignedShift = SHIFTS.find((shift) => schedule[day.dayKey]?.[shift] === employee.id) || null;
                  const status = getStatus(availability?.[employee.id]?.[day.dayKey], assignedShift);

                  return (
                    <div key={`${employee.id}-${day.label}`} className="work-cell">
                      {status.type === "available" && <span className="work-available">{status.label}</span>}
                      {status.type === "prefer" && <span className="work-tag prefer">{status.label}</span>}
                      {status.type === "unavailable" && <span className="work-tag unavailable">{status.label}</span>}
                    </div>
                  );
                })
              )}
            </Fragment>
          );
        })}
      </div>
      <div className="work-helper-note">Set employee availability in Employee view to update this table.</div>
    </div>
  );
}
