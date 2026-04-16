import React from "react";
import "../styles/EmployeeList.css";

export default function EmployeeList({ employees }) {
  return (
    <div className="employees-container">
      <div className="employees-header">
        <h1 className="employees-title">List of all Employees</h1>
        <div className="employees-title-underline"></div>
      </div>

      <div className="employee-grid">
        {employees.map((employee) => (
          <div key={employee.id} className="employee-card">
            <div className="employee-card-image-wrapper">
              {employee.profilePicture ? (
                <img
                  src={employee.profilePicture}
                  alt={`${employee.name} profile`}
                  className="employee-card-image"
                />
              ) : (
                <div className="employee-card-image-placeholder">👤</div>
              )}
            </div>

            <div className="employee-card-body">
              <h3 className="employee-card-name">{employee.name}</h3>
              
              <div className="employee-card-footer">
                <span className="employee-card-position">{employee.position || "Staff"}</span>
                <div className="employee-card-actions">
                  <button className="action-icon" title="View">👁️</button>
                  <button className="action-icon" title="Edit">✏️</button>
                  <button className="action-icon" title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
