import { PiggyBank, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { addGoal, contributeToGoal, deleteGoal, listGoals } from "../api";
import { useCurrency } from "../CurrencyContext";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";

export default function GoalsSection() {
  const { formatMoney } = useCurrency();
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ name: "", target_amount: "", target_date: "" });
  const [contributions, setContributions] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  async function refresh() {
    try {
      setGoals(await listGoals());
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
      await addGoal({
        name: form.name,
        target_amount: form.target_amount,
        target_date: form.target_date || null,
      });
      setForm({ name: "", target_amount: "", target_date: "" });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleContribute(goalId) {
    const amount = contributions[goalId];
    if (!amount || parseFloat(amount) <= 0) return;
    try {
      await contributeToGoal(goalId, { amount });
      setContributions({ ...contributions, [goalId]: "" });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmDelete() {
    try {
      await deleteGoal(pendingDelete);
      setPendingDelete(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <p className="section-eyebrow">Save toward something</p>
      <h1 className="section-title">Goals</h1>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <h3>New goal</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label>Target amount</label>
              <input
                value={form.target_amount}
                onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Target date (optional)</label>
              <input
                type="date"
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            Create goal
          </button>
        </form>
      </div>

      {goals.length === 0 && (
        <div className="panel">
          <EmptyState icon={PiggyBank} message="No goals yet — create one above to start tracking progress." />
        </div>
      )}

      {goals.map((g) => {
        const target = parseFloat(g.target_amount) || 0;
        const current = parseFloat(g.current_amount) || 0;
        const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
        const reached = current >= target && target > 0;

        return (
          <div className="panel goal-card" key={g.id}>
            <div className="goal-card-header">
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                  <Target size={16} color="var(--emerald)" className="float-icon" />
                  {g.name}
                </h3>
                {g.target_date && <p className="recent-badge">Target: {g.target_date}</p>}
              </div>
              <button className="btn btn-danger" style={{ padding: "5px 10px" }} onClick={() => setPendingDelete(g.id)}>
                Delete
              </button>
            </div>

            <div className="goal-progress-track">
              <div
                className="goal-progress-fill"
                style={{ width: `${pct}%`, background: reached ? "var(--emerald)" : "var(--amber)" }}
              />
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-dim)", margin: "8px 0 16px" }}>
              <span className="money">{formatMoney(current)}</span> of{" "}
              <span className="money">{formatMoney(target)}</span> — {pct.toFixed(0)}%{reached ? " 🎉 reached!" : ""}
            </p>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Add amount"
                value={contributions[g.id] || ""}
                onChange={(e) => setContributions({ ...contributions, [g.id]: e.target.value })}
                style={{ maxWidth: 160 }}
              />
              <button className="btn btn-ghost" onClick={() => handleContribute(g.id)}>
                Contribute
              </button>
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this goal?"
        message="This removes the goal and its progress. Your transactions aren't affected."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
