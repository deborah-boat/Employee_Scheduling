import { useState } from "react";

export default function LoginScreen({ role, onLogin, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="app">
      <div className="card narrow">
        <button className="link" onClick={onBack}>← Back</button>
        <h1>Sundsgården</h1>
        <h2>{role === "employer" ? "Employer login" : "Employee login"}</h2>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button onClick={() => onLogin(username)}>Login</button>
      </div>
    </div>
  );
}
