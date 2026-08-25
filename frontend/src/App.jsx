import { useState } from "react";
import Dashboard from "./Dashboard";
import Login from "./Login";
import Register from "./Register";

export default function App() {
  const [page, setPage] = useState(localStorage.getItem("token") ? "dashboard" : "login");

  if (page === "register") {
    return <Register onNavigateLogin={() => setPage("login")} />;
  }

  if (page === "dashboard") {
    return <Dashboard onLoggedOut={() => setPage("login")} />;
  }

  return (
    <Login onNavigateRegister={() => setPage("register")} onLoggedIn={() => setPage("dashboard")} />
  );
}
