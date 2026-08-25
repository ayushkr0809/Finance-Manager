import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getBalance, getDailyExpense, listBudgets, listExpense, listIncome } from "../api";
import { useCurrency } from "../CurrencyContext";

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function OverviewSection({ username, onNavigate }) {
  const { formatMoney } = useCurrency();
  const [balance, setBalance] = useState(null);
  const [recent, setRecent] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [topCategory, setTopCategory] = useState(null);
  const [avgDailySpend, setAvgDailySpend] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [b, income, expense, daily, budgets] = await Promise.all([
          getBalance(),
          listIncome(),
          listExpense(),
          getDailyExpense(),
          listBudgets(),
        ]);
        setBalance(b);

        const merged = [...income, ...expense]
          .sort((a, b2) => new Date(b2.date) - new Date(a.date))
          .slice(0, 6);
        setRecent(merged);

        setDailyData(daily.map((p) => ({ ...p, label: dayLabel(p.date) })));
        setAvgDailySpend(daily.reduce((sum, p) => sum + p.total, 0) / (daily.length || 1));

        setBudgetAlerts(budgets.filter((bud) => bud.remaining < 0 || bud.spent / bud.monthly_limit >= 0.8));

        const categoryTotals = {};
        expense.forEach((e) => {
          categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
        });
        const sorted = Object.entries(categoryTotals).sort((a, b2) => b2[1] - a[1]);
        if (sorted.length > 0) setTopCategory({ category: sorted[0][0], total: sorted[0][1] });
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  return (
    <div>
      <p className="section-eyebrow">Welcome back{username ? `, ${username}` : ""}</p>
      <h1 className="section-title">Overview</h1>

      {error && <div className="error-banner">{error}</div>}

      {budgetAlerts.map((b) => (
        <div className="alert-banner" key={b.category} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={14} />
          {b.remaining < 0
            ? `${b.category} is over budget by ${formatMoney(Math.abs(b.remaining))} this month.`
            : `${b.category} is at ${((b.spent / b.monthly_limit) * 100).toFixed(0)}% of its monthly budget.`}
        </div>
      ))}

      <div className="overview-quick-actions">
        <button className="btn btn-primary" onClick={() => onNavigate("expense")}>
          <ArrowDownCircle size={15} style={{ marginRight: 6, verticalAlign: "-3px" }} />
          Add expense
        </button>
        <button className="btn btn-ghost" onClick={() => onNavigate("income")}>
          <ArrowUpCircle size={15} style={{ marginRight: 6, verticalAlign: "-3px" }} />
          Add income
        </button>
      </div>

      {balance && (
        <div className="balance-cards">
          <div className="balance-card accent-emerald">
            <div className="label">
              <TrendingUp size={13} className="float-icon" style={{ marginRight: 5, verticalAlign: "-2px" }} />
              Income
            </div>
            <div className="value" style={{ color: "var(--emerald)" }}>
              {formatMoney(balance.income)}
            </div>
          </div>
          <div className="balance-card accent-rose">
            <div className="label">
              <TrendingDown size={13} className="float-icon" style={{ marginRight: 5, verticalAlign: "-2px" }} />
              Expense
            </div>
            <div className="value" style={{ color: "var(--rose)" }}>
              {formatMoney(balance.expense)}
            </div>
          </div>
          <div className="balance-card">
            <div className="label">
              <Wallet size={13} className="float-icon" style={{ marginRight: 5, verticalAlign: "-2px" }} />
              Balance
            </div>
            <div className="value">{formatMoney(balance.balance)}</div>
          </div>
          <div className="balance-card">
            <div className="label">Avg. daily spend</div>
            <div className="value" style={{ fontSize: 20 }}>
              {formatMoney(avgDailySpend)}
            </div>
          </div>
        </div>
      )}

      {topCategory && (
        <p style={{ color: "var(--ink-dim)", fontSize: 13, marginTop: -12, marginBottom: 24 }}>
          Top spending category overall: <strong style={{ color: "var(--ink)" }}>{topCategory.category}</strong> (
          {formatMoney(topCategory.total)})
        </p>
      )}

      <div className="panel">
        <h3>Last 30 days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,197,178,0.12)" />
            <XAxis dataKey="label" stroke="#8fa3a0" fontSize={10} interval={3} />
            <YAxis stroke="#8fa3a0" fontSize={11} />
            <Tooltip contentStyle={{ background: "#16202f", border: "1px solid rgba(148,197,178,0.3)", borderRadius: 8 }} />
            <Line type="monotone" dataKey="total" stroke="#fb7185" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <h3>Recent activity</h3>
        <table className="ledger">
          <thead>
            <tr>
              <th>Type</th>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((item) => (
              <tr key={`${item.type}-${item.id}`}>
                <td>
                  <span className={`pill ${item.type === "income" ? "pill-income" : "pill-expense"}`}>{item.type}</span>
                </td>
                <td>{item.date}</td>
                <td>{item.category}</td>
                <td className="money">{formatMoney(item.amount)}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: "var(--ink-dim)" }}>
                  Nothing logged yet — add your first income or expense above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
