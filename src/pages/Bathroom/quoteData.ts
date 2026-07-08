export interface Quote {
  text: string;
  author: string;
}

export interface Joke {
  text: string;
}

// Local fallback for quote APIs
export const quotes: Quote[] = [
  { text: "The more reasons you have for achieving your goal, the more determined you will become.", author: "Brian Tracy" },
  { text: "The day soldiers stop bringing you their problems is the day you have stopped leading them. They have either lost confidence that you can help them or concluded that you do not care. Either case is a failure of leadership.", author: "Colin Powell" },
  { text: "If you want to improve, be content to be thought foolish and stupid.", author: "Seneca" },
  { text: "In the end, it's not the years in your life that count; it's the life in your years.", author: "Abraham Lincoln" },
  { text: "Eighty percent of success is showing up.", author: "Woody Allen" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Little by little, one travels far.", author: "J.R.R. Tolkien" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
];

// Local fallback for joke APIs
export const jokes: Joke[] = [
  { text: "My dog used to chase people on a bike a lot. It got so bad I had to take his bike away." },
  { text: "I told my wife she was drawing her eyebrows too high. She looked surprised." },
  { text: "Why don't scientists trust atoms? Because they make up everything." },
  { text: "I used to play piano by ear. Now I use my hands." },
  { text: "I'm reading a book about anti-gravity. It's impossible to put down." },
];

// Days since the Unix epoch in local time (data resets at local midnight)
export function dayNumber(date: Date): number {
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(midnight.getTime() / 86_400_000);
}

// Weeks since the epoch, counted from Mondays (epoch day 0 was a Thursday so +3 shifts to Monday)
export function weekNumber(date: Date): number {
  return Math.floor((dayNumber(date) + 3) / 7);
}

function pick<T>(list: T[], index: number): T {
  return list[((index % list.length) + list.length) % list.length];
}

export function quoteForDate(date: Date): Quote {
  return pick(quotes, dayNumber(date));
}

export function jokeForDate(date: Date): Joke {
  return pick(jokes, weekNumber(date));
}

export interface HistoryEntry {
  date: Date;
  quote: Quote;
}

// One entry per day from `monthsBack` months ago up to `today`, newest first
export function historyEntries(today: Date, monthsBack = 12): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
  while (cursor >= start) {
    entries.push({ date: new Date(cursor), quote: quoteForDate(cursor) });
    cursor.setDate(cursor.getDate() - 1);
  }
  return entries;
}
