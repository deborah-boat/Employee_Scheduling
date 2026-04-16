import { Fragment, useState } from "react";
import { SHIFTS, DAYS } from "../constants";
import "../styles/WorkSchedule.css"

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


// Human-readable time ranges for each shift
const SHIFT_TIMES = {
  morning: "07:00-16:00",
  afternoon: "15:30-22:00",
  night: "21:30-07:15"
};                                                                                                                                                                                                                                                                                                                                              


// Aggregate all shifts for one employee on one day into a readable summary
function getDetailStatus(availabilityByDay = {}){ 
  const unavailable = SHIFTS.filter((s) => availabilityByDay?.[s] === "unavailable");
  const available = SHIFTS.filter((s) => availabilityByDay?.[s] === "available");
  
  if(available.length === 0 && unavailable.length === 0){
    return null;
  }
  
  if (unavailable.length === SHIFTS.length) 
    return { 
    type: "unavailable", 
    text: "Unavailable" 
  };
  
  let parts = [];

  if (available.length > 0) {
   parts.push(`Available ${available.join(" ")}`
  );
}

  if (unavailable.length > 0) {
    parts.push(`Unavailable ${unavailable.join(" ")}`);
  }

  return {
    type: unavailable.length > 0
    ? "partial":"available",
    text: parts.join(" ")
  };
}

// Weekly schedule grid showing each employee's availability per day
export default function WorkSchedule({ employees, availability }) {
  const [detailEmployee, setDetailEmployee] = useState(null);
  
  return (
    <>
    <div className="card work-card">
      <h2 className="work-title">Work Schedule</h2>

      <div className="work-grid" role="grid">
        <div className="work-header-empty" />
        {DAY_LABELS.map(({ day, label }) => (
          <div key={day} className="work-day-header">
            {label}
            </div>
          ))}

        {employees.map((employee, employeeIndex) => {
          const showSickLeave = employeeIndex === 2;
          
          return (
          <Fragment key={employee.id}>
            <div
            className="work-employee-name work-employee-clickable"
            role="button"
            tabIndex={0}
            title="Click to view availability"
            onClick={() => setDetailEmployee(employee)}
            onKeyDown={(e) => e.key === "Enter" && setDetailEmployee(employee)}
            >
              <span className="work-user-icon" aria-hidden="true">◉</span>
              {employee.name}
              </div>
              
              {showSickLeave ? (
                <div className="work-sick-leave">
                  Sick leave
                </div>
              ) : (
                DAY_LABELS.map(({day}) => {
                  const status =availability?.[employee.id]?.[day];

                  const available = SHIFTS.some(
                      (s) => status?.[s] === "available"
                    );

                    const unavailable = SHIFTS.some(
                      (s) => status?.[s] === "unavailable"
                    );

                    if (!available && !unavailable) {
                      return (
                        <div
                          key={`${employee.id}-${day}`}
                          className="work-cell empty"
                        >
                          <span>-</span>
                        </div>
                      );
                    }

                    if (available && !unavailable) {
                      return (
                        <div key={`${employee.id}-${day}`} className="work-cell">
                          <div className="jc-card jc-card-available">
                            <span className="jc-name">{employee.name}</span>
                            <span className="jc-badge jc-badge-available">
                              Available
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (unavailable && !available) {
                      return (
                        <div key={`${employee.id}-${day}`} className="work-cell">
                          <div className="jc-card jc-card-unavailable">
                            <span className="jc-name">{employee.name}</span>
                            <span className="jc-badge jc-badge-unavailable">
                              Unavailable
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (unavailable && available) {
                      const availableText = SHIFTS
                      .filter((s) => status?.[s] === "available")
                      .map((s)=> SHIFT_TIMES[s])
                      .join(" ")

                      const unavailableText = SHIFTS
                      .filter((s) => status?.[s] === "unavailable")
                      .map((s)=> SHIFT_TIMES[s])
                      .join(" ")

                    return (
                    <div key={`${employee.id}-${day}`} className="work-cell">
                      <div className="jc-card jc-card-partial">
                        <span className="jc-name">{employee.name}</span>
                        <span className="jc-badge jc-badge-partial">
                          <span className = "green">Available {availableText}</span>
                          <span className = "red">Unavailable {unavailableText}</span>
                          </span>
                        </div>
                      </div>
                    );
                  }
                })
              )}
              </Fragment>
            );
          })}
        </div>

        <div className="work-helper-note">
          Click an employee name to view details.
        </div>
      </div>

      {detailEmployee && (
        <div className="ws-detail-overlay" onClick={() => setDetailEmployee(null)}>
          <div
            className="ws-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ws-detail-header">
              <span>{detailEmployee.name}</span>
              <button onClick={() => setDetailEmployee(null)}>✕</button>
            </div>

            <div className="ws-detail-subtitle">Weekly availability</div>

            <div className="ws-detail-grid">
              {DAY_LABELS.map(({ day, label }) => {
                const status = getDetailStatus(
                  availability?.[detailEmployee.id]?.[day]
                );

                if (!status) {
                  return (
                    <div key={day} className="ws-detail-row">
                      <span>{label}</span>
                      <span>-</span>
                    </div>
                  );
                }

                return (
                  <div key={day} className="ws-detail-row">
                    <span>{label}</span>
                    <span className={`ws-detail-${status.type}`}>
                      {status.text}
                    </span>
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