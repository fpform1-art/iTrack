import clsx from "clsx";
import { getInitials, getColorForName } from "@/lib/logos/initials";

export function InitialsAvatar({
  name,
  size = 20,
  rounded = "full",
  className,
}: {
  name: string;
  size?: number;
  /** "full" for team badges (circular), "md" for a squarer league "shield" feel. */
  rounded?: "full" | "md";
  className?: string;
}) {
  const initials = getInitials(name);
  const background = getColorForName(name);

  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center justify-center font-semibold text-white",
        rounded === "full" ? "rounded-full" : "rounded-md",
        className
      )}
      style={{
        width: size,
        height: size,
        minWidth: size,
        background,
        fontSize: Math.max(8, Math.round(size * 0.42)),
        lineHeight: 1,
      }}
      title={name}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
