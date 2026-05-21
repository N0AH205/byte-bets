"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BalanceContextType {
  balance: number;
  debit: (amount: number) => boolean; // returns false if insufficient
  credit: (amount: number) => void;
  setBalance: (amount: number) => void;
}

const BalanceContext = createContext<BalanceContextType | null>(null);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalanceState] = useState<number>(10_000);

  const debit = (amount: number): boolean => {
    if (amount <= 0 || amount > balance) return false;
    setBalanceState((prev) => Math.round((prev - amount) * 100) / 100);
    return true;
  };

  const credit = (amount: number) => {
    setBalanceState((prev) => Math.round((prev + amount) * 100) / 100);
  };

  const setBalance = (amount: number) => {
    setBalanceState(Math.round(amount * 100) / 100);
  };

  return (
    <BalanceContext.Provider value={{ balance, debit, credit, setBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance(): BalanceContextType {
  const ctx = useContext(BalanceContext);
  if (!ctx) throw new Error("useBalance must be used within BalanceProvider");
  return ctx;
}
