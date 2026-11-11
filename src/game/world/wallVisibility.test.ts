import { describe, expect, it } from "vitest";
import { WALL } from "@/game/config/constants";
import { WALLS } from "@/game/world/layout";
import { wallOpacity } from "@/game/world/wallVisibility";

describe("room wall visibility", () => {
  it("fades every camera-facing wall of the occupied room even from its far corner", () => {
    const bedroom = { x: -0.5, y: 1.9 };
    for (const id of ["east-bedroom", "south-bedroom"]) {
      expect(wallOpacity(WALLS.find((wall) => wall.id === id)!, bedroom)).toBe(WALL.fadedOpacity);
    }
    for (const id of ["living-bedroom", "east-living", "nook-bedroom"]) {
      expect(wallOpacity(WALLS.find((wall) => wall.id === id)!, bedroom)).toBe(1);
    }
  });

  it("changes the fading group when entering another room and keeps far walls solid", () => {
    const living = { x: 0.3, y: -0.7 };
    for (const id of ["east-living", "living-bedroom"]) {
      expect(wallOpacity(WALLS.find((wall) => wall.id === id)!, living)).toBe(WALL.fadedOpacity);
    }
    for (const id of ["west-living", "bathroom-living", "east-bedroom", "kitchen-living"]) {
      expect(wallOpacity(WALLS.find((wall) => wall.id === id)!, living)).toBe(1);
    }
  });

  it("fades the small panel by the piano with the bathroom while the far door jamb belongs to the entry", () => {
    const panel = WALLS.find((wall) => wall.id === "bathroom-entry-return")!;
    const entry = WALLS.find((wall) => wall.id === "entry-living")!;
    const bathroom = { x: -2.4, y: -3.8 };
    expect(wallOpacity(panel, bathroom)).toBe(WALL.fadedOpacity);
    expect(wallOpacity(entry, bathroom)).toBe(1);
    expect(wallOpacity(panel, { x: 0, y: -4 })).toBe(1);
  });
});
