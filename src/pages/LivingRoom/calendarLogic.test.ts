import { describe, it, expect } from "vitest";
import {
  addDays,
  addMonths,
  addYears,
  buildMonthGrid,
  dayKey,
  eventsForDay,
  isSameDay,
  layoutDayEvents,
  linkify,
  minutesIntoDay,
  mondayIndex,
  periodLabel,
  shiftDate,
  sortEvents,
  startOfWeek,
  visibleEvents,
  weekDays,
} from "@/pages/LivingRoom/calendarLogic";
import type { Calendar, CalendarEvent } from "@/pages/LivingRoom/calendarData";

const event = (id: string, calendarId: string, start: string, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id,
  calendarId,
  title: id,
  allDay: false,
  start,
  end: start,
  notes: "",
  colour: null,
  ...extra,
});

describe("mondayIndex", () => {
  it("maps Monday to 0 and Sunday to 6", () => {
    expect(mondayIndex(new Date(2026, 6, 6))).toBe(0); // Mon 6 Jul 2026
    expect(mondayIndex(new Date(2026, 6, 12))).toBe(6); // Sun 12 Jul 2026
  });
});

describe("addMonths", () => {
  it("clamps the day to the shorter target month", () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
  });

  it("rolls across the year boundary", () => {
    expect(addMonths(new Date(2026, 11, 15), 1)).toEqual(new Date(2027, 0, 15));
    expect(addYears(new Date(2026, 6, 9), -1)).toEqual(new Date(2025, 6, 9));
  });
});

describe("startOfWeek", () => {
  it("returns the Monday on or before the date", () => {
    // Thu 9 Jul 2026 -> Mon 6 Jul 2026
    expect(startOfWeek(new Date(2026, 6, 9))).toEqual(new Date(2026, 6, 6));
  });

  it("leaves a Monday untouched", () => {
    expect(startOfWeek(new Date(2026, 6, 6))).toEqual(new Date(2026, 6, 6));
  });
});

describe("weekDays", () => {
  it("gives seven consecutive dates Monday first", () => {
    const days = weekDays(new Date(2026, 6, 9));
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual(new Date(2026, 6, 6));
    expect(days[6]).toEqual(new Date(2026, 6, 12));
  });
});

describe("buildMonthGrid", () => {
  const grid = buildMonthGrid(2026, 6); // July 2026

  it("is a full six-week grid", () => {
    expect(grid).toHaveLength(42);
  });

  it("starts on the Monday that leads into the month", () => {
    // 1 Jul 2026 is a Wednesday, so the grid opens on Mon 29 Jun.
    expect(grid[0]).toEqual(new Date(2026, 5, 29));
    expect(mondayIndex(grid[0])).toBe(0);
  });

  it("includes the first and last of the month", () => {
    expect(grid.some((d) => isSameDay(d, new Date(2026, 6, 1)))).toBe(true);
    expect(grid.some((d) => isSameDay(d, new Date(2026, 6, 31)))).toBe(true);
  });
});

describe("shiftDate", () => {
  const base = new Date(2026, 6, 9);
  it("moves by the unit that matches the view", () => {
    expect(shiftDate("day", base, 1)).toEqual(addDays(base, 1));
    expect(shiftDate("week", base, -1)).toEqual(addDays(base, -7));
    expect(shiftDate("month", base, 1)).toEqual(addMonths(base, 1));
    expect(shiftDate("year", base, 1)).toEqual(addYears(base, 1));
    expect(shiftDate("schedule", base, 1)).toEqual(addMonths(base, 1));
  });
});

describe("periodLabel", () => {
  const date = new Date(2026, 6, 9);
  it("labels each view the way its header should read", () => {
    expect(periodLabel("day", date)).toBe("9 July 2026");
    expect(periodLabel("month", date)).toBe("July 2026");
    expect(periodLabel("year", date)).toBe("2026");
    expect(periodLabel("week", date)).toBe("6 — 12 July 2026");
    expect(periodLabel("schedule", date)).toBe("Jul 2026 — Jul 2027");
  });

  it("spans months and years in the week label when the week straddles them", () => {
    // Week of Wed 31 Dec 2025 runs Mon 29 Dec 2025 to Sun 4 Jan 2026.
    expect(periodLabel("week", new Date(2025, 11, 31))).toBe("29 Dec — 4 Jan 2026");
  });
});

describe("visibleEvents", () => {
  const calendars: Calendar[] = [
    { id: "a", name: "A", colour: "blueberry", visible: true },
    { id: "b", name: "B", colour: "sage", visible: false },
  ];
  it("drops events whose calendar is toggled off", () => {
    const events = [event("1", "a", "2026-07-09T09:00:00"), event("2", "b", "2026-07-09T10:00:00")];
    expect(visibleEvents(events, calendars).map((e) => e.id)).toEqual(["1"]);
  });
});

describe("eventsForDay", () => {
  it("keeps only the given day and sorts all-day before timed", () => {
    const iso = (h: number) => new Date(2026, 6, 9, h).toISOString();
    const events = [
      event("timed-late", "a", iso(15)),
      event("allday", "a", iso(0), { allDay: true }),
      event("timed-early", "a", iso(9)),
      event("other-day", "a", new Date(2026, 6, 10, 9).toISOString()),
    ];
    expect(eventsForDay(events, new Date(2026, 6, 9)).map((e) => e.id)).toEqual([
      "allday",
      "timed-early",
      "timed-late",
    ]);
  });
});

describe("sortEvents", () => {
  it("orders all-day first then by start time", () => {
    const a = event("a", "c", "2026-07-09T12:00:00", { allDay: true });
    const b = event("b", "c", "2026-07-09T08:00:00");
    expect([b, a].sort(sortEvents).map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("minutesIntoDay", () => {
  it("counts minutes from local midnight", () => {
    expect(minutesIntoDay(new Date(2026, 6, 9, 9, 30))).toBe(570);
  });
});

describe("layoutDayEvents", () => {
  const at = (id: string, startH: number, endH: number): CalendarEvent =>
    event(id, "a", new Date(2026, 6, 9, startH).toISOString(), {
      end: new Date(2026, 6, 9, endH).toISOString(),
    });

  it("gives non-overlapping events a single full-width lane each", () => {
    const result = layoutDayEvents([at("morning", 9, 10), at("noon", 12, 13)]);
    expect(result.every((p) => p.lanes === 1 && p.lane === 0)).toBe(true);
  });

  it("splits two overlapping events into two lanes", () => {
    const result = layoutDayEvents([at("a", 9, 11), at("b", 10, 12)]);
    expect(result.map((p) => p.lane)).toEqual([0, 1]);
    expect(result.every((p) => p.lanes === 2)).toBe(true);
  });

  it("reuses a freed lane once an event ends and excludes all-day events", () => {
    const withAllDay = [at("a", 9, 10), at("b", 10, 11), { ...at("x", 0, 0), allDay: true }];
    const result = layoutDayEvents(withAllDay);
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.lanes === 1)).toBe(true);
  });
});

describe("dayKey", () => {
  it("formats local parts as YYYY-MM-DD", () => {
    expect(dayKey(new Date(2026, 6, 1))).toBe("2026-07-01");
  });
});

describe("linkify", () => {
  it("returns a single plain segment when there is no URL", () => {
    expect(linkify("just notes")).toEqual([{ text: "just notes" }]);
  });

  it("turns an http URL into a link segment", () => {
    expect(linkify("see https://example.org here")).toEqual([
      { text: "see " },
      { text: "https://example.org", href: "https://example.org" },
      { text: " here" },
    ]);
  });

  it("prefixes bare www links with https", () => {
    expect(linkify("www.example.org")).toEqual([
      { text: "www.example.org", href: "https://www.example.org" },
    ]);
  });

  it("keeps trailing sentence punctuation out of the href", () => {
    expect(linkify("(see https://example.org).")).toEqual([
      { text: "(see " },
      { text: "https://example.org", href: "https://example.org" },
      { text: ")." },
    ]);
  });

  it("linkifies more than one URL in the same note", () => {
    const result = linkify("a https://one.com b https://two.com");
    expect(result.filter((s) => s.href).map((s) => s.href)).toEqual(["https://one.com", "https://two.com"]);
  });
});
