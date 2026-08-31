"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { DailyPoint } from "@/lib/calc/performance";
import { formatCurrency } from "@/lib/format";
import type { Currency } from "@/types/database";

function shortDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Recharts takes literal color values (SVG attributes), not Tailwind
// classes, so `dark:` variants don't reach it — colors have to be picked
// explicitly per theme here instead.
const PALETTES = {
  light: {
    grid: "#e2e8f0",
    tick: "#64748b",
    line: "#0f172a",
    positive: "#059669",
    negative: "#dc2626",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e2e8f0",
    tooltipText: "#0f172a",
  },
  dark: {
    grid: "#334155",
    tick: "#94a3b8",
    line: "#e2e8f0",
    positive: "#34d399",
    negative: "#f87171",
    tooltipBg: "#1e293b",
    tooltipBorder: "#334155",
    tooltipText: "#f1f5f9",
  },
};

function useChartPalette() {
  const { resolvedTheme } = useTheme();
  // Deferred via microtask so this isn't a synchronous setState call
  // within the effect body itself.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setMounted(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return mounted && resolvedTheme === "dark" ? PALETTES.dark : PALETTES.light;
}

export function DailyNetBarChart({ data, currency }: { data: DailyPoint[]; currency: Currency }) {
  const palette = useChartPalette();
  if (data.length === 0) return <EmptyChart label="Daily Net Bars" />;
  return (
    <ChartCard title="Daily Net (Bars)">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: palette.tick }} />
          <YAxis tick={{ fontSize: 11, fill: palette.tick }} width={60} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), currency)}
            labelFormatter={(label) => shortDate(String(label))}
            contentStyle={{
              background: palette.tooltipBg,
              border: `1px solid ${palette.tooltipBorder}`,
              color: palette.tooltipText,
              fontSize: 12,
              borderRadius: 8,
            }}
            labelStyle={{ color: palette.tooltipText }}
          />
          <Bar dataKey="net" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.net >= 0 ? palette.positive : palette.negative} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DailyNetLineChart({ data, currency }: { data: DailyPoint[]; currency: Currency }) {
  const palette = useChartPalette();
  if (data.length === 0) return <EmptyChart label="Daily Net Line" />;
  return (
    <ChartCard title="Daily Net (Line)">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: palette.tick }} />
          <YAxis tick={{ fontSize: 11, fill: palette.tick }} width={60} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), currency)}
            labelFormatter={(label) => shortDate(String(label))}
            contentStyle={{
              background: palette.tooltipBg,
              border: `1px solid ${palette.tooltipBorder}`,
              color: palette.tooltipText,
              fontSize: 12,
              borderRadius: 8,
            }}
            labelStyle={{ color: palette.tooltipText }}
          />
          <Line type="monotone" dataKey="net" stroke={palette.line} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function BankrollChart({ data, currency }: { data: DailyPoint[]; currency: Currency }) {
  const palette = useChartPalette();
  if (data.length === 0) return <EmptyChart label="Bankroll" />;
  return (
    <ChartCard title="Bankroll Over Time">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="bankrollFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={palette.line} stopOpacity={0.15} />
              <stop offset="95%" stopColor={palette.line} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: palette.tick }} />
          <YAxis tick={{ fontSize: 11, fill: palette.tick }} width={60} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), currency)}
            labelFormatter={(label) => shortDate(String(label))}
            contentStyle={{
              background: palette.tooltipBg,
              border: `1px solid ${palette.tooltipBorder}`,
              color: palette.tooltipText,
              fontSize: 12,
              borderRadius: 8,
            }}
            labelStyle={{ color: palette.tooltipText }}
          />
          <Area type="monotone" dataKey="bankroll" stroke={palette.line} strokeWidth={2} fill="url(#bankrollFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500">No settled bets in this range yet.</p>
    </div>
  );
}
