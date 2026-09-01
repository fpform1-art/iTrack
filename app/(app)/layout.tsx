import { redirect } from "next/navigation";
import { getCurrentUser, getProfile, getAllBets } from "@/lib/data/bets";
import { AppDataProvider } from "@/components/shell/app-data-context";
import { DesktopNav } from "@/components/shell/desktop-nav";
import { MobileTopBar, MobileBottomNav } from "@/components/shell/mobile-nav";
import { BetEntryDrawer } from "@/components/bet-entry/bet-entry-drawer";
import { ThemedToaster } from "@/components/theme/themed-toaster";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, bets] = await Promise.all([getProfile(), getAllBets()]);

  if (!profile) {
    // Profile row is created by a DB trigger on signup; if it's somehow
    // missing, fail safe rather than crash the whole app shell.
    redirect("/login?error=profile_missing");
  }

  return (
    <AppDataProvider bets={bets} profile={profile}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <DesktopNav />
        <MobileTopBar />
        <main className="mx-auto max-w-6xl px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-8 sm:pt-6">{children}</main>
        <MobileBottomNav />
        <BetEntryDrawer />
        <ThemedToaster />
      </div>
    </AppDataProvider>
  );
}
