import { Coins } from "lucide-react";
import { useState } from "react";
import { deleteAccount } from "../api";
import { useCurrency } from "../CurrencyContext";
import { CURRENCIES } from "../constants";

export default function SettingsSection({ onAccountDeleted }) {
  const { currencyCode, setCurrencyCode, formatMoney } = useCurrency();
  const [form, setForm] = useState({ password: "", master_pin: "" });
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canDelete = confirmText === "DELETE";

  async function handleDelete(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await deleteAccount(form);
      onAccountDeleted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="section-eyebrow">Account</p>
      <h1 className="section-title">Settings</h1>

      <div className="panel">
        <h3>
          <Coins size={15} style={{ marginRight: 6, verticalAlign: "-2px" }} />
          Currency
        </h3>
        <p style={{ color: "var(--ink-dim)", fontSize: 13, marginBottom: 18 }}>
          Changes how every amount is displayed across the app — your stored
          numbers don't change, just how they're formatted. Example:{" "}
          <span className="money">{formatMoney(1234.5)}</span>
        </p>
        <div className="field" style={{ maxWidth: 280 }}>
          <label>Display currency</label>
          <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel" style={{ borderColor: "rgba(251, 113, 133, 0.35)" }}>
        <h3 style={{ color: "var(--rose)" }}>Danger zone</h3>
        <p style={{ color: "var(--ink-dim)", fontSize: 13, marginBottom: 18 }}>
          This permanently deletes your account and every income, expense, budget,
          and recurring entry tied to it. There's no undo.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleDelete}>
          <div className="form-row">
            <div className="field">
              <label>Login password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Master PIN</label>
              <input
                type="password"
                value={form.master_pin}
                onChange={(e) => setForm({ ...form, master_pin: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Type DELETE to confirm</label>
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-danger" type="submit" disabled={loading || !canDelete}>
            {loading ? "Deleting..." : "Permanently delete my account"}
          </button>
        </form>
      </div>
    </div>
  );
}
