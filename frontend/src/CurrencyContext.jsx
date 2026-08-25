import { createContext, useContext, useMemo } from "react";
import { CURRENCIES } from "./constants";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ currencyCode, setCurrencyCode, children }) {
  const value = useMemo(() => {
    const meta = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
    const formatter = new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      minimumFractionDigits: 2,
    });

    return {
      currencyCode,
      setCurrencyCode,
      formatMoney: (value) => {
        const n = typeof value === "string" ? parseFloat(value) : value;
        return formatter.format(Number.isNaN(n) ? 0 : n);
      },
    };
  }, [currencyCode, setCurrencyCode]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
