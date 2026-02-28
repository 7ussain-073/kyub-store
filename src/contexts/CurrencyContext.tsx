import React, { createContext, useContext, useState } from "react";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // rate relative to SAR (1 SAR = X currency)
}

const currencies: Currency[] = [
  { code: "USD", symbol: "$", name: "دولار أمريكي", rate: 0.267 },
  { code: "SAR", symbol: "ر.س", name: "ريال سعودي", rate: 1 },
  { code: "IQD", symbol: "ع.د", name: "دينار عراقي", rate: 351 },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrencyCode: (code: string) => void;
  convert: (amountInSAR: number) => number;
  formatPrice: (amountInSAR: number) => string;
  currencies: Currency[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState(() => {
    return (localStorage.getItem("currency") as string) || "USD"; // default main currency = USD
  });

  const currency = currencies.find(c => c.code === currencyCode) || currencies[0];

  const handleSetCurrency = (code: string) => {
    setCurrencyCode(code);
    localStorage.setItem("currency", code);
  };

  const convert = (amountInSAR: number) => {
    return Math.round(amountInSAR * currency.rate * 100) / 100;
  };

  const formatPrice = (amountInSAR: number) => {
    const converted = convert(amountInSAR);
    return `${converted} ${currency.symbol}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrencyCode: handleSetCurrency, convert, formatPrice, currencies }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
}
