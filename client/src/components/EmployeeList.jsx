export default function EmployeeList({ employees, onRegisterClick }) {
  return (
    <div className="card employee-list-card">
      <div className="employee-list-head">
        <h2>List of all Employees</h2>
        <button type="button" className="register-employee-action" onClick={onRegisterClick}>
          Register new Employee
        </button>
      </div>

      <div className="employee-showcase-grid">
        {employees.map((employee) => (
          <div key={employee.id} className="employee-showcase-item">
            <div className="employee-card-frame">
              <div className="employee-card-top" />
              <div className="employee-card-avatar-wrap">
                <div className="avatar employee-showcase-avatar">
                  {employee.profilePicture ? (
                    <img
                      src={employee.profilePicture}
                      alt={`${employee.name} profile`}
                      className="avatar-image"
                    />
                  ) : (
                    "👤"
                  )}
                </div>
              </div>
              <div className="employee-card-lines">
                <div className="employee-line">{employee.position || "----------"}</div>
                <div className="employee-line small">{employee.loginCode || "----- ---"}</div>
              </div>
            </div>
            <div className="employee-showcase-name">{employee.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
