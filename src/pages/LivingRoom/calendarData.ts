// Types + seed + localStorage persistence for the Calendar tool

export type CalendarView = "day" | "week" | "month" | "year" | "schedule";

export type SwatchId =
  | "blueberry"
  | "sage"
  | "tangerine"
  | "grape"
  | "flamingo"
  | "peacock"
  | "banana"
  | "tomato"
  | "graphite"
  | "basil";

export interface Swatch {
  id: SwatchId;
  name: string;
}

export const SWATCHES: Swatch[] = [
  { id: "blueberry", name: "Blueberry" },
  { id: "sage", name: "Sage" },
  { id: "tangerine", name: "Tangerine" },
  { id: "grape", name: "Grape" },
  { id: "flamingo", name: "Flamingo" },
  { id: "peacock", name: "Peacock" },
  { id: "banana", name: "Banana" },
  { id: "tomato", name: "Tomato" },
  { id: "graphite", name: "Graphite" },
  { id: "basil", name: "Basil" },
];

export const MAX_CALENDARS = SWATCHES.length;

export interface Calendar {
  id: string;
  name: string;
  colour: SwatchId;
  visible: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  allDay: boolean;
  start: string; // ISO
  end: string; // ISO (timed event = defaults to start + 1h)
  notes: string;
  // future per-event colour override, unused for now
  colour: SwatchId | null;
}

export interface CalendarState {
  calendars: Calendar[];
  events: CalendarEvent[];
}

export const DEFAULT_EVENT_MINUTES = 60;

const iso = (year: number, monthIndex: number, day: number, hours = 0, minutes = 0) =>
  new Date(year, monthIndex, day, hours, minutes).toISOString();

export const makeInitialData = (): CalendarState => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const general = "cal-general";
  return {
    calendars: [{ id: general, name: "General", colour: "tomato", visible: true }],
    events: [
      {
        id: "seed-1",
        calendarId: general,
        title: "House meeting",
        allDay: false,
        start: iso(y, m, d, 18, 0),
        end: iso(y, m, d, 19, 0),
        notes: "Agenda: chores rota, bills, weekend plans.",
        colour: null,
      },
      {
        id: "seed-2",
        calendarId: general,
        title: "Bin day",
        allDay: true,
        start: iso(y, m, d + 2),
        end: iso(y, m, d + 2),
        notes: "Recycling this week.",
        colour: null,
      },
    ],
  };
};

const STORAGE_KEY = "housemaster-calendar";

export const loadCalendar = (): CalendarState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeInitialData();
    const parsed = JSON.parse(raw) as Partial<CalendarState>;
    if (!Array.isArray(parsed.calendars) || !Array.isArray(parsed.events)) return makeInitialData();
    return { calendars: parsed.calendars, events: parsed.events };
  } catch {
    return makeInitialData(); // Corrupt / unavailable storage = fallback to seed
  }
};

export const saveCalendar = (state: CalendarState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn("Failed to save calendar to localStorage. Changes will not persist.");
  }
};
