import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold text-slate-900">iTrack</span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link href="/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          iTrack
        </h1>
        <p className="mt-3 text-lg text-slate-500">Betting Performance Tracker</p>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-slate-500">
          A personal, private way to log your bets, track results, and see your real
          bankroll, ROI, and performance trends over time. Not a sportsbook, not a
          picks service — just your own records, organized.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/signup">
            <Button size="lg">Get started</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Log in
            </Button>
          </Link>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-6 text-center text-xs text-slate-400">
        iTrack is a personal analytics tool. It does not accept wagers or place bets.
      </footer>
    </div>
  );
}
