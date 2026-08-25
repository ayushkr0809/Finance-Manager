import { useState } from "react";
import { searchByAmount, searchByCategory, searchByDate } from "../api";
import { useCurrency } from "../CurrencyContext";

export default function SearchSection() {
  const { formatMoney } = useCurrency();
  const [mode, setMode] = useState("category");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let data;
      if (mode === "category") data = await searchByCategory(query);
      else if (mode === "date") data = await searchByDate(query);
      else data = await searchByAmount(query);
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="section-eyebrow">Find a transaction</p>
      <h1 className="section-title">Search</h1>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        <form onSubmit={handleSearch}>
          <div className="form-row">
            <div className="field">
              <label>Search by</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="category">Category</option>
                <option value="date">Date</option>
                <option value="amount">Exact amount</option>
              </select>
            </div>
            <div className="field">
              <label>{mode === "date" ? "Date" : mode === "amount" ? "Amount" : "Category text"}</label>
              <input
                type={mode === "date" ? "date" : "text"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            Search
          </button>
        </form>
      </div>

      {searched && (
        <div className="panel">
          <h3>Results</h3>
          <table className="ledger">
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {results.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className={`pill ${t.type === "income" ? "pill-income" : "pill-expense"}`}>{t.type}</span>
                  </td>
                  <td>{t.date}</td>
                  <td>{t.category}</td>
                  <td className="money">{formatMoney(t.amount)}</td>
                  <td>{t.notes}</td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--ink-dim)" }}>
                    No matches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
