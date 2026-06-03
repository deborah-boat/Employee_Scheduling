import React from "react";
// Import the CSS styles for this component
import "../styles/EmployeeList.css";

// This component receives the list of employees from the parent and displays them as cards
export default function EmployeeList({ employees }) {
  return (
    <div className="employees-container">
      {/* Page header with title and a decorative underline */}
      <div className="employees-header">
        <h1 className="employees-title">List of all Employees</h1>
        <div className="employees-title-underline"></div>
      </div>

      {/* Loop through each employee and render a card for them */}
      <div className="employee-grid">
        {employees.map((employee) => (
          // Each card needs a unique key so React can track it in the list
          <div key={employee.id} className="employee-card">

            {/* Profile picture section — shows a placeholder emoji if there is no image */}
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
              {/* Employee name */}
              <h3 className="employee-card-name">{employee.name}</h3>

              <div className="employee-card-footer">
                {/* Show position if it exists, otherwise fall back to "Staff" */}
                <span className="employee-card-position">{employee.position || "Staff"}</span>

                {/* Action buttons for viewing, editing, or deleting the employee */}
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
