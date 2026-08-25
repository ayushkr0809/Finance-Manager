import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getYearlySummary } from "../api";
import { useCurrency } from "../CurrencyContext";
import { MONTH_NAMES } from "../utils";

const COLORS = ["#34d399", "#fb7185", "#eab308", "#60a5fa", "#a78bfa", "#f472b6", "#2dd4bf"];
const SHORT_MONTHS = MONTH_NAMES.map((m) => m.slice(0, 3));

const now = new Date();

export default function YearlyAnalysis({ creationYear }) {
  const { formatMoney } = useCurrency();
  const startYear = creationYear || now.getFullYear();
  const YEAR_OPTIONS = useMemo(
    () => Array.from({ length: now.getFullYear() - startYear + 1 }, (_, i) => now.getFullYear() - i),
    [startYear]
  );
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setError("");
      setLoading(true);
      try {
        setSummary(await getYearlySummary(year));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [year]);

  const chartData = summary?.monthly_breakdown.map((m) => ({ ...m, label: SHORT_MONTHS[m.month - 1] })) || [];

  return (
    <div>
      <div className="form-row" style={{ marginBottom: 0, maxWidth: 200 }}>
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
          </div>

          <div className="panel">
            <h3>Month by month — {year}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,197,178,0.12)" />
                <XAxis dataKey="label" stroke="#8fa3a0" fontSize={12} />
                <YAxis stroke="#8fa3a0" fontSize={12} />
                <Tooltip contentStyle={{ background: "#16202f", border: "1px solid rgba(148,197,178,0.3)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel">
            <h3>Expense breakdown — {year}</h3>
            {summary.by_category.length === 0 ? (
              <p style={{ color: "var(--ink-dim)" }}>No expenses this year.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={summary.by_category}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
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
