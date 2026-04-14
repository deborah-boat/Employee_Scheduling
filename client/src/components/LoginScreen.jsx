import { useState } from "react";

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
    <div className="app">
      <div className="card narrow">
        <button className="link" onClick={onBack}>← Back</button>
        <h1>Sundsgården</h1>
        <h2>{role === "employer" ? "Employer login" : "Employee login"}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>

          {error && <p>{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
