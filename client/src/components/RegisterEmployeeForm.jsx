import { useState } from "react";

// Form to register new employees and manage the existing employee list
export default function RegisterEmployeeForm({
  onSubmit,
  employees = [],
  onUpdateEmployee,
  onDeleteEmployee
}) {
  // New employee form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    loginCode: "",
    role: "Waiter",
    profilePicture: ""
  });
  // Tracks which employee login codes are visible in the table
  const [revealedCodes, setRevealedCodes] = useState({});
  // ID of the employee currently being edited (null = none)
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  // Inline edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "Waiter",
    loginCode: ""
  });

  // Update a single field in the new employee form
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Submit the new employee and reset the form
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.firstName || !form.lastName) return;

    onSubmit({
      name: `${form.firstName} ${form.lastName}`,
      phone: form.loginCode,
      position: form.role,
      email: form.email,
      loginCode: form.loginCode,
      profilePicture: form.profilePicture
    });

    setForm({
      firstName: "",
      lastName: "",
      email: "",
      loginCode: "",
      role: "Waiter",
      profilePicture: ""
    });
  };

  // Convert the selected image file to a base64 data URL
  const handleProfilePictureChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      handleChange("profilePicture", "");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange("profilePicture", typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  };

  // Show/hide the login code for a specific employee row
  const toggleCode = (employeeId) => {
    setRevealedCodes((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  // Put a row into edit mode, pre-filling fields with current values
  const startEditing = (employee) => {
    setEditingEmployeeId(employee.id);
    setEditForm({
      name: employee.name || "",
      email: employee.email || "",
      role: employee.position || "Waiter",
      loginCode: employee.loginCode || employee.phone || ""
    });
  };

  // Exit edit mode without saving
  const cancelEditing = () => {
    setEditingEmployeeId(null);
    setEditForm({
      name: "",
      email: "",
      role: "Waiter",
      loginCode: ""
    });
  };

  // Save changes for the employee being edited
  const saveEditing = (employeeId) => {
    const trimmedName = editForm.name.trim();
    if (!trimmedName) return;

    onUpdateEmployee?.(employeeId, {
      name: trimmedName,
      email: editForm.email.trim(),
      position: editForm.role,
      loginCode: editForm.loginCode.trim(),
      phone: editForm.loginCode.trim()
    });

    cancelEditing();
  };

  // Ask for confirmation before removing an employee
  const removeEmployee = (employeeId) => {
    const confirmed = window.confirm("Remove this employee from the list?");
    if (!confirmed) return;

    onDeleteEmployee?.(employeeId);
    if (editingEmployeeId === employeeId) {
      cancelEditing();
    }
  };

  // Return a CSS class based on the employee's role
  const getRoleClass = (roleValue = "") => {
    const role = String(roleValue).toLowerCase();
    if (role.includes("head")) return "role-head";
    if (role.includes("runner")) return "role-runner";
    return "role-waiter";
  };

  // Return the login code or dots depending on the revealed state
  const renderCode = (employee) => {
    const code = employee.loginCode || employee.phone || "----";
    if (revealedCodes[employee.id]) return code;
    return "••••";
  };

  return (
    <div className="card register-card">
      <div className="register-header">
        <h2>Register new employee</h2>
        <div className="register-brand">
          <div className="brand-title">Sundsgarden</div>
          <div className="brand-subtitle">HOTELL | KONFERENS</div>
        </div>
      </div>

      <form className="register-layout" onSubmit={handleSubmit}>
        <div className="register-fields">
          <label>
            <div className="field-head">
              <span>First name</span>
              <span className="field-required">Required</span>
            </div>
            <input
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
            />
          </label>

          <label>
            <div className="field-head">
              <span>Last name</span>
              <span className="field-required">Required</span>
            </div>
            <input
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
            />
          </label>

          <label>
            <div className="field-head">
              <span>Email</span>
              <span className="field-required">Required</span>
            </div>
            <input
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </label>

          <label>
            <div className="field-head">
              <span>Login code</span>
              <span className="field-required">Required</span>
            </div>
            <input
              value={form.loginCode}
              onChange={(e) => handleChange("loginCode", e.target.value)}
            />
          </label>
        </div>

        <div className="register-side">
          <label>
            <div className="field-head simple">
              <span>Role</span>
            </div>
            <select value={form.role} onChange={(e) => handleChange("role", e.target.value)}>
              <option value="Waiter">Waiter</option>
              <option value="Runner">Runner</option>
              <option value="Head Waiter">Head Waiter</option>
            </select>
          </label>
        </div>

        <div className="register-photo">
          <div className="field-head simple">
            <span>Upload Photo</span>
          </div>
          <label className="upload-box" htmlFor="profile-picture-input">
            {form.profilePicture ? (
              <img src={form.profilePicture} alt="Profile preview" className="upload-preview" />
            ) : (
              <span className="upload-placeholder">+</span>
            )}
          </label>
          <input
            id="profile-picture-input"
            className="upload-input"
            type="file"
            accept="image/*"
            onChange={handleProfilePictureChange}
          />

          <button type="submit" className="submit-register">Submit</button>
        </div>
      </form>

      <div className="registered-section">
        <h3>Registered employees</h3>
        <div className="registered-table-wrap">
          <table className="registered-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="registered-empty">No employees registered yet.</td>
                </tr>
              )}
              {employees.map((employee) => {
                const isEditing = editingEmployeeId === employee.id;

                return (
                  <tr key={employee.id}>
                    <td>
                      {isEditing ? (
                        <input
                          className="table-input"
                          value={editForm.name}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      ) : (
                        employee.name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="table-input"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      ) : (
                        employee.email || "-"
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          className="table-select"
                          value={editForm.role}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                        >
                          <option value="Waiter">Waiter</option>
                          <option value="Runner">Runner</option>
                          <option value="Head Waiter">Head Waiter</option>
                        </select>
                      ) : (
                        <span className={`role-pill ${getRoleClass(employee.position)}`}>
                          {employee.position || "Waiter"}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="table-input"
                          value={editForm.loginCode}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, loginCode: e.target.value }))}
                        />
                      ) : (
                        <span className="code-text">{renderCode(employee)}</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {isEditing ? (
                          <>
                            <button type="button" className="table-btn primary" onClick={() => saveEditing(employee.id)}>
                              Save
                            </button>
                            <button type="button" className="table-btn" onClick={cancelEditing}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="table-btn" onClick={() => toggleCode(employee.id)}>
                              {revealedCodes[employee.id] ? "Hide" : "Show"}
                            </button>
                            <button type="button" className="table-btn" onClick={() => startEditing(employee)}>
                              Edit
                            </button>
                            <button type="button" className="table-btn danger" onClick={() => removeEmployee(employee.id)}>
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}