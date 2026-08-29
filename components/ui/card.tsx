import clsx from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-red-600" : "text-slate-900";
  return (
    <Card className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={clsx("mt-1 truncate text-2xl font-semibold", toneClass)}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}
