import { useState } from "react";

export default function RegisterEmployeeForm({ onSubmit }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    loginCode: "",
    role: "Waiter",
    profilePicture: ""
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
    </div>
  );
}
