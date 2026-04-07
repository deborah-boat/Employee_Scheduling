import { Fragment, useState } from "react";
import { DAYS, SHIFTS, SHIFT_COLORS } from "../constants";

export default function EmployeeView({ employees, schedule, availability, onSetAvailability }) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id ?? null);
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);

  const employee = employees.find((item) => item.id === selectedEmployeeId);

  if (!employee) {
    return (
      <div className="content">
        <div className="card">
          <h2>My schedule</h2>
          <p>No employees available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="card">
        <h2>My schedule</h2>
        <label>
          Select employee (demo)
          <select
            value={selectedEmployeeId || ""}
            onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
          >
            {employees.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="day-selector">
          {DAYS.map((day) => (
            <button
              key={day}
              className={day === selectedDay ? "active" : ""}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </button>
          ))}
        </div>

        <h3>Set availability – {selectedDay}</h3>
        <div className="shift-row">
          {SHIFTS.map((shift) => {
            const current = availability[employee.id]?.[selectedDay]?.[shift] || "unavailable";
            return (
              <div key={shift} className="shift-card">
                <div className="shift-label">{shift.charAt(0).toUpperCase() + shift.slice(1)} shift</div>
                <div className="availability-buttons">
                  <button
                    className={current === "unavailable" ? "danger active" : "danger"}
                    onClick={() => onSetAvailability(employee.id, selectedDay, shift, "unavailable")}
                  >
                    Unavailable
                  </button>
                  <button
                    className={current === "available" ? "success active" : "success"}
                    onClick={() => onSetAvailability(employee.id, selectedDay, shift, "available")}
                  >
                    Available
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <h3>Personal work schedule</h3>
        <div className="schedule-grid">
          <div className="schedule-header">Day</div>
          {SHIFTS.map((shift) => (
            <div key={shift} className="schedule-header">
              {shift.charAt(0).toUpperCase() + shift.slice(1)}
            </div>
          ))}
          {DAYS.map((day) => (
            <Fragment key={day}>
              <div className="schedule-day">{day}</div>
              {SHIFTS.map((shift) => {
                const assignedId = schedule[day][shift];
                const isMine = assignedId === employee.id;
                return (
                  <div
                    key={shift}
                    className="schedule-cell"
                    style={{
                      backgroundColor: isMine ? SHIFT_COLORS[shift] : "#f5f5f5"
                    }}
                  >
                    {isMine ? "Working" : ""}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
