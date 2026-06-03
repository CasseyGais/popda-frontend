import React, { createContext, useContext, useState, ReactNode } from "react";

interface Period {
  id: number;
  name: string;
  tahun: string;
  status: string;
}

interface PeriodContextType {
  currentPeriod: Period | null;
  setCurrentPeriod: (period: Period | null) => void;
  periods: Period[];
  setPeriods: (periods: Period[]) => void;
  refreshCurrentPeriod: () => Promise<void>;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const PeriodProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);

  const refreshCurrentPeriod = async () => {
    // Placeholder implementation - can be enhanced to fetch from API
    // For now, this is a no-op as the period data is managed externally
    return Promise.resolve();
  };

  return (
    <PeriodContext.Provider value={{ currentPeriod, setCurrentPeriod, periods, setPeriods, refreshCurrentPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
};

export const usePeriod = () => {
  const context = useContext(PeriodContext);
  if (context === undefined) {
    throw new Error("usePeriod must be used within a PeriodProvider");
  }
  return context;
};
