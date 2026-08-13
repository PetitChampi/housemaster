import { describe, it, expect } from "vitest";
import {
  clamp,
  formatVisit,
  layoutTimeline,
  projectToMap,
  sortByVisit,
  visitKey,
  visitTime,
  type TimelineOptions,
} from "@/pages/HobbyRoom/travelLogLogic";
import { SEASONS, type Season } from "@/pages/HobbyRoom/travelLogData";

const visit = (year: number, season: Season) => ({ year, season });

const last = (values: number[]) => values[values.length - 1];

const options = (overrides: Partial<TimelineOptions> = {}): TimelineOptions => ({
  startYear: 2000,
  endYear: 2009,
  width: 1000,
  minGap: 40,
  padStart: 0,
  padEnd: 0,
  ...overrides,
});

describe("visitKey", () => {
  it("orders seasons within a year", () => {
    expect(visitKey(visit(2005, "spring"))).toBeLessThan(visitKey(visit(2005, "summer")));
    expect(visitKey(visit(2005, "summer"))).toBeLessThan(visitKey(visit(2005, "autumn")));
    expect(visitKey(visit(2005, "autumn"))).toBeLessThan(visitKey(visit(2005, "winter")));
  });

  it("puts a whole year ahead of the one before it", () => {
    expect(visitKey(visit(2005, "spring"))).toBeGreaterThan(visitKey(visit(2004, "winter")));
  });
});

describe("sortByVisit", () => {
  it("returns visits oldest first", () => {
    const sorted = sortByVisit([visit(2005, "autumn"), visit(1997, "summer"), visit(2005, "spring")]);
    expect(sorted).toEqual([visit(1997, "summer"), visit(2005, "spring"), visit(2005, "autumn")]);
  });

  it("leaves the input untouched", () => {
    const input = [visit(2005, "autumn"), visit(1997, "summer")];
    sortByVisit(input);
    expect(input[0]).toEqual(visit(2005, "autumn"));
  });
});

describe("formatVisit", () => {
  it("reads as a capitalised season and year", () => {
    expect(formatVisit(visit(2005, "autumn"))).toBe("Autumn 2005");
  });
});

describe("visitTime", () => {
  it("places a visit inside its season rather than on the year boundary", () => {
    expect(visitTime(visit(2000, "spring"))).toBe(2000.125);
    expect(visitTime(visit(2000, "winter"))).toBe(2000.875);
  });

  it("keeps consecutive seasons a quarter of a year apart", () => {
    expect(visitTime(visit(2000, "summer")) - visitTime(visit(2000, "spring"))).toBeCloseTo(0.25);
  });
});

describe("projectToMap", () => {
  it("maps the origin to the middle of the land path's space", () => {
    expect(projectToMap(0, 0)).toEqual({ x: 180, y: 90 });
  });

  it("puts north above south and east right of west", () => {
    expect(projectToMap(90, -180)).toEqual({ x: 0, y: 0 });
    expect(projectToMap(-90, 180)).toEqual({ x: 360, y: 180 });
  });
});

describe("layoutTimeline", () => {
  it("spaces visits by the real gap between them", () => {
    const { positions } = layoutTimeline(
      [visit(2000, "spring"), visit(2002, "spring"), visit(2008, "spring")],
      options({ minGap: 0 })
    );
    // Two years apart, then six, so the second gap is three times the first
    expect(positions[2] - positions[1]).toBeCloseTo((positions[1] - positions[0]) * 3);
  });

  it("holds crowded visits at least a minimum gap apart", () => {
    const { positions } = layoutTimeline(
      [visit(2000, "spring"), visit(2000, "summer"), visit(2000, "autumn")],
      options({ minGap: 40 })
    );
    expect(positions[1] - positions[0]).toBeCloseTo(40);
    expect(positions[2] - positions[1]).toBeCloseTo(40);
  });

  it("never pushes a visit earlier than its true position", () => {
    const places = [visit(2000, "spring"), visit(2000, "summer"), visit(2009, "winter")];
    const config = options({ minGap: 40 });
    const { positions, width } = layoutTimeline(places, config);
    places.forEach((place, index) => {
      const ideal = ((visitTime(place) - config.startYear) / 10) * width;
      expect(positions[index]).toBeGreaterThanOrEqual(ideal - 0.001);
    });
  });

  it("keeps the container width when everything fits", () => {
    const { width } = layoutTimeline([visit(2000, "spring"), visit(2008, "spring")], options());
    expect(width).toBe(1000);
  });

  it("grows the track when the minimum gap won't fit", () => {
    const crowded = [2000, 2001, 2002].flatMap((year) => SEASONS.map((season) => visit(year, season)));
    const { width, positions } = layoutTimeline(crowded, options({ width: 200, minGap: 40 }));
    expect(width).toBeGreaterThan(200);
    // A grown track still has to hold every marker inside it
    expect(last(positions)).toBeLessThanOrEqual(width);
  });

  // Widening the track spreads the true positions too, so a naive grow-and-retry can push the tail back out
  it("still holds the last marker inside a track it had to grow", () => {
    const bunched = SEASONS.map((season) => visit(2009, season));
    const { width, positions } = layoutTimeline(bunched, options({ width: 300, minGap: 50 }));
    expect(last(positions)).toBeLessThanOrEqual(width);
    expect(positions[1] - positions[0]).toBeGreaterThanOrEqual(50 - 0.001);
  });

  it("respects the padding at both ends", () => {
    const { positions } = layoutTimeline(
      [visit(2000, "spring"), visit(2009, "winter")],
      options({ padStart: 60, padEnd: 60 })
    );
    expect(positions[0]).toBeGreaterThanOrEqual(60);
    expect(last(positions)).toBeLessThanOrEqual(1000 - 60);
  });

  it("handles an empty log", () => {
    expect(layoutTimeline([], options())).toEqual({ width: 1000, positions: [] });
  });
});

describe("clamp", () => {
  it("holds a value inside its bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(30, 0, 10)).toBe(10);
  });
});
