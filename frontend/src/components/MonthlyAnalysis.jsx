import { useEffect, useMemo, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getMonthlySummary } from "../api";
import { useCurrency } from "../CurrencyContext";
import { MONTH_NAMES } from "../utils";

const COLORS = ["#34d399", "#fb7185", "#eab308", "#60a5fa", "#a78bfa", "#f472b6", "#2dd4bf"];

const now = new Date();

export default function MonthlyAnalysis({ creationYear }) {
  const { formatMoney } = useCurrency();
  const startYear = creationYear || now.getFullYear();
  const YEAR_OPTIONS = useMemo(
    () => Array.from({ length: now.getFullYear() - startYear + 1 }, (_, i) => now.getFullYear() - i),
    [startYear]
  );
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setError("");
      setLoading(true);
      try {
        setSummary(await getMonthlySummary(year, month));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [year, month]);

  return (
    <div>
      <div className="form-row" style={{ marginBottom: 0 }}>
        <div className="field">
          <label>Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && <p style={{ color: "var(--ink-dim)" }}>Loading...</p>}

      {summary && !loading && (
        <>
          <div className="balance-cards">
            <div className="balance-card">
              <div className="label">Income</div>
              <div className="value" style={{ color: "var(--emerald)" }}>
                {formatMoney(summary.income)}
              </div>
            </div>
            <div className="balance-card">
              <div className="label">Expense</div>
              <div className="value" style={{ color: "var(--rose)" }}>
                {formatMoney(summary.expense)}
              </div>
            </div>
            <div className="balance-card">
              <div className="label">Balance</div>
              <div className="value">{formatMoney(summary.balance)}</div>
            </div>
            <div className="balance-card">
              <div className="label">Transactions</div>
              <div className="value">{summary.transaction_count}</div>
            </div>
          </div>

          <div className="panel">
            <h3>
              Expense breakdown — {MONTH_NAMES[month - 1]} {year}
            </h3>
            {summary.by_category.length === 0 ? (
              <p style={{ color: "var(--ink-dim)" }}>No expenses this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={summary.by_category}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  >
                    {summary.by_category.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#16202f", border: "1px solid rgba(148,197,178,0.3)", borderRadius: 8 }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
