import { describe, it, expect } from "vitest";
import {
  localDateKey,
  addDaysToDateKey,
  eventIsOnLocalDate,
  filterEventsByLocalDate,
  dayLabel,
  todayLocalDateKey,
} from "@/lib/odds/date-filter";

describe("localDateKey", () => {
  it("formats a Date as YYYY-MM-DD in local time, zero-padded", () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(localDateKey(new Date(2026, 11, 25))).toBe("2026-12-25");
  });
});

describe("addDaysToDateKey", () => {
  it("moves forward and backward by whole days", () => {
    expect(addDaysToDateKey("2026-07-15", 1)).toBe("2026-07-16");
    expect(addDaysToDateKey("2026-07-15", -1)).toBe("2026-07-14");
  });

  it("rolls over month boundaries", () => {
    expect(addDaysToDateKey("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDaysToDateKey("2026-08-01", -1)).toBe("2026-07-31");
  });

  it("rolls over year boundaries", () => {
    expect(addDaysToDateKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToDateKey("2027-01-01", -1)).toBe("2026-12-31");
  });
});

// These construct the commence_time via `new Date(y, m, d, h).toISOString()`
// (local wall-clock -> UTC) so the round trip through `eventIsOnLocalDate`
// (UTC -> local) is internally consistent regardless of which timezone the
// test runner itself is in — the point under test is the local-day
// boundary logic, not any specific timezone.
describe("eventIsOnLocalDate (timezone/date boundary handling)", () => {
  it("matches an event at local midnight on the selected day", () => {
    const dateKey = "2026-07-15";
    const commenceTime = new Date(2026, 6, 15, 0, 0, 0).toISOString();
    expect(eventIsOnLocalDate(commenceTime, dateKey)).toBe(true);
  });

  it("matches an event at 23:59:59 local on the selected day", () => {
    const dateKey = "2026-07-15";
    const commenceTime = new Date(2026, 6, 15, 23, 59, 59).toISOString();
    expect(eventIsOnLocalDate(commenceTime, dateKey)).toBe(true);
  });

  it("excludes an event one second before local midnight (previous day)", () => {
    const dateKey = "2026-07-15";
    const commenceTime = new Date(2026, 6, 14, 23, 59, 59).toISOString();
    expect(eventIsOnLocalDate(commenceTime, dateKey)).toBe(false);
  });

  it("excludes an event one second after local midnight (next day)", () => {
    const dateKey = "2026-07-15";
    const commenceTime = new Date(2026, 6, 16, 0, 0, 1).toISOString();
    expect(eventIsOnLocalDate(commenceTime, dateKey)).toBe(false);
  });

  it("matches a mid-afternoon local event on the selected day", () => {
    const dateKey = "2026-07-15";
    const commenceTime = new Date(2026, 6, 15, 15, 30, 0).toISOString();
    expect(eventIsOnLocalDate(commenceTime, dateKey)).toBe(true);
  });
});

describe("filterEventsByLocalDate", () => {
  it("keeps only events on the selected local day, filtering client-side", () => {
    const dateKey = "2026-07-15";
    const events = [
      { id: "a", commence_time: new Date(2026, 6, 15, 10, 0, 0).toISOString() },
      { id: "b", commence_time: new Date(2026, 6, 16, 10, 0, 0).toISOString() },
      { id: "c", commence_time: new Date(2026, 6, 15, 22, 0, 0).toISOString() },
      { id: "d", commence_time: new Date(2026, 6, 14, 10, 0, 0).toISOString() },
    ];
    const result = filterEventsByLocalDate(events, dateKey);
    expect(result.map((e) => e.id).sort()).toEqual(["a", "c"]);
  });

  it("returns an empty array when nothing matches (no games scheduled for this day)", () => {
    const events = [{ id: "a", commence_time: new Date(2026, 6, 20, 10, 0, 0).toISOString() }];
    expect(filterEventsByLocalDate(events, "2026-07-15")).toHaveLength(0);
  });
});

describe("dayLabel", () => {
  it("labels today, tomorrow, and yesterday relative to the current local date", () => {
    const today = todayLocalDateKey();
    expect(dayLabel(today)).toBe("Today");
    expect(dayLabel(addDaysToDateKey(today, 1))).toBe("Tomorrow");
    expect(dayLabel(addDaysToDateKey(today, -1))).toBe("Yesterday");
  });

  it("formats other days as a short weekday/month/day string", () => {
    const farFuture = addDaysToDateKey(todayLocalDateKey(), 30);
    const label = dayLabel(farFuture);
    expect(label).not.toBe("Today");
    expect(label).not.toBe("Tomorrow");
    expect(label.length).toBeGreaterThan(0);
  });
});
