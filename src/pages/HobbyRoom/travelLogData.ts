// Order matters: places visits within a year
export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

export type Season = (typeof SEASONS)[number];

export interface Place {
  id: string;
  name: string;
  country: string;
  season: Season;
  year: number; // NOTE: winter belongs to the year it starts in
  lat: number;
  lng: number;
  description: string;
  imageUrl: string;
}

// year the timeline starts from. End is always the current year.
export const TIMELINE_START = 1997;

const image = (name: string) => `/img/travel/${name}.svg`;

export const places: Place[] = [
  {
    id: "tl-annecy",
    name: "Annecy",
    country: "France",
    season: "summer",
    year: 1997,
    lat: 45.899,
    lng: 6.129,
    description:
      "Summers at the lake, back when the whole holiday was swimming until the light went and eating dinner far too late.",
    imageUrl: image("lake"),
  },
  {
    id: "tl-saint-malo",
    name: "Saint-Malo",
    country: "France",
    season: "summer",
    year: 1999,
    lat: 48.649,
    lng: -2.026,
    description: "Walking the ramparts in wind that never once let up, and the tide going out for what looked like miles.",
    imageUrl: image("coast"),
  },
  {
    id: "tl-edinburgh",
    name: "Edinburgh",
    country: "Scotland",
    season: "autumn",
    year: 2003,
    lat: 55.953,
    lng: -3.188,
    description: "Cold stone, steep steps and the best second-hand bookshops I had seen anywhere.",
    imageUrl: image("city"),
  },
  {
    id: "tl-kyoto",
    name: "Kyoto",
    country: "Japan",
    season: "autumn",
    year: 2005,
    lat: 35.011,
    lng: 135.768,
    description: "Went for the maples and stayed mostly for the food. Every temple garden was quieter than the last.",
    imageUrl: image("forest"),
  },
  {
    id: "tl-lisbon",
    name: "Lisbon",
    country: "Portugal",
    season: "spring",
    year: 2007,
    lat: 38.722,
    lng: -9.139,
    description: "Tiled fronts, painfully steep hills and a tram that felt one corner away from giving up entirely.",
    imageUrl: image("city"),
  },
  {
    id: "tl-reykjavik",
    name: "Reykjavik",
    country: "Iceland",
    season: "winter",
    year: 2009,
    lat: 64.147,
    lng: -21.94,
    description: "Four hours of proper daylight and the northern lights on the third night, which felt like a fair trade.",
    imageUrl: image("mountains"),
  },
  {
    id: "tl-barcelona",
    name: "Barcelona",
    country: "Spain",
    season: "summer",
    year: 2011,
    lat: 41.385,
    lng: 2.173,
    description: "Too hot to do anything before five, so we did everything after it.",
    imageUrl: image("city"),
  },
  {
    id: "tl-bruges",
    name: "Bruges",
    country: "Belgium",
    season: "autumn",
    year: 2013,
    lat: 51.209,
    lng: 3.224,
    description: "Canals, fog and an unreasonable quantity of chips. A long weekend that should have been a week.",
    imageUrl: image("city"),
  },
  {
    id: "tl-amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    season: "winter",
    year: 2013,
    lat: 52.371,
    lng: 4.892,
    description: "Borrowed a bike on the first morning and barely got off it until the train home.",
    imageUrl: image("city"),
  },
  {
    id: "tl-skye",
    name: "Isle of Skye",
    country: "Scotland",
    season: "spring",
    year: 2016,
    lat: 57.29,
    lng: -6.25,
    description: "Rain most days, and then an hour of clear evening light over the Cuillin that made up for all of it.",
    imageUrl: image("mountains"),
  },
  {
    id: "tl-marrakesh",
    name: "Marrakesh",
    country: "Morocco",
    season: "autumn",
    year: 2018,
    lat: 31.63,
    lng: -7.99,
    description: "Got lost in the souk on purpose, then by accident, then gave up and drank mint tea on a roof.",
    imageUrl: image("desert"),
  },
  {
    id: "tl-dolomites",
    name: "Dolomites",
    country: "Italy",
    season: "summer",
    year: 2021,
    lat: 46.41,
    lng: 11.84,
    description: "First real walking holiday. Sore for a week afterwards and already planning the next one.",
    imageUrl: image("mountains"),
  },
  {
    id: "tl-faroes",
    name: "Faroe Islands",
    country: "Denmark",
    season: "spring",
    year: 2024,
    lat: 62.008,
    lng: -6.771,
    description: "Grass roofs, sheep on every slope, and weather that changed its mind about four times an hour.",
    imageUrl: image("coast"),
  },
  {
    id: "tl-eryri",
    name: "Eryri",
    country: "Wales",
    season: "summer",
    year: 2026,
    lat: 53.068,
    lng: -4.076,
    description: "Up before dawn to beat the crowds on the Watkin Path, and very smug about it by nine in the morning.",
    imageUrl: image("mountains"),
  },
];
