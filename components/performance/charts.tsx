"use client";

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

export function DailyNetBarChart({ data, currency }: { data: DailyPoint[]; currency: Currency }) {
  if (data.length === 0) return <EmptyChart label="Daily Net Bars" />;
  return (
    <ChartCard title="Daily Net (Bars)">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={60} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), currency)}
            labelFormatter={(label) => shortDate(String(label))}
          />
          <Bar dataKey="net" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.net >= 0 ? "#059669" : "#dc2626"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DailyNetLineChart({ data, currency }: { data: DailyPoint[]; currency: Currency }) {
  if (data.length === 0) return <EmptyChart label="Daily Net Line" />;
  return (
    <ChartCard title="Daily Net (Line)">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={60} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), currency)}
            labelFormatter={(label) => shortDate(String(label))}
          />
          <Line type="monotone" dataKey="net" stroke="#0f172a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function BankrollChart({ data, currency }: { data: DailyPoint[]; currency: Currency }) {
  if (data.length === 0) return <EmptyChart label="Bankroll" />;
  return (
    <ChartCard title="Bankroll Over Time">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="bankrollFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={60} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), currency)}
            labelFormatter={(label) => shortDate(String(label))}
          />
          <Area type="monotone" dataKey="bankroll" stroke="#0f172a" strokeWidth={2} fill="url(#bankrollFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{label}</h3>
      <p className="text-sm text-slate-400">No settled bets in this range yet.</p>
    </div>
  );
}
