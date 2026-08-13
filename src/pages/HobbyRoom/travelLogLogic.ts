import { SEASONS, type Place, type Season } from "@/pages/HobbyRoom/travelLogData";

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const seasonIndex = (season: Season) => SEASONS.indexOf(season);

export const visitKey = (place: Pick<Place, "season" | "year">) => place.year * 4 + seasonIndex(place.season);

export const sortByVisit = <T extends Pick<Place, "season" | "year">>(places: T[]): T[] =>
  [...places].sort((a, b) => visitKey(a) - visitKey(b));

export const formatVisit = (place: Pick<Place, "season" | "year">) =>
  `${place.season.charAt(0).toUpperCase()}${place.season.slice(1)} ${place.year}`;

export const visitTime = (place: Pick<Place, "season" | "year">) =>
  place.year + seasonIndex(place.season) / 4 + 1 / 8;

export const projectToMap = (lat: number, lng: number) => ({ x: lng + 180, y: 90 - lat });

export interface TimelineOptions {
  startYear: number;
  endYear: number;
  // Width available in scroll container -> track grows past it when markers won't fit
  width: number;
  minGap: number;
  padStart: number;
  padEnd: number;
}

export interface TimelineLayout {
  width: number;
  positions: number[];
}

// Positions markers along the track, expecting places already in visit order
export const layoutTimeline = (
  places: Pick<Place, "season" | "year">[],
  options: TimelineOptions
): TimelineLayout => {
  const { startYear, endYear, width, minGap, padStart, padEnd } = options;
  const span = Math.max(endYear + 1 - startYear, 1);
  const fractions = places.map((place) => clamp((visitTime(place) - startYear) / span, 0, 1));

  const last = places.length - 1;
  let inner = Math.max(width - padStart - padEnd, 1);
  fractions.forEach((fraction, index) => {
    const room = 1 - fraction;
    if (room > 0) inner = Math.max(inner, ((last - index) * minGap) / room);
  });

  let previous = -Infinity;
  const positions = fractions.map((fraction) => {
    const x = Math.max(padStart + fraction * inner, previous + minGap);
    previous = x;
    return x;
  });

  return { width: Math.max(width, inner + padStart + padEnd, previous + padEnd), positions };
};
