import { useMemo, useState, type ChangeEvent } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { historyEntries, type HistoryEntry } from "@/pages/Bathroom/quoteData";
import quoteClose from "@/assets/quote-close.svg";

interface QuoteHistoryProps {
  today: Date;
  onBack: () => void;
}

interface MonthGroup {
  key: string;
  label: string;
  entries: HistoryEntry[];
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDay(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function groupByMonth(entries: HistoryEntry[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  let current: MonthGroup | null = null;
  for (const entry of entries) {
    const key = monthKey(entry.date);
    if (!current || current.key !== key) {
      current = {
        key,
        label: entry.date.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
        entries: [],
      };
      groups.push(current);
    }
    current.entries.push(entry);
  }
  return groups;
}

const QuoteHistory = ({ today, onBack }: QuoteHistoryProps) => {
  const groups = useMemo(() => groupByMonth(historyEntries(today)), [today]);
  const [month, setMonth] = useState(monthKey(today));

  const minMonth = groups[groups.length - 1]?.key ?? monthKey(today);
  const maxMonth = monthKey(today);

  // Jump the scroll to the chosen month's section
  const handleMonthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) return;
    setMonth(value);
    document.getElementById(`qh-month-${value}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="quote-tool">
      <div className="qh-bar">
        <button className="qh-back" onClick={onBack}>
          <IconArrowLeft size={18} stroke={1.5} />
          Quote of the day
        </button>
        <label className="qh-month">
          Month:
          <input
            type="month"
            name="month"
            className="qh-month-input"
            value={month}
            min={minMonth}
            max={maxMonth}
            onChange={handleMonthChange}
          />
        </label>
      </div>
      <div className="qh-body">
        <h1 className="qh-title">Quote history</h1>
        {groups.map((group) => (
          <section className="qh-group" id={`qh-month-${group.key}`} key={group.key}>
            <p className="qh-group-head">
              {group.label}
              <span className="qh-rule" />
              <img className="qh-group-mark" src={quoteClose} alt="" />
            </p>
            {group.entries.map((entry) => (
              <div className="qh-entry" key={entry.date.toISOString()}>
                <p className="qh-entry-text">{entry.quote.text}</p>
                <div className="qh-entry-meta">
                  <span className="qh-entry-author">{entry.quote.author}</span>
                  <span className="qh-entry-date">{formatDay(entry.date)}</span>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
};

export default QuoteHistory;
