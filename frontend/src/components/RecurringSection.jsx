import { useEffect, useState } from "react";
import { addRecurring, deleteRecurring, listRecurring, processRecurring } from "../api";
import { useCurrency } from "../CurrencyContext";
import ConfirmDialog from "./ConfirmDialog";

export default function RecurringSection() {
  const { formatMoney } = useCurrency();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ category: "", amount: "", notes: "Auto" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  async function refresh() {
    try {
      setItems(await listRecurring());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await addRecurring({ ...form, frequency: "daily" });
      setForm({ category: "", amount: "", notes: "Auto" });
      await processRecurring();
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    try {
      await deleteRecurring(pendingDelete);
      setPendingDelete(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <p className="section-eyebrow">Auto-added daily</p>
      <h1 className="section-title">Recurring Expenses</h1>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <h3>New template</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            </div>
            <div className="field">
              <label>Amount</label>
              <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="field">
              <label>Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            Add template
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>Templates</h3>
        <table className="ledger">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Last processed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td>{t.category}</td>
                <td className="money">{formatMoney(t.amount)}</td>
                <td>{t.last_processed_date || "—"}</td>
                <td>
                  <button className="btn btn-danger" style={{ padding: "5px 10px" }} onClick={() => setPendingDelete(t.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: "var(--ink-dim)" }}>
                  No recurring templates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this template?"
        message="Future daily entries from this template will stop. Past entries already added stay untouched."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
