import { useState } from "react";
// Background image for the left panel
import tableImg from "../assets/table.png";
// Restaurant logo shown in the login panel
import logoImg from "../assets/logo.png";

// LoginScreen receives:
// - role: "employer" or "employee" — used to show the right subtitle
// - onLogin: function called when the user submits — triggers the Auth0 redirect
// - onBack: function called when the user clicks the back button
export default function LoginScreen({ role, onLogin, onBack }) {
  // error holds any message to show if the login attempt fails
  const [error, setError] = useState("");
  // isSubmitting prevents double-clicks and shows a "Redirecting..." label
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    // Stop the browser from reloading the page on form submit
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    // Call the parent's onLogin — this starts the Auth0 redirect flow
    const result = await onLogin({});
    setIsSubmitting(false);
    // If something went wrong before the redirect, show the error message
    if (!result?.ok) {
      setError(result?.message || "Unable to start sign-in");
    }
  };

  return (
    <div className="login-screen">
      {/* Left side — decorative background image with the app name on top */}
      <div
        className="login-screen__left"
        style={{ backgroundImage: `url(${tableImg})` }}
      >
        <div className="login-screen__left-overlay">
          <h1 className="login-screen__brand">Sundsgarden</h1>
          <p className="login-screen__tagline">Employee Scheduling System</p>
        </div>
      </div>

      {/* Right side — the actual login panel */}
      <div className="login-screen__right">
        <div className="login-screen__panel">
          {/* Back button returns the user to the role selection screen */}
          <button className="login-screen__back link" onClick={onBack}>
            Back
          </button>

          <div className="login-screen__header">
            <img src={logoImg} alt="Restaurant logo" className="login-screen__logo" />
            <h2 className="login-screen__title">Log in</h2>
            {/* Subtitle changes based on whether the user is logging in as employer or employee */}
            <p className="login-screen__subtitle">
              {role === "employer" ? "Employer access" : "Employee access"} - continue with Auth0
            </p>
          </div>

          <form className="login-screen__form" onSubmit={handleSubmit}>
            {/* Only show the error message if there is one */}
            {error && <p className="login-error">{error}</p>}

            {/* The submit button triggers the Auth0 redirect — disabled while waiting */}
            <button type="submit" className="login-submit" disabled={isSubmitting}>
              {isSubmitting ? "Redirecting..." : "Continue with Auth0"}
            </button>

            <p className="login-signup-row">
              Don't have an account yet?{" "}
              <button type="button" className="login-signup-link">Sign up</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}