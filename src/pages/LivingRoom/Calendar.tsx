import { useEffect, useMemo, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconPlus,
  IconCalendarPlus,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import { useCurrentUser } from "@/store/authStore";
import { useExitTransition } from "@/lib/useExitTransition";
import {
  CalendarFormModal,
  EventDetailModal,
  EventFormModal,
  type EventDraft,
} from "@/pages/LivingRoom/CalendarModals";
import {
  DEFAULT_EVENT_MINUTES,
  MAX_CALENDARS,
  loadCalendar,
  saveCalendar,
  type CalendarEvent,
  type CalendarState,
  type CalendarView,
  type SwatchId,
} from "@/pages/LivingRoom/calendarData";
import {
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  WEEKDAY_INITIALS,
  addDays,
  addMonths,
  buildMonthGrid,
  dayKey,
  eventsForDay,
  formatEventTime,
  formatFullDate,
  formatTime,
  isSameDay,
  isSameMonth,
  layoutDayEvents,
  minutesIntoDay,
  mondayIndex,
  periodLabel,
  shiftDate,
  visibleEvents,
  weekDays,
} from "@/pages/LivingRoom/calendarLogic";
import "@/styles/tools/Calendar.css";

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "schedule", label: "Schedule" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48; // px per hour in the day/week time grid

type ActiveModal =
  | { kind: "detail"; id: string }
  | { kind: "event-form"; draft: EventDraft }
  | { kind: "calendar-form" };

const pad2 = (n: number) => `${n}`.padStart(2, "0");
const toDateInput = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const toTimeInput = (date: Date) => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

// Fresh event draft defaulting to 1h block at given day and hour
const blankDraft = (date: Date, calendarId: string, hour = 9): EventDraft => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0);
  const end = new Date(start.getTime() + DEFAULT_EVENT_MINUTES * 60000);
  return {
    id: null,
    calendarId,
    title: "",
    allDay: false,
    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    notes: "",
  };
};

const toDraft = (event: CalendarEvent): EventDraft => {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return {
    id: event.id,
    calendarId: event.calendarId,
    title: event.title,
    allDay: event.allDay,
    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    notes: event.notes,
  };
};

// Turns raw date/time input strings into CalendarEvent with ISO timestamps
const draftToEvent = (draft: EventDraft): CalendarEvent => {
  const [y, m, d] = draft.date.split("-").map(Number);
  if (draft.allDay) {
    const midnight = new Date(y, m - 1, d).toISOString();
    return baseEvent(draft, midnight, midnight);
  }
  const [sh, sm] = draft.startTime.split(":").map(Number);
  const start = new Date(y, m - 1, d, sh, sm);
  const [eh, em] = draft.endTime.split(":").map(Number);
  let end = new Date(y, m - 1, d, eh, em);
  if (end.getTime() <= start.getTime()) end = new Date(start.getTime() + DEFAULT_EVENT_MINUTES * 60000);
  return baseEvent(draft, start.toISOString(), end.toISOString());
};

const baseEvent = (draft: EventDraft, start: string, end: string): CalendarEvent => ({
  id: draft.id ?? crypto.randomUUID(),
  calendarId: draft.calendarId,
  title: draft.title.trim(),
  allDay: draft.allDay,
  start,
  end,
  notes: draft.notes,
  colour: null,
});

const Calendar = () => {
  const user = useCurrentUser();
  const [state, setState] = useState<CalendarState>(loadCalendar);
  const [view, setView] = useState<CalendarView>("month");
  const [focus, setFocus] = useState<Date>(() => new Date());
  const [miniMonthDate, setMiniMonthDate] = useState<Date>(() => new Date());
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modal, setModal] = useState<ActiveModal | null>(null);

  const { rendered: activeModal, isClosing, onClosed } = useExitTransition(modal);

  useEffect(() => saveCalendar(state), [state]);

  useEffect(() => {
    if (!viewMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      // We use class here instead of ref since the picker is rendered in 2 places
      if (!(event.target as Element).closest(".cal-viewpicker")) setViewMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [viewMenuOpen]);

  const defaultCalendarId = state.calendars[0]?.id ?? "";
  const shown = useMemo(() => visibleEvents(state.events, state.calendars), [state]);
  // The set of days that carry an event, so the mini-month dot is an O(1) lookup rather than a per-cell scan
  // (the year view alone renders 12 × 42 cells)
  const eventDayKeys = useMemo(() => new Set(shown.map((e) => dayKey(new Date(e.start)))), [shown]);
  const calendarById = useMemo(
    () => Object.fromEntries(state.calendars.map((c) => [c.id, c])),
    [state.calendars]
  );
  const colourOf = (event: CalendarEvent): SwatchId => calendarById[event.calendarId]?.colour ?? "graphite";

  const goToday = () => {
    const today = new Date();
    setFocus(today);
    setMiniMonthDate(today);
  };
  const step = (direction: 1 | -1) => setFocus((date) => shiftDate(view, date, direction));

  const pickDay = (date: Date, nextView: CalendarView = "day") => {
    setFocus(date);
    setView(nextView);
  };

  const openCreate = (date: Date, hour?: number) =>
    setModal({ kind: "event-form", draft: blankDraft(date, defaultCalendarId, hour) });
  const openDetail = (id: string) => setModal({ kind: "detail", id });
  const openEdit = (event: CalendarEvent) => setModal({ kind: "event-form", draft: toDraft(event) });

  const saveEvent = (draft: EventDraft) => {
    const event = draftToEvent(draft);
    setState((prev) => {
      const exists = prev.events.some((e) => e.id === event.id);
      return {
        ...prev,
        events: exists ? prev.events.map((e) => (e.id === event.id ? event : e)) : [...prev.events, event],
      };
    });
    setModal(null);
  };

  const deleteEvent = (id: string) => {
    setState((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }));
    setModal(null);
  };

  const toggleCalendar = (id: string) =>
    setState((prev) => ({
      ...prev,
      calendars: prev.calendars.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)),
    }));

  const createCalendar = (name: string, colour: SwatchId) => {
    setState((prev) => ({
      ...prev,
      calendars: [...prev.calendars, { id: crypto.randomUUID(), name, colour, visible: true }],
    }));
    setModal(null);
  };

  // View picker + profile pill
  const viewPicker = () => (
    <div className="cal-viewpicker">
      <button className="cal-view-btn" onClick={() => setViewMenuOpen((open) => !open)}>
        {VIEWS.find((v) => v.id === view)?.label}
        <IconChevronDown size={18} stroke={1.5} />
      </button>
      {viewMenuOpen && (
        <div className="cal-view-menu">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              className={`cal-view-option${view === option.id ? " is-active" : ""}`}
              onClick={() => {
                setView(option.id);
                setViewMenuOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const profilePill = () => (
    <div className="cal-profile">
      <span className="cal-profile-avatar">{user && <img src={user.avatarUrl} alt="" />}</span>
      <span className="cal-profile-name">{user?.name ?? "Your"}&rsquo;s calendar</span>
    </div>
  );

  // Compact month used by the sidebar browser and the year view
  const miniMonth = (monthDate: Date, onPick: (date: Date) => void) => {
    const grid = buildMonthGrid(monthDate.getFullYear(), monthDate.getMonth());
    const today = new Date();
    return (
      <div className="cal-mini">
        <div className="cal-mini-weekdays">
          {WEEKDAY_INITIALS.map((day, i) => (
            <span key={i}>{day}</span>
          ))}
        </div>
        <div className="cal-mini-grid">
          {grid.map((date) => {
            const inMonth = isSameMonth(date, monthDate);
            const classes = [
              "cal-mini-day",
              !inMonth && "is-outside",
              isSameDay(date, today) && "is-today",
              isSameDay(date, focus) && "is-focus",
              eventDayKeys.has(dayKey(date)) && "has-events",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button key={date.toISOString()} className={classes} onClick={() => onPick(date)}>
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const eventChip = (event: CalendarEvent) => (
    <button
      key={event.id}
      className={`cal-chip swatch-${colourOf(event)}${event.allDay ? " is-allday" : ""}`}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        openDetail(event.id);
      }}
    >
      {!event.allDay && <span className="cal-chip-time">{formatTime(new Date(event.start))}</span>}
      <span className="cal-chip-title">{event.title}</span>
    </button>
  );

  const renderMonth = () => {
    const grid = buildMonthGrid(focus.getFullYear(), focus.getMonth());
    const today = new Date();
    return (
      <div className="cal-month">
        <div className="cal-month-weekdays">
          {WEEKDAYS_SHORT.map((day, i) => (
            <span key={day}>
              <span className="cal-wd-long">{day}</span>
              <span className="cal-wd-short">{WEEKDAY_INITIALS[i]}</span>
            </span>
          ))}
        </div>
        <div className="cal-month-grid">
          {grid.map((date) => {
            const dayEvents = eventsForDay(shown, date);
            const classes = [
              "cal-month-cell",
              !isSameMonth(date, focus) && "is-outside",
              isSameDay(date, today) && "is-today",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div key={date.toISOString()} className={classes} onClick={() => openCreate(date)}>
                <button
                  className="cal-month-daynum"
                  onClick={(e) => {
                    e.stopPropagation();
                    pickDay(date);
                  }}
                >
                  {date.getDate()}
                </button>
                <div className="cal-month-events">
                  {dayEvents.slice(0, 3).map((event) => eventChip(event))}
                  {dayEvents.length > 3 && (
                    <button
                      className="cal-more"
                      onClick={(e) => {
                        e.stopPropagation();
                        pickDay(date);
                      }}
                    >
                      +{dayEvents.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimeGrid = (days: Date[]) => {
    const today = new Date();
    const nowMinutes = minutesIntoDay(today);
    const hasAllDay = days.some((day) => eventsForDay(shown, day).some((e) => e.allDay));
    return (
      <div className="cal-timegrid">
        {days.length > 1 && (
          <div className="cal-timegrid-head">
            <span className="cal-gutter-spacer" />
            {days.map((day) => (
              <button
                key={day.toISOString()}
                className={`cal-col-head${isSameDay(day, today) ? " is-today" : ""}`}
                onClick={() => pickDay(day)}
              >
                <span className="cal-col-weekday">
                  <span className="cal-wd-long">{WEEKDAYS_SHORT[mondayIndex(day)]}</span>
                  <span className="cal-wd-short">{WEEKDAY_INITIALS[mondayIndex(day)]}</span>
                </span>
                <span className="cal-col-daynum">{day.getDate()}</span>
              </button>
            ))}
          </div>
        )}

        {hasAllDay && (
          <div className="cal-allday-row">
            <span className="cal-gutter-spacer">All day</span>
            {days.map((day) => (
              <div key={day.toISOString()} className="cal-allday-cell">
                {eventsForDay(shown, day)
                  .filter((e) => e.allDay)
                  .map((event) => eventChip(event))}
              </div>
            ))}
          </div>
        )}

        <div className="cal-timegrid-body">
          <div className="cal-gutter">
            {HOURS.map((hour) => (
              <div key={hour} className="cal-gutter-hour" style={{ height: HOUR_HEIGHT }}>
                <span>{hour > 0 ? `${pad2(hour)}:00` : ""}</span>
              </div>
            ))}
          </div>
          {days.map((day) => {
            const positioned = layoutDayEvents(eventsForDay(shown, day));
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className="cal-day-col"
                style={{ height: HOUR_HEIGHT * 24 }}
                onClick={(e) => {
                  const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                  openCreate(day, Math.floor(y / HOUR_HEIGHT));
                }}
              >
                {HOURS.map((hour) => (
                  <div key={hour} className="cal-hour-line" style={{ top: hour * HOUR_HEIGHT }} />
                ))}
                {positioned.map(({ event, startMin, endMin, lane, lanes }) => (
                  <button
                    key={event.id}
                    className={`cal-event swatch-${colourOf(event)}`}
                    style={{
                      top: (startMin / 60) * HOUR_HEIGHT,
                      height: ((endMin - startMin) / 60) * HOUR_HEIGHT,
                      left: `${(lane / lanes) * 100}%`,
                      width: `${(1 / lanes) * 100}%`,
                    }}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      openDetail(event.id);
                    }}
                  >
                    <span className="cal-event-title">{event.title}</span>
                    <span className="cal-event-time">{formatEventTime(event)}</span>
                  </button>
                ))}
                {isToday && (
                  <div className="cal-now" style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYear = () => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(focus.getFullYear(), i, 1));
    return (
      <div className="cal-year">
        {months.map((monthDate) => (
          <div key={monthDate.getMonth()} className="cal-year-month">
            <button
              className="cal-year-title"
              onClick={() => {
                setFocus(monthDate);
                setView("month");
              }}
            >
              {MONTHS_LONG[monthDate.getMonth()]}
            </button>
            {miniMonth(monthDate, (date) => pickDay(date))}
          </div>
        ))}
      </div>
    );
  };

  const renderSchedule = () => {
    const from = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate());
    const until = addDays(addMonths(from, 12), -1);
    const upcoming = shown
      .filter((event) => {
        const day = new Date(event.start);
        return day >= from && day <= addDays(until, 1);
      })
      .sort((a, b) => a.start.localeCompare(b.start));

    const groups: { key: string; date: Date; events: CalendarEvent[] }[] = [];
    for (const event of upcoming) {
      const date = new Date(event.start);
      const key = toDateInput(date);
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.events.push(event);
      else groups.push({ key, date, events: [event] });
    }

    return (
      <div className="cal-schedule">
        {groups.length === 0 && <p className="cal-empty">No events in the next year.</p>}
        {groups.map((group) => (
          <div key={group.key} className="cal-schedule-day">
            <div className="cal-schedule-date">
              <span className="cal-schedule-dow">{WEEKDAYS_SHORT[mondayIndex(group.date)]}</span>
              <span className="cal-schedule-num">{group.date.getDate()}</span>
              <span className="cal-schedule-mon">{MONTHS_LONG[group.date.getMonth()]}</span>
            </div>
            <div className="cal-schedule-events">
              {group.events.map((event) => (
                <button key={event.id} className="cal-schedule-event" onClick={() => openDetail(event.id)}>
                  <span className={`cal-dot swatch-${colourOf(event)}`} aria-hidden="true" />
                  <span className="cal-schedule-time">{formatEventTime(event)}</span>
                  <span className="cal-schedule-title">{event.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {groups.length > 0 && (
          <p className="cal-schedule-foot">Showing events until {formatFullDate(until)}.</p>
        )}
      </div>
    );
  };

  const renderView = () => {
    switch (view) {
      case "day":
        return renderTimeGrid([focus]);
      case "week":
        return renderTimeGrid(weekDays(focus));
      case "year":
        return renderYear();
      case "schedule":
        return renderSchedule();
      case "month":
        return renderMonth();
    }
  };

  const detailEvent =
    activeModal?.kind === "detail" ? state.events.find((e) => e.id === activeModal.id) : undefined;

  return (
    <div className="calendar-tool">
      <header className="cal-topbar">
        <div className="cal-topbar-nav">
          <button className="cal-today" onClick={goToday}>
            Today
          </button>
          <div className="cal-arrows">
            <button className="cal-icon-btn" aria-label="Previous" onClick={() => step(-1)}>
              <IconChevronLeft size={20} stroke={1.5} />
            </button>
            <button className="cal-icon-btn" aria-label="Next" onClick={() => step(1)}>
              <IconChevronRight size={20} stroke={1.5} />
            </button>
          </div>
          <h1 className="cal-period">{periodLabel(view, focus)}</h1>
        </div>

        <div className="cal-topbar-end">
          {viewPicker()}
          {profilePill()}

          <button
            className="cal-drawer-toggle cal-icon-btn"
            aria-label="Open calendars menu"
            onClick={() => setDrawerOpen(true)}
          >
            <IconMenu2 size={20} stroke={1.5} />
          </button>
        </div>
      </header>

      <div className="cal-body">
        <main className="cal-main">{renderView()}</main>

        <div
          className={`cal-scrim${drawerOpen ? " is-open" : ""}`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />

        <aside className={`cal-sidebar${drawerOpen ? " is-open" : ""}`}>
          <div className="cal-drawer-head">
            {profilePill()}
            <button
              className="cal-drawer-close cal-icon-btn"
              aria-label="Close calendars menu"
              onClick={() => setDrawerOpen(false)}
            >
              <IconX size={20} stroke={1.5} />
            </button>
          </div>

          {viewPicker()}

          <div className="cal-mini-browser">
            <div className="cal-mini-head">
              <span className="cal-mini-label">
                {MONTHS_LONG[miniMonthDate.getMonth()]} {miniMonthDate.getFullYear()}
              </span>
              <div className="cal-arrows">
                <button
                  className="cal-icon-btn"
                  aria-label="Previous month"
                  onClick={() => setMiniMonthDate((date) => addMonths(date, -1))}
                >
                  <IconChevronLeft size={18} stroke={1.5} />
                </button>
                <button
                  className="cal-icon-btn"
                  aria-label="Next month"
                  onClick={() => setMiniMonthDate((date) => addMonths(date, 1))}
                >
                  <IconChevronRight size={18} stroke={1.5} />
                </button>
              </div>
            </div>
            {miniMonth(miniMonthDate, (date) => {
              setFocus(date);
              setMiniMonthDate(date);
            })}
          </div>

          <div className="cal-calendars">
            <div className="cal-calendars-head">
              <span className="cal-calendars-title">Calendars</span>
              <button
                className="cal-icon-btn"
                aria-label="New calendar"
                data-tooltip={state.calendars.length >= MAX_CALENDARS ? "Calendar limit reached" : "New calendar"}
                data-tooltip-dir="left"
                disabled={state.calendars.length >= MAX_CALENDARS}
                onClick={() => setModal({ kind: "calendar-form" })}
              >
                <IconCalendarPlus size={18} stroke={1.5} />
              </button>
            </div>
            <ul className="cal-calendars-list">
              {state.calendars.map((calendar) => (
                <li key={calendar.id}>
                  <label className={`cal-calendar-item swatch-${calendar.colour}`}>
                    <input
                      type="checkbox"
                      checked={calendar.visible}
                      onChange={() => toggleCalendar(calendar.id)}
                    />
                    <span className="cal-checkbox" aria-hidden="true" />
                    <span className="cal-calendar-name">{calendar.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <button className="cal-create" onClick={() => openCreate(focus)}>
            <IconPlus size={20} stroke={1.5} />
            Create event
          </button>
        </aside>
      </div>

      {activeModal?.kind === "detail" && detailEvent && (
        <EventDetailModal
          event={detailEvent}
          calendar={calendarById[detailEvent.calendarId]}
          isClosing={isClosing}
          onClosed={onClosed}
          onClose={() => setModal(null)}
          onEdit={() => openEdit(detailEvent)}
          onDelete={() => deleteEvent(detailEvent.id)}
        />
      )}
      {activeModal?.kind === "event-form" && (
        <EventFormModal
          draft={activeModal.draft}
          calendars={state.calendars}
          isClosing={isClosing}
          onClosed={onClosed}
          onClose={() => setModal(null)}
          onSave={saveEvent}
        />
      )}
      {activeModal?.kind === "calendar-form" && (
        <CalendarFormModal
          isClosing={isClosing}
          onClosed={onClosed}
          onClose={() => setModal(null)}
          onCreate={createCalendar}
        />
      )}
    </div>
  );
};

export default Calendar;
