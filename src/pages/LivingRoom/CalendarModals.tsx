import { useState, type SyntheticEvent } from "react";
import { IconPencil, IconTrash, IconClock, IconCalendarEvent, IconNotes } from "@tabler/icons-react";
import Modal from "@/components/Modal";
import { formatEventTime, formatFullDate, linkify } from "@/pages/LivingRoom/calendarLogic";
import { SWATCHES, type Calendar, type CalendarEvent, type SwatchId } from "@/pages/LivingRoom/calendarData";

// NOTE: Dates and times are the raw <input> strings, they become ISO on save
export interface EventDraft {
  id: string | null;
  calendarId: string;
  title: string;
  allDay: boolean;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  notes: string;
}

const swatchName = (id: SwatchId) => SWATCHES.find((s) => s.id === id)?.name ?? "";

const Notes = ({ text }: { text: string }) => (
  <p className="cal-notes">
    {linkify(text).map((segment, i) =>
      segment.href ? (
        <a key={i} href={segment.href} target="_blank" rel="noopener noreferrer">
          {segment.text}
        </a>
      ) : (
        <span key={i}>{segment.text}</span>
      )
    )}
  </p>
);

interface DetailProps {
  event: CalendarEvent;
  calendar: Calendar | undefined;
  isClosing: boolean;
  onClosed: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const EventDetailModal = ({
  event,
  calendar,
  isClosing,
  onClosed,
  onClose,
  onEdit,
  onDelete,
}: DetailProps) => (
  <Modal
    title={event.title}
    className={`cal-modal cal-detail swatch-${calendar?.colour ?? "graphite"}`}
    onClose={onClose}
    isClosing={isClosing}
    onClosed={onClosed}
  >
    <ul className="cal-detail-facts">
      <li>
        <IconClock size={18} stroke={1.5} />
        <span>{formatEventTime(event)}</span>
      </li>
      <li>
        <IconCalendarEvent size={18} stroke={1.5} />
        <span>{formatFullDate(new Date(event.start))}</span>
      </li>
      <li>
        <span className="cal-dot" aria-hidden="true" />
        <span>{calendar?.name ?? "Calendar"}</span>
      </li>
      {event.notes.trim() && (
        <li className="cal-detail-notes">
          <IconNotes size={18} stroke={1.5} />
          <Notes text={event.notes} />
        </li>
      )}
    </ul>
    <div className="cal-modal-actions">
      <button className="cal-btn cal-btn-danger" onClick={onDelete}>
        <IconTrash size={18} stroke={1.5} />
        Delete
      </button>
      <button className="cal-btn cal-btn-strong" onClick={onEdit}>
        <IconPencil size={18} stroke={1.5} />
        Edit
      </button>
    </div>
  </Modal>
);

interface FormProps {
  draft: EventDraft;
  calendars: Calendar[];
  isClosing: boolean;
  onClosed: () => void;
  onClose: () => void;
  onSave: (draft: EventDraft) => void;
}

export const EventFormModal = ({ draft, calendars, isClosing, onClosed, onClose, onSave }: FormProps) => {
  const [form, setForm] = useState<EventDraft>(draft);
  const patch = (patch: Partial<EventDraft>) => setForm((prev) => ({ ...prev, ...patch }));

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <Modal
      title={form.id ? "Edit event" : "New event"}
      className="cal-modal cal-form"
      onClose={onClose}
      isClosing={isClosing}
      onClosed={onClosed}
    >
      <form className="cal-fields" onSubmit={submit}>
        <label className="cal-field">
          <span className="cal-label">Title</span>
          <input
            className="cal-input"
            value={form.title}
            autoFocus
            placeholder="Add a title"
            onChange={(e) => patch({ title: e.currentTarget.value })}
          />
        </label>

        <label className="cal-field cal-field-inline">
          <input
            type="checkbox"
            checked={form.allDay}
            onChange={(e) => patch({ allDay: e.currentTarget.checked })}
          />
          <span className="cal-checkbox" aria-hidden="true" />
          <span className="cal-label">All day</span>
        </label>

        <label className="cal-field">
          <span className="cal-label">Date</span>
          <input
            className="cal-input"
            type="date"
            value={form.date}
            onChange={(e) => patch({ date: e.currentTarget.value })}
          />
        </label>
        {!form.allDay && (
          <div className="cal-field-row">
            <label className="cal-field cal-field-time">
              <span className="cal-label">From</span>
              <input
                className="cal-input"
                type="time"
                value={form.startTime}
                onChange={(e) => patch({ startTime: e.currentTarget.value })}
              />
            </label>
            <label className="cal-field cal-field-time">
              <span className="cal-label">To</span>
              <input
                className="cal-input"
                type="time"
                value={form.endTime}
                onChange={(e) => patch({ endTime: e.currentTarget.value })}
              />
            </label>
          </div>
        )}

        <label className="cal-field">
          <span className="cal-label">Calendar</span>
          <div className={`cal-select-wrap swatch-${calendars.find((c) => c.id === form.calendarId)?.colour ?? "graphite"}`}>
            <span className="cal-dot" aria-hidden="true" />
            <select
              className="cal-input cal-select"
              value={form.calendarId}
              onChange={(e) => patch({ calendarId: e.currentTarget.value })}
            >
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="cal-field">
          <span className="cal-label">Notes</span>
          <textarea
            className="cal-input cal-textarea"
            value={form.notes}
            rows={3}
            placeholder="Add details or paste a link"
            onChange={(e) => patch({ notes: e.currentTarget.value })}
          />
        </label>

        <div className="cal-modal-actions">
          <button type="button" className="cal-btn cal-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="cal-btn cal-btn-strong" disabled={!form.title.trim()}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};

interface CalendarFormProps {
  isClosing: boolean;
  onClosed: () => void;
  onClose: () => void;
  onCreate: (name: string, colour: SwatchId) => void;
}

export const CalendarFormModal = ({ isClosing, onClosed, onClose, onCreate }: CalendarFormProps) => {
  const [name, setName] = useState("");
  const [colour, setColour] = useState<SwatchId>(SWATCHES[0].id);

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), colour);
  };

  return (
    <Modal
      title="New calendar"
      className="cal-modal cal-form"
      onClose={onClose}
      isClosing={isClosing}
      onClosed={onClosed}
    >
      <form className="cal-fields" onSubmit={submit}>
        <label className="cal-field">
          <span className="cal-label">Name</span>
          <input
            className="cal-input"
            value={name}
            autoFocus
            placeholder="e.g. Medical appointments"
            onChange={(e) => setName(e.currentTarget.value)}
          />
        </label>

        <div className="cal-field">
          <span className="cal-label">Colour</span>
          <div className="cal-swatches">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                className={`cal-swatch swatch-${swatch.id}${colour === swatch.id ? " is-selected" : ""}`}
                aria-label={swatch.name}
                aria-pressed={colour === swatch.id}
                data-tooltip={swatch.name}
                data-tooltip-dir="top"
                onClick={() => setColour(swatch.id)}
              />
            ))}
          </div>
        </div>

        <div className="cal-modal-actions">
          <button type="button" className="cal-btn cal-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={`cal-btn cal-btn-strong swatch-${colour}`} disabled={!name.trim()}>
            Create {swatchName(colour) && `· ${swatchName(colour)}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
