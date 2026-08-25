import { ArrowUpDown, Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EXPENSE_CATEGORIES } from "../constants";
import { useCurrency } from "../CurrencyContext";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";

export default function TransactionSection({
  title,
  eyebrow,
  type, // "income" | "expense"
  list,
  add,
  edit,
  remove,
  extraBeforeSubmit, // optional async fn(formData) -> array of alert strings
}) {
  const { formatMoney } = useCurrency();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    amount: "",
    category: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [categoryFilter, setCategoryFilter] = useState("");

  async function refresh() {
    try {
      setItems(await list());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setAlerts([]);

    const parsedAmount = parseFloat(form.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a number greater than 0.");
      return;
    }

    setLoading(true);
    try {
      if (extraBeforeSubmit) {
        const { alerts: newAlerts } = await extraBeforeSubmit(form);
        if (newAlerts?.length) setAlerts(newAlerts);
      }

      if (editingId) {
        await edit(editingId, form);
        setEditingId(null);
      } else {
        await add(form);
      }
      setForm({ amount: "", category: "", date: new Date().toISOString().slice(0, 10), notes: "" });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({ amount: item.amount, category: item.category, date: item.date, notes: item.notes });
  }

  async function confirmDelete() {
    try {
      await remove(pendingDelete);
      setPendingDelete(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const categoriesPresent = useMemo(
    () => [...new Set(items.map((i) => i.category))].sort(),
    [items]
  );

  const visibleItems = useMemo(() => {
    let rows = items;
    if (categoryFilter) rows = rows.filter((i) => i.category === categoryFilter);

    const sorted = [...rows].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === "amount") {
        av = parseFloat(av);
        bv = parseFloat(bv);
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [items, categoryFilter, sortKey, sortDir]);

  function SortHeader({ label, sortField }) {
    return (
      <th onClick={() => toggleSort(sortField)} className="sortable-header">
        {label}
        <ArrowUpDown size={11} style={{ marginLeft: 4, opacity: sortKey === sortField ? 1 : 0.35 }} />
      </th>
    );
  }

  return (
    <div>
      <p className="section-eyebrow">{eyebrow}</p>
      <h1 className="section-title">{title}</h1>

      {error && <div className="error-banner">{error}</div>}
      {alerts.map((a, i) => (
        <div className="alert-banner" key={i}>
          ⚠️ {a}
        </div>
      ))}

      <div className="panel">
        <h3>{editingId ? "Edit entry" : `Add ${type}`}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label>Amount</label>
              <input name="amount" value={form.amount} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Category</label>
              {type === "expense" ? (
                <select name="category" value={form.category} onChange={handleChange} required>
                  <option value="" disabled>
                    Select category
                  </option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input name="category" value={form.category} onChange={handleChange} required />
              )}
            </div>
            <div className="field">
              <label>Date</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Notes</label>
              <input name="notes" value={form.notes} onChange={handleChange} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {editingId ? "Save changes" : `Add ${type}`}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginLeft: 10 }}
              onClick={() => {
                setEditingId(null);
                setForm({ amount: "", category: "", date: new Date().toISOString().slice(0, 10), notes: "" });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>History</h3>
          {categoriesPresent.length > 1 && (
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="">All categories</option>
              {categoriesPresent.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
        {visibleItems.length === 0 ? (
          <EmptyState
            icon={Inbox}
            message={`No ${type} entries ${categoryFilter ? "in this category" : "yet"}. Add one above to get started.`}
          />
        ) : (
          <table className="ledger">
            <thead>
              <tr>
                <SortHeader label="Date" sortField="date" />
                <SortHeader label="Category" sortField="category" />
                <SortHeader label="Amount" sortField="amount" />
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{item.category}</td>
                  <td className="money">{formatMoney(item.amount)}</td>
                  <td>{item.notes}</td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: "5px 10px", marginRight: 6 }} onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" style={{ padding: "5px 10px" }} onClick={() => setPendingDelete(item.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this entry?"
        message="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
