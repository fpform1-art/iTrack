"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Bet, Profile } from "@/types/database";

interface AppDataContextValue {
  bets: Bet[];
  profile: Profile;
  isBetDrawerOpen: boolean;
  openBetDrawer: () => void;
  closeBetDrawer: () => void;
  refreshData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({
  bets,
  profile,
  children,
}: {
  bets: Bet[];
  profile: Profile;
  children: React.ReactNode;
}) {
  const [isBetDrawerOpen, setBetDrawerOpen] = useState(false);
  const router = useRouter();

  const openBetDrawer = useCallback(() => setBetDrawerOpen(true), []);
  const closeBetDrawer = useCallback(() => setBetDrawerOpen(false), []);
  const refreshData = useCallback(() => router.refresh(), [router]);

  const value = useMemo(
    () => ({ bets, profile, isBetDrawerOpen, openBetDrawer, closeBetDrawer, refreshData }),
    [bets, profile, isBetDrawerOpen, openBetDrawer, closeBetDrawer, refreshData]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
