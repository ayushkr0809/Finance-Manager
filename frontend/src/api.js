const API_BASE = "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) return null;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    throw new Error((isJson && data.detail) || "Request failed");
  }
  return data;
}

// ---- Auth ----
export function registerUser(payload) {
  return request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export async function loginUser(payload) {
  const data = await request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
  localStorage.setItem("token", data.access_token);
  return data;
}

export function getCurrentUser() {
  return request("/me");
}

export function logout() {
  localStorage.removeItem("token");
}

export const updateCurrency = (currency) =>
  request("/auth/currency", { method: "PATCH", body: JSON.stringify({ currency }) });

export async function deleteAccount(payload) {
  await request("/auth/account", { method: "DELETE", body: JSON.stringify(payload) });
  logout();
}

// ---- Income ----
export const listIncome = () => request("/income");
export const addIncome = (data) => request("/income", { method: "POST", body: JSON.stringify(data) });
export const editIncome = (id, data) => request(`/income/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteIncome = (id) => request(`/income/${id}`, { method: "DELETE" });

// ---- Expense ----
export const listExpense = () => request("/expense");
export const previewExpenseAlerts = (data) =>
  request("/expense/preview-alerts", { method: "POST", body: JSON.stringify(data) });
export const addExpense = (data) => request("/expense", { method: "POST", body: JSON.stringify(data) });
export const editExpense = (id, data) => request(`/expense/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteExpense = (id) => request(`/expense/${id}`, { method: "DELETE" });

// ---- Budget ----
export const listBudgets = () => request("/budget");
export const setBudget = (data) => request("/budget", { method: "POST", body: JSON.stringify(data) });

// ---- Recurring ----
export const listRecurring = () => request("/recurring");
export const addRecurring = (data) => request("/recurring", { method: "POST", body: JSON.stringify(data) });
export const deleteRecurring = (id) => request(`/recurring/${id}`, { method: "DELETE" });
export const processRecurring = () => request("/recurring/process", { method: "POST" });

// ---- Search ----
export const searchByCategory = (q) => request(`/search/category?q=${encodeURIComponent(q)}`);
export const searchByDate = (date) => request(`/search/date?date=${encodeURIComponent(date)}`);
export const searchByAmount = (amount) => request(`/search/amount?amount=${encodeURIComponent(amount)}`);

// ---- Reports ----
export const getBalance = () => request("/reports/balance");
export const getExpenseByCategory = () => request("/reports/expense-by-category");
export const getMonthlyTrend = () => request("/reports/monthly-trend");
export const getDailyExpense = () => request("/reports/daily-expense");
export const getMonthlySummary = (year, month) => request(`/reports/monthly?year=${year}&month=${month}`);
export const getYearlySummary = (year) => request(`/reports/yearly?year=${year}`);
export const getBalanceTrend = (days = 90) => request(`/reports/balance-trend?days=${days}`);

// ---- Goals ----
export const listGoals = () => request("/goals");
export const addGoal = (data) => request("/goals", { method: "POST", body: JSON.stringify(data) });
export const contributeToGoal = (id, data) =>
  request(`/goals/${id}/contribute`, { method: "POST", body: JSON.stringify(data) });
export const deleteGoal = (id) => request(`/goals/${id}`, { method: "DELETE" });

// ---- Import ----
export async function importCsv(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/import/csv`, {
    method: "POST",
    headers: { ...authHeaders() }, // no Content-Type — browser sets the multipart boundary
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Import failed");
  return data;
}

// ---- Export (these trigger a real file download) ----
export async function downloadExport(path, filename) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
