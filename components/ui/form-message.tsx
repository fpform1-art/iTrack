export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <div
      className={`rounded-md px-3 py-2 text-sm ${
        error
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
      }`}
      role="status"
    >
      {error || success}
    </div>
  );
}
