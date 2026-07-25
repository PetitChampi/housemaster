import type { Calendar, CalendarEvent, CalendarView } from "@/pages/LivingRoom/calendarData";

// Pure date maths and text helpers for the Calendar tool
// Kept out of the component so they can be unit tested without a DOM
// NOTE: Everything in local time, no recurrence or timezone handling by design

export const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];
export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// 0 for Monday -> 6 for Sunday, shifting JS's Sunday-first getDay()
export const mondayIndex = (date: Date): number => (date.getDay() + 6) % 7;

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// Adds whole months, clamping the day to the target month's length (31 Jan + 1 month lands on 28/29 Feb)
export const addMonths = (date: Date, months: number): Date => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
};

export const addYears = (date: Date, years: number): Date => addMonths(date, years * 12);

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

// The Monday on or before the given date
export const startOfWeek = (date: Date): Date => addDays(startOfDay(date), -mondayIndex(date));

// The seven dates of the week containing the given date, Monday first
export const weekDays = (date: Date): Date[] => {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
};

// Monday-first grid (6 rows, 42 dates) -> given month + leading and trailing days that fill the weeks
export const buildMonthGrid = (year: number, monthIndex: number): Date[] => {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const gridStart = addDays(firstOfMonth, -mondayIndex(firstOfMonth));
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
};

// YYYY-MM-DD key from a date's local parts
export const dayKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const eventDayKey = (event: CalendarEvent): string => dayKey(new Date(event.start));

const pad2 = (n: number) => `${n}`.padStart(2, "0");

export const formatTime = (date: Date): string => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

export const formatEventTime = (event: CalendarEvent): string => {
  if (event.allDay) return "All day";
  const start = formatTime(new Date(event.start));
  const end = formatTime(new Date(event.end));
  return start === end ? start : `${start} — ${end}`;
};

export const formatFullDate = (date: Date): string =>
  `${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;

export const periodLabel = (view: CalendarView, date: Date): string => {
  if (view === "day") return formatFullDate(date);
  if (view === "year") return `${date.getFullYear()}`;
  if (view === "schedule") {
    const end = addYears(date, 1);
    return `${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()} — ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  }
  if (view === "week") {
    const days = weekDays(date);
    const first = days[0];
    const last = days[6];
    if (isSameMonth(first, last)) {
      return `${first.getDate()} — ${last.getDate()} ${MONTHS_LONG[first.getMonth()]} ${first.getFullYear()}`;
    }
    const firstPart = `${first.getDate()} ${MONTHS_SHORT[first.getMonth()]}`;
    const lastPart = `${last.getDate()} ${MONTHS_SHORT[last.getMonth()]}`;
    return `${firstPart} — ${lastPart} ${last.getFullYear()}`;
  }
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
};

// How far one press of a nav arrow moves the focus date, per view
export const shiftDate = (view: CalendarView, date: Date, direction: 1 | -1): Date => {
  switch (view) {
    case "day":
      return addDays(date, direction);
    case "week":
      return addDays(date, direction * 7);
    case "year":
      return addYears(date, direction);
    case "month":
    case "schedule":
      return addMonths(date, direction);
  }
};

export const visibleEvents = (events: CalendarEvent[], calendars: Calendar[]): CalendarEvent[] => {
  const shown = new Set(calendars.filter((c) => c.visible).map((c) => c.id));
  return events.filter((event) => shown.has(event.calendarId));
};

export const sortEvents = (a: CalendarEvent, b: CalendarEvent): number => {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  return a.start.localeCompare(b.start);
};

export const eventsForDay = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const key = dayKey(date);
  return events.filter((event) => eventDayKey(event) === key).sort(sortEvents);
};

export const minutesIntoDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();

export interface PositionedEvent {
  event: CalendarEvent;
  startMin: number;
  endMin: number;
  lane: number; // column index within an overlap cluster
  lanes: number; // total columns the cluster splits into
}

// Places events into lanes so overlapping events share the column width
// (events are grouped into clusters of mutual overlap)
export const layoutDayEvents = (dayEvents: CalendarEvent[]): PositionedEvent[] => {
  const timed = dayEvents
    .filter((event) => !event.allDay)
    .map((event) => {
      const startMin = minutesIntoDay(new Date(event.start));
      // 15 min floor so shorter events are tall enough to read
      const endMin = Math.max(minutesIntoDay(new Date(event.end)), startMin + 15);
      return { event, startMin, endMin, lane: 0 };
    })
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const positioned: PositionedEvent[] = [];
  let cluster: (Omit<PositionedEvent, "lanes">)[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = Math.max(...cluster.map((c) => c.lane)) + 1;
    for (const c of cluster) positioned.push({ ...c, lanes });
    cluster = [];
  };

  for (const item of timed) {
    if (item.startMin >= clusterEnd && cluster.length) flush();
    const taken = new Set(cluster.filter((c) => c.endMin > item.startMin).map((c) => c.lane));
    let lane = 0;
    while (taken.has(lane)) lane++;
    cluster.push({ ...item, lane });
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  if (cluster.length) flush();
  return positioned;
};

export interface LinkSegment {
  text: string;
  href?: string;
}

// Trailing sentence punctuation is stripped -> something like "(see https://x.org)." linkifies properly
const TRAILING = /[.,;:!?)\]}'"]+$/;
const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

// Splits notes into plain text and link segments to render URLs as hyperlinks
export const linkify = (text: string): LinkSegment[] => {
  const segments: LinkSegment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;
    const raw = match[0];
    const trailing = TRAILING.exec(raw)?.[0] ?? "";
    const url = raw.slice(0, raw.length - trailing.length);
    if (index > lastIndex) segments.push({ text: text.slice(lastIndex, index) });
    segments.push({ text: url, href: url.startsWith("www.") ? `https://${url}` : url });
    if (trailing) segments.push({ text: trailing });
    lastIndex = index + raw.length;
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex) });
  return segments;
};
