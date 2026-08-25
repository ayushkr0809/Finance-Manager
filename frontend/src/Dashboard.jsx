import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Database,
  Home,
  IndianRupee,
  LogOut,
  PiggyBank,
  Repeat,
  Search,
  Settings as SettingsIcon,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser, logout, processRecurring, updateCurrency } from "./api";
import BudgetSection from "./components/BudgetSection";
import ExpenseSection from "./components/ExpenseSection";
import ExportSection from "./components/ExportSection";
import GoalsSection from "./components/GoalsSection";
import IncomeSection from "./components/IncomeSection";
import OverviewSection from "./components/OverviewSection";
import RecurringSection from "./components/RecurringSection";
import ReportsSection from "./components/ReportsSection";
import SearchSection from "./components/SearchSection";
import SettingsSection from "./components/SettingsSection";
import { CurrencyProvider } from "./CurrencyContext";
import "./theme.css";

const NAV = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "income", label: "Income", icon: ArrowUpCircle },
  { id: "expense", label: "Expense", icon: ArrowDownCircle },
  { id: "budget", label: "Budgets", icon: PiggyBank },
  { id: "goals", label: "Goals", icon: Target },
  { id: "recurring", label: "Recurring", icon: Repeat },
  { id: "search", label: "Search", icon: Search },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "export", label: "Data", icon: Database },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Dashboard({ onLoggedOut }) {
  const [active, setActive] = useState("overview");
  const [username, setUsername] = useState("");
  const [currencyCode, setCurrencyCodeState] = useState("INR");
  const [creationYear, setCreationYear] = useState(new Date().getFullYear());

  useEffect(() => {
    (async () => {
      try {
        const me = await getCurrentUser();
        setUsername(me.username);
        setCurrencyCodeState(me.currency || "INR");
        if (me.created_at) setCreationYear(new Date(me.created_at).getFullYear());
      } catch {
        // token invalid/expired — bounce to login
        handleLogout();
      }
      // Mirrors the CLI's "sync recurring on login" step
      processRecurring().catch(() => {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    logout();
    onLoggedOut?.();
  }

  // Updates on screen immediately, then persists to the backend so it
  // sticks across logins. If the save fails, the display already changed —
  // that's an acceptable trade for a preference this low-stakes.
  async function handleCurrencyChange(code) {
    setCurrencyCodeState(code);
    try {
      await updateCurrency(code);
    } catch {
      // non-critical — worst case it reverts to the saved value next login
    }
  }

  return (
    <CurrencyProvider currencyCode={currencyCode} setCurrencyCode={handleCurrencyChange}>
      <div className="app-shell">
        <aside className="sidebar">
          <p className="sidebar-brand">
            <IndianRupee size={19} />
            Finance Manager
          </p>
          <p className="sidebar-user">{username ? `Signed in as ${username}` : ""}</p>
          <nav className="sidebar-nav">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={active === item.id ? "active" : ""}
                  onClick={() => setActive(item.id)}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={14} />
            Lock vault & log out
          </button>
        </aside>

        <main className="main-content">
          {active === "overview" && <OverviewSection username={username} onNavigate={setActive} />}
          {active === "income" && <IncomeSection />}
          {active === "expense" && <ExpenseSection />}
          {active === "budget" && <BudgetSection />}
          {active === "goals" && <GoalsSection />}
          {active === "recurring" && <RecurringSection />}
          {active === "search" && <SearchSection />}
          {active === "reports" && <ReportsSection creationYear={creationYear} />}
          {active === "export" && <ExportSection />}
          {active === "settings" && <SettingsSection onAccountDeleted={handleLogout} />}
        </main>
      </div>
    </CurrencyProvider>
  );
}
