import {
  dayNumber,
  weekNumber,
  quoteForDate,
  jokeForDate,
  type Quote,
  type Joke,
} from "@/pages/Bathroom/quoteData";

// Free keyless APIs tried in order until one answers (payload normalised to a Quote)
// All offer unlimited reads which is more than enough for one quote a day
const quoteSources: Array<() => Promise<Quote>> = [
  async () => {
    const res = await fetch("https://dummyjson.com/quotes/random");
    if (!res.ok) throw new Error("dummyjson");
    const data = await res.json();
    return { text: data.quote, author: data.author };
  },
  async () => {
    const res = await fetch("https://api.quotable.io/random?maxLength=140");
    if (!res.ok) throw new Error("quotable");
    const data = await res.json();
    return { text: data.content, author: data.author };
  },
  async () => {
    const res = await fetch("https://zenquotes.io/api/today");
    if (!res.ok) throw new Error("zenquotes");
    const data = await res.json();
    return { text: data[0].q, author: data[0].a };
  },
];

const jokeSources: Array<() => Promise<Joke>> = [
  async () => {
    const res = await fetch("https://icanhazdadjoke.com/", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("icanhazdadjoke");
    const data = await res.json();
    return { text: data.joke };
  },
  async () => {
    const res = await fetch(
      "https://v2.jokeapi.dev/joke/Any?safe-mode&blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single"
    );
    if (!res.ok) throw new Error("jokeapi");
    const data = await res.json();
    if (data.error || !data.joke) throw new Error("jokeapi");
    return { text: data.joke };
  },
  async () => {
    const res = await fetch("https://official-joke-api.appspot.com/random_joke");
    if (!res.ok) throw new Error("official-joke");
    const data = await res.json();
    return { text: `${data.setup} ${data.punchline}` };
  },
];

async function firstResolved<T>(sources: Array<() => Promise<T>>, fallback: T): Promise<T> {
  for (const source of sources) {
    try {
      return await source();
    } catch {
      console.warn("Quote/joke source failed, falling back to next");
    }
  }
  return fallback;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// Stores the value under `key` and clears any older entry sharing `prefix`, so only the current period lingers
function writeCache(key: string, value: unknown, prefix: string) {
  try {
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const existing = localStorage.key(i);
      if (existing && existing.startsWith(prefix) && existing !== key) stale.push(existing);
    }
    stale.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn("Failed to write quote/joke cache, ignoring");
  }
}

// One quote a day: cache key = the day (same quote shows until local midnight)
export async function loadDailyQuote(date: Date): Promise<Quote> {
  const key = `qotd:quote:${dayNumber(date)}`;
  const cached = readCache<Quote>(key);
  if (cached) return cached;
  const quote = await firstResolved(quoteSources, quoteForDate(date));
  writeCache(key, quote, "qotd:quote:");
  return quote;
}

// One joke a week: cache key is the Monday-based week number
export async function loadWeeklyJoke(date: Date): Promise<Joke> {
  const key = `qotd:joke:${weekNumber(date)}`;
  const cached = readCache<Joke>(key);
  if (cached) return cached;
  const joke = await firstResolved(jokeSources, jokeForDate(date));
  writeCache(key, joke, "qotd:joke:");
  return joke;
}
