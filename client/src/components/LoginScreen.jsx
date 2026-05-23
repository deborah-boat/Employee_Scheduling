import { useState } from "react";
import tableImg from "../assets/table.png";
import logoImg from "../assets/logo.png";

export default function LoginScreen({ role, onLogin, onBack }) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const result = await onLogin({});
    setIsSubmitting(false);
    if (!result?.ok) {
      setError(result?.message || "Unable to start sign-in");
    }
  };

  return (
    <div className="login-screen">
      <div
        className="login-screen__left"
        style={{ backgroundImage: `url(${tableImg})` }}
      >
        <div className="login-screen__left-overlay">
          <h1 className="login-screen__brand">Sundsgarden</h1>
          <p className="login-screen__tagline">Employee Scheduling System</p>
        </div>
      </div>

      <div className="login-screen__right">
        <div className="login-screen__panel">
          <button className="login-screen__back link" onClick={onBack}>
            Back
          </button>

          <div className="login-screen__header">
            <img src={logoImg} alt="Restaurant logo" className="login-screen__logo" />
            <h2 className="login-screen__title">Log in</h2>
            <p className="login-screen__subtitle">
              {role === "employer" ? "Employer access" : "Employee access"} - continue with Auth0
            </p>
          </div>

          <form className="login-screen__form" onSubmit={handleSubmit}>
            {error && <p className="login-error">{error}</p>}

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