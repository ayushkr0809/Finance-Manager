import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getBalance, getBalanceTrend, getDailyExpense, getExpenseByCategory, getMonthlyTrend } from "../api";
import { useCurrency } from "../CurrencyContext";
import MonthlyAnalysis from "./MonthlyAnalysis";
import YearlyAnalysis from "./YearlyAnalysis";

const COLORS = ["#34d399", "#fb7185", "#eab308", "#60a5fa", "#a78bfa", "#f472b6", "#2dd4bf"];
const TABS = [
  { id: "trends", label: "Trends" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

function monthLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function TrendsView() {
  const { formatMoney } = useCurrency();
  const [balance, setBalance] = useState(null);
  const [expenseData, setExpenseData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [balanceTrend, setBalanceTrend] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [b, e, t, d, bt] = await Promise.all([
          getBalance(),
          getExpenseByCategory(),
          getMonthlyTrend(),
          getDailyExpense(),
          getBalanceTrend(90),
        ]);
        setBalance(b);
        setExpenseData(e);
        setTrendData(t.map((point) => ({ ...point, label: monthLabel(point.month) })));
        setDailyData(d.map((point) => ({ ...point, label: dayLabel(point.date) })));
        setBalanceTrend(bt.map((point) => ({ ...point, label: dayLabel(point.date) })));
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      {balance && (
        <div className="balance-cards">
          <div className="balance-card">
            <div className="label">Income</div>
            <div className="value" style={{ color: "var(--emerald)" }}>
              {formatMoney(balance.income)}
            </div>
          </div>
          <div className="balance-card">
            <div className="label">Expense</div>
            <div className="value" style={{ color: "var(--rose)" }}>
              {formatMoney(balance.expense)}
            </div>
          </div>
          <div className="balance-card">
            <div className="label">Balance</div>
            <div className="value">{formatMoney(balance.balance)}</div>
          </div>
        </div>
      )}

      <div className="panel">
        <h3>Running balance — last 90 days</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={balanceTrend}>
            <defs>
              <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,197,178,0.12)" />
            <XAxis dataKey="label" stroke="#8fa3a0" fontSize={10} interval={9} />
            <YAxis stroke="#8fa3a0" fontSize={12} />
            <Tooltip contentStyle={{ background: "#16202f", border: "1px solid rgba(148,197,178,0.3)", borderRadius: 8 }} />
            <Area type="monotone" dataKey="balance" stroke="#34d399" strokeWidth={2} fill="url(#balanceFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <h3>Daily expense — last 30 days</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,197,178,0.12)" />
            <XAxis dataKey="label" stroke="#8fa3a0" fontSize={11} interval={2} />
            <YAxis stroke="#8fa3a0" fontSize={12} />
            <Tooltip contentStyle={{ background: "#16202f", border: "1px solid rgba(148,197,178,0.3)", borderRadius: 8 }} />
            <Line type="monotone" dataKey="total" name="Expense" stroke="#fb7185" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <h3>Income vs expense — last 6 months</h3>
        {trendData.length === 0 ? (
          <p style={{ color: "var(--ink-dim)" }}>Not enough history yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,197,178,0.12)" />
              <XAxis dataKey="label" stroke="#8fa3a0" fontSize={12} />
              <YAxis stroke="#8fa3a0" fontSize={12} />
              <Tooltip contentStyle={{ background: "#16202f", border: "1px solid rgba(148,197,178,0.3)", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#fb7185" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="panel">
        <h3>Expense by category</h3>
        {expenseData.length === 0 ? (
          <p style={{ color: "var(--ink-dim)" }}>No expenses to chart yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseData}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
              >
                {expenseData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#16202f", border: "1px solid rgba(148,197,178,0.3)", borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default function ReportsSection({ creationYear }) {
  const [tab, setTab] = useState("trends");

  return (
    <div>
      <p className="section-eyebrow">Where you stand</p>
      <h1 className="section-title">Reports</h1>

      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "tab active" : "tab"} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "trends" && <TrendsView />}
      {tab === "monthly" && <MonthlyAnalysis creationYear={creationYear} />}
      {tab === "yearly" && <YearlyAnalysis creationYear={creationYear} />}
    </div>
  );
}
