import { addExpense, deleteExpense, editExpense, listExpense, previewExpenseAlerts } from "../api";
import TransactionSection from "./TransactionSection";

export default function ExpenseSection() {
  return (
    <TransactionSection
      title="Expense"
      eyebrow="Money out"
      type="expense"
      list={listExpense}
      add={addExpense}
      edit={editExpense}
      remove={deleteExpense}
      extraBeforeSubmit={previewExpenseAlerts}
    />
  );
}
