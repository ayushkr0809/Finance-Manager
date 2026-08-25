import { IndianRupee } from "lucide-react";
import { useState } from "react";
import { loginUser } from "./api";
import "./theme.css";
import "./AuthPage.css";

export default function Login({ onNavigateRegister, onLoggedIn }) {
  const [form, setForm] = useState({ username: "", password: "", master_pin: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser(form);
      onLoggedIn?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <IndianRupee size={40} className="auth-brand-icon" />
        <p className="auth-brand-mark">Finance Manager</p>
        <h1 className="auth-brand-headline">Every number, in one ledger you control.</h1>
        <p className="auth-brand-sub">
          Income, expenses, budgets, and goals — encrypted with a Master PIN only you know.
          Not even we can read your amounts.
        </p>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <p className="section-eyebrow">Sign in</p>
          <h1 className="auth-title">Unlock your vault</h1>
          <p className="auth-subtitle">Enter your Master PIN to decrypt your amounts and notes.</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="username">Username</label>
              <input id="username" name="username" value={form.username} onChange={handleChange} required />
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="password">Login password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field" style={{ marginBottom: 20 }}>
              <label htmlFor="master_pin">Master PIN</label>
              <input
                id="master_pin"
                name="master_pin"
                type="password"
                value={form.master_pin}
                onChange={handleChange}
                required
              />
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={loading}>
              {loading ? "Unlocking..." : "Unlock"}
            </button>
          </form>

          <p className="auth-switch">
            New here?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigateRegister?.();
              }}
            >
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
