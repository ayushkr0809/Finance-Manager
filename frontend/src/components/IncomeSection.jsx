import { addIncome, deleteIncome, editIncome, listIncome } from "../api";
import TransactionSection from "./TransactionSection";

export default function IncomeSection() {
  return (
    <TransactionSection
      title="Income"
      eyebrow="Money in"
      type="income"
      list={listIncome}
      add={addIncome}
      edit={editIncome}
      remove={deleteIncome}
    />
  );
}
