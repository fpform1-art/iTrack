/**
 * Local-timezone date helpers for filtering listed fixtures by calendar
 * day. Fixture events carry `commence_time` as a UTC ISO string; users
 * think in terms of their own local day, so all comparisons here resolve
 * through the browser's local timezone (via the Date object's local
 * getters), not UTC.
 */

/** "YYYY-MM-DD" for a Date, in the LOCAL timezone (not toISOString's UTC). */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayLocalDateKey(): string {
  return localDateKey(new Date());
}

/** Shifts a "YYYY-MM-DD" key by `delta` local calendar days (handles month/year rollover). */
export function addDaysToDateKey(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return localDateKey(date);
}

/** True if a UTC ISO commence_time falls on the same LOCAL calendar day as dateKey. */
export function eventIsOnLocalDate(commenceTimeIso: string, dateKey: string): boolean {
  return localDateKey(new Date(commenceTimeIso)) === dateKey;
}

/** Client-side filter — never triggers a new fetch, just narrows already-cached events. */
export function filterEventsByLocalDate<T extends { commence_time: string }>(
  events: T[],
  dateKey: string
): T[] {
  return events.filter((ev) => eventIsOnLocalDate(ev.commence_time, dateKey));
}

/** Friendly label for the day selector: "Today", "Tomorrow", "Yesterday", or a formatted date. */
export function dayLabel(dateKey: string): string {
  const today = todayLocalDateKey();
  if (dateKey === today) return "Today";
  if (dateKey === addDaysToDateKey(today, 1)) return "Tomorrow";
  if (dateKey === addDaysToDateKey(today, -1)) return "Yesterday";

  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
