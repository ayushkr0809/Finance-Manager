import { useEffect, useState } from "react";
import { listBudgets, setBudget } from "../api";
import { EXPENSE_CATEGORIES } from "../constants";
import { useCurrency } from "../CurrencyContext";

export default function BudgetSection() {
  const { formatMoney } = useCurrency();
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({ category: "", monthly_limit: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      setBudgets(await listBudgets());
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
      await setBudget({ category: form.category, monthly_limit: parseFloat(form.monthly_limit) });
      setForm({ category: "", monthly_limit: "" });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="section-eyebrow">Monthly limits</p>
      <h1 className="section-title">Budgets</h1>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <h3>Set a budget</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="Overall">Overall</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Monthly limit</label>
              <input
                type="number"
                step="0.01"
                value={form.monthly_limit}
                onChange={(e) => setForm({ ...form, monthly_limit: e.target.value })}
                required
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            Save budget
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>This month</h3>
        <table className="ledger">
          <thead>
            <tr>
              <th>Category</th>
              <th>Limit</th>
              <th>Spent</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.category}>
                <td>{b.category}</td>
                <td className="money">{formatMoney(b.monthly_limit)}</td>
                <td className="money">{formatMoney(b.spent)}</td>
                <td className="money" style={{ color: b.remaining >= 0 ? "var(--emerald)" : "var(--rose)" }}>
                  {formatMoney(b.remaining)}
                </td>
              </tr>
            ))}
            {budgets.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: "var(--ink-dim)" }}>
                  No budgets set yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
