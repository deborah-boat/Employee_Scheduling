import { useState } from "react";
import "../styles/RegisterEmployeeForm.css";

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

  // Return the login code or dots depending on the revealed state
  const renderCode = (employee) => {
    const code = employee.loginCode || employee.phone || "----";
    if (revealedCodes[employee.id]) return code;
    return "••••";
  };

  return (
    <div className="ref-container">

      {/* ── Register new employee ── */}
      <div className="ref-section">
        <div className="ref-heading">
          <svg className="ref-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2 className="ref-title">Register new employee</h2>
          <span className="ref-underline" />
        </div>

        <form className="ref-form" onSubmit={handleSubmit}>
          {/* Photo upload */}
          <div className="ref-photo-row">
            <label className="ref-photo-box" htmlFor="profile-picture-input">
              {form.profilePicture ? (
                <img src={form.profilePicture} alt="Profile preview" className="ref-photo-img" />
              ) : (
                <svg className="ref-photo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </label>
            <input
              id="profile-picture-input"
              type="file"
              accept="image/*"
              className="ref-file-input"
              onChange={handleProfilePictureChange}
            />
          </div>

          {/* Input grid */}
          <div className="ref-grid">
            <input
              className="ref-input"
              placeholder="First Name"
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
            />
            <input
              className="ref-input"
              placeholder="Last Name"
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
            />
            <input
              className="ref-input"
              placeholder="Email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            <input
              className="ref-input"
              placeholder="Login Code"
              value={form.loginCode}
              onChange={(e) => handleChange("loginCode", e.target.value)}
            />
            <div className="ref-select-wrap">
              <select
                className="ref-input ref-select"
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
              >
                <option value="Waiter">Waiter</option>
                <option value="Runner">Runner</option>
                <option value="Head Waiter">Head Waiter</option>
              </select>
            </div>
            <button type="submit" className="ref-btn-submit" onClick={handleSubmit}>
              + Register
            </button>
          </div>
        </form>
      </div>

      {/* ── Registered employees ── */}
      <div className="ref-section">
        <div className="ref-heading">
          <svg className="ref-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2 className="ref-title">Registered employees</h2>
          <span className="ref-underline" />
        </div>

        <div className="ref-table-scroll">
          <table className="ref-table">
            <thead>
              <tr>
                <th><div className="ref-cell">Name</div></th>
                <th><div className="ref-cell">Email</div></th>
                <th><div className="ref-cell">Role</div></th>
                <th><div className="ref-cell">Code</div></th>
                <th><div className="ref-cell">Actions</div></th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="ref-empty">No employees registered yet.</td>
                </tr>
              )}
              {employees.map((employee) => {
                const isEditing = editingEmployeeId === employee.id;
                return (
                  <tr key={employee.id}>
                    <td>
                      <div className="ref-cell">
                        {isEditing ? (
                          <input
                            className="ref-edit-input"
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                          />
                        ) : employee.name}
                      </div>
                    </td>
                    <td>
                      <div className="ref-cell">
                        {isEditing ? (
                          <input
                            className="ref-edit-input"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                          />
                        ) : (employee.email || "-")}
                      </div>
                    </td>
                    <td>
                      <div className="ref-cell">
                        {isEditing ? (
                          <select
                            className="ref-edit-select"
                            value={editForm.role}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                          >
                            <option value="Waiter">Waiter</option>
                            <option value="Runner">Runner</option>
                            <option value="Head Waiter">Head Waiter</option>
                          </select>
                        ) : (employee.position || "Waiter")}
                      </div>
                    </td>
                    <td>
                      <div className="ref-cell">
                        {isEditing ? (
                          <input
                            className="ref-edit-input"
                            value={editForm.loginCode}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, loginCode: e.target.value }))}
                          />
                        ) : renderCode(employee)}
                      </div>
                    </td>
                    <td>
                      <div className="ref-cell">
                        <div className="ref-actions">
                          {isEditing ? (
                            <>
                              <button type="button" className="ref-btn ref-btn-primary" onClick={() => saveEditing(employee.id)}>
                                Save
                              </button>
                              <button type="button" className="ref-btn" onClick={cancelEditing}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button type="button" className="ref-btn" onClick={() => toggleCode(employee.id)}>
                                {revealedCodes[employee.id] ? "Hide" : "Show"}
                              </button>
                              <button type="button" className="ref-btn" onClick={() => startEditing(employee)}>
                                Edit
                              </button>
                              <button type="button" className="ref-btn ref-btn-danger" onClick={() => removeEmployee(employee.id)}>
                                Remove
                              </button>
                            </>
                          )}
                        </div>
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