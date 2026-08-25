import { IndianRupee } from "lucide-react";
import { useState } from "react";
import { registerUser } from "./api";
import "./theme.css";
import "./AuthPage.css";

export default function Register({ onNavigateLogin }) {
  const [form, setForm] = useState({ username: "", password: "", master_pin: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser(form);
      setSuccess(true);
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
        <h1 className="auth-brand-headline">Two secrets. One vault. Nobody else gets in.</h1>
        <p className="auth-brand-sub">
          Your login password proves it's you. Your Master PIN encrypts everything you
          record — they're never the same thing, and neither is ever stored in the clear.
        </p>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <p className="section-eyebrow">Create account</p>
          <h1 className="auth-title">Open your ledger</h1>
          <p className="auth-subtitle">
            Your login password and Master PIN are separate — the PIN encrypts your
            amounts and notes, and only you can unlock them.
          </p>

          {error && <div className="error-banner">{error}</div>}
          {success && (
            <div className="alert-banner">Account created. You can log in now.</div>
          )}

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
              <label htmlFor="master_pin">Master PIN (encrypts your data)</label>
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigateLogin?.();
              }}
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
