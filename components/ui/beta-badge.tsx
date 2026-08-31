import clsx from "clsx";

/** Small blue "BETA" pill shown beside the iTrack brand mark everywhere it appears. */
export function BetaBadge({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white dark:bg-blue-500",
        className
      )}
    >
      Beta
    </span>
  );
}
