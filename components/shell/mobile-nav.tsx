"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAppData } from "@/components/shell/app-data-context";
import { BetaBadge } from "@/components/ui/beta-badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const NAV_ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/my-bets", label: "Bets" },
  { href: "/grade", label: "Grade" },
  { href: "/performance", label: "Stats" },
];

export function MobileTopBar() {
  const { profile } = useAppData();
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:hidden dark:border-slate-800 dark:bg-slate-950/90">
      <Link href="/home" className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
        iTraxc
        <BetaBadge />
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="/settings"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          {(profile.display_name || "U").slice(0, 1).toUpperCase()}
        </Link>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openBetDrawer } = useAppData();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white sm:hidden dark:border-slate-800 dark:bg-slate-950">
      {NAV_ITEMS.slice(0, 2).map((item) => (
        <NavLink key={item.href} href={item.href} label={item.label} active={pathname.startsWith(item.href)} />
      ))}

      <button
        onClick={openBetDrawer}
        className="flex flex-col items-center justify-center gap-0.5 py-2 text-slate-900 dark:text-slate-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-lg font-medium text-white dark:bg-slate-100 dark:text-slate-900">
          +
        </span>
        <span className="text-[10px] font-medium">Bet</span>
      </button>

      {NAV_ITEMS.slice(2).map((item) => (
        <NavLink key={item.href} href={item.href} label={item.label} active={pathname.startsWith(item.href)} />
      ))}
    </nav>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
        active ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
      )}
    >
      <span>{label}</span>
    </Link>
  );
}
