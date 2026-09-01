"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { BetaBadge } from "@/components/ui/beta-badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useAppData } from "@/components/shell/app-data-context";

const NAV_ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/my-bets", label: "My Bets" },
  { href: "/grade", label: "Grade" },
  { href: "/performance", label: "Performance" },
];

export function DesktopNav() {
  const pathname = usePathname();
  const { openBetDrawer, profile } = useAppData();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-slate-200 bg-white/90 backdrop-blur sm:block dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link href="/home" className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
          iTraxc
          <BetaBadge />
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Button onClick={openBetDrawer} size="sm">
            + Bet
          </Button>
          <ThemeToggle />
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            title={profile.display_name || "Settings"}
          >
            {(profile.display_name || "U").slice(0, 1).toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  );
}
