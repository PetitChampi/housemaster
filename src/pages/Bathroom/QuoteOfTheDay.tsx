import { useEffect, useMemo, useState } from "react";
import { IconClock, IconMoodXd } from "@tabler/icons-react";
import { loadDailyQuote, loadWeeklyJoke } from "@/pages/Bathroom/quoteService";
import type { Quote, Joke } from "@/pages/Bathroom/quoteData";
import QuoteHistory from "@/pages/Bathroom/QuoteHistory";
import quoteOpen from "@/assets/quote-open.svg";
import quoteClose from "@/assets/quote-close.svg";
import "@/styles/tools/QuoteOfTheDay.css";

const QuoteOfTheDay = () => {
  const today = useMemo(() => new Date(), []);
  const [showHistory, setShowHistory] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [joke, setJoke] = useState<Joke | null>(null);
  const isMonday = today.getDay() === 1;

  useEffect(() => {
    let active = true;
    loadDailyQuote(today).then((value) => active && setQuote(value));
    return () => {
      active = false;
    };
  }, [today]);

  useEffect(() => {
    if (!isMonday) return;
    let active = true;
    loadWeeklyJoke(today).then((value) => active && setJoke(value));
    return () => { active = false; };
  }, [today, isMonday]);

  if (showHistory) {
    return <QuoteHistory today={today} onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="quote-tool">
      <div className="qt-body">
        <h1 className="qt-title">Quote of the day</h1>
        <div className="qt-quote">
          <img className="qt-mark qt-mark-open" src={quoteOpen} alt="" />
          <img className="qt-mark qt-mark-close" src={quoteClose} alt="" />
          <div className="qt-quote-card">
            {quote ? (
              <>
                <p className="qt-quote-text">{quote.text}</p>
                <p className="qt-quote-author">{quote.author}</p>
              </>
            ) : (
              <div className="qt-skeleton" aria-hidden="true">
                <span className="qt-skeleton-line" />
                <span className="qt-skeleton-line" />
                <span className="qt-skeleton-line qt-skeleton-line-short" />
                <span className="qt-skeleton-line qt-skeleton-line-author" />
              </div>
            )}
          </div>
        </div>
        <button className="qt-history-btn" onClick={() => setShowHistory(true)}>
          <IconClock size={18} stroke={1.5} />
          View previous quotes
        </button>
        {isMonday && (
          <section className="qt-joke">
            <span className="qt-joke-smiley">
              <IconMoodXd size={55} stroke={0.5} />
            </span>
            <p className="qt-joke-label">Monday joke</p>
            {joke ? (
              <p className="qt-joke-text">{joke.text}</p>
            ) : (
              <div className="qt-skeleton qt-skeleton-joke" aria-hidden="true">
                <span className="qt-skeleton-line" />
                <span className="qt-skeleton-line qt-skeleton-line-short" />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default QuoteOfTheDay;
