import { useState } from "react";
import tableImg from "../assets/table.png";
import logoImg from "../assets/logo.png";

export default function LoginScreen({ role, onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const result = await onLogin({
      email: email.trim(),
      password,
      rememberMe
    });

    setIsSubmitting(false);

    if (!result?.ok) {
      setError(result?.message || "Login failed");
    }
  };

  return (
    <div className="login-screen">
      {/* Left panel — restaurant background */}
      <div
        className="login-screen__left"
        style={{ backgroundImage: `url(${tableImg})` }}
      >
        <div className="login-screen__left-overlay">
          <h1 className="login-screen__brand">Sundsgården</h1>
          <p className="login-screen__tagline">Employee Scheduling System</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="login-screen__right">
        <div className="login-screen__panel">
          <button className="login-screen__back link" onClick={onBack}>
            ← Back
          </button>

          <div className="login-screen__header">
            <img src={logoImg} alt="Sundsgården logo" className="login-screen__logo" />
            <h2 className="login-screen__title">Login</h2>
            <p className="login-screen__subtitle">
              {role === "employer" ? "Employer login" : "Employee login"} — enter your details below
            </p>
          </div>

          <form className="login-screen__form" onSubmit={handleSubmit}>
            {/* Email field */}
            <div className="login-field">
              <label className="login-field__label" htmlFor="login-email">
                Email
              </label>
              <div className="login-field__input-wrap">
                <svg className="login-field__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="1.667" y="4.167" width="16.666" height="11.666" rx="1.667" stroke="#667085" strokeWidth="1.5"/>
                  <path d="M1.667 5.833l8.333 5.834 8.333-5.834" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="login-field__input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="login-field">
              <label className="login-field__label" htmlFor="login-password">
                Password
              </label>
              <div className="login-field__input-wrap">
                <svg className="login-field__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="3.333" y="9.167" width="13.334" height="9.166" rx="1.667" stroke="#667085" strokeWidth="1.5"/>
                  <path d="M6.667 9.167V6.667a3.333 3.333 0 016.666 0v2.5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="login-field__input"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="login-options-row">
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button type="button" className="login-forgot">
                Forgot Password?
              </button>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>

            <p className="login-signup-row">
              Don&apos;t have an account yet?{" "}
              <button type="button" className="login-signup-link">
                Sign up
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
