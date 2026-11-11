import { describe, expect, it } from "vitest";
import { PLAYER } from "@/game/config/constants";
import { toolsById } from "@/tools/registry";
import {
  FURNITURE,
  WALLS,
  currentRoom,
  wallsToCollision,
  wallsToVisual,
  type WallLayout,
} from "@/game/world/layout";

const testWall = (kind: "door" | "window"): WallLayout => ({
  id: kind,
  from: { x: 0, y: 0 },
  to: { x: 4, y: 0 },
  thickness: 0.12,
  openings: [{ centre: 2, width: 1, kind, sill: 0.8, lintel: 2.1 }],
});

describe("wall layout helpers", () => {
  it("leaves a door gap in collision and visual walls", () => {
    const collision = wallsToCollision([testWall("door")]);
    const visual = wallsToVisual([testWall("door")]);
    expect(collision).toHaveLength(2);
    expect(visual).toHaveLength(2);
    expect(collision[0].maxX).toBe(1.5);
    expect(collision[1].minX).toBe(2.5);
  });

  it("keeps a window solid for collision and splits its visual wall", () => {
    const collision = wallsToCollision([testWall("window")]);
    const visual = wallsToVisual([testWall("window")]);
    expect(collision).toHaveLength(1);
    expect(collision[0]).toMatchObject({ minX: 0, maxX: 4 });
    expect(visual.filter((piece) => piece.glass)).toHaveLength(1);
    expect(visual.some((piece) => piece.bottom === 0 && piece.height === 0.8)).toBe(true);
    expect(visual.some((piece) => piece.bottom === 2.1)).toBe(true);
  });

  it("preserves windows in translucent walls", () => {
    const wall = { ...testWall("window"), seeThrough: true };
    const visual = wallsToVisual([wall]);
    expect(visual.filter((piece) => piece.glass)).toHaveLength(1);
    expect(visual.some((piece) => piece.bottom === 2.1)).toBe(true);
  });
});

describe("currentRoom", () => {
  it("finds rooms across the flat and returns null outside", () => {
    expect(currentRoom({ x: -1.8, y: -2.5 })?.id).toBe("bathroom");
    expect(currentRoom({ x: 1.5, y: -0.4 })?.id).toBe("living");
    expect(currentRoom({ x: 1.2, y: 2.4 })?.id).toBe("bedroom");
    expect(currentRoom({ x: 10, y: 10 })).toBeNull();
  });

  it("assigns the bathroom projection to the bathroom and the space beside it to the living room", () => {
    expect(currentRoom({ x: -1.8, y: -2.5 })?.id).toBe("bathroom");
    expect(currentRoom({ x: -0.3, y: -2.5 })?.id).toBe("living");
  });
});

describe("flat data", () => {
  it("makes every door wide enough for the player", () => {
    const minimum = PLAYER.radius * 2 + 0.25;
    const doors = WALLS.flatMap((wall) => wall.openings ?? []).filter((opening) => opening.kind === "door");
    expect(doors.length).toBeGreaterThan(0);
    expect(doors.every((door) => door.width > minimum)).toBe(true);
  });

  it("places every registered tool exactly once", () => {
    const placed = FURNITURE.flatMap((item) => item.toolId ? [item.toolId] : []).sort();
    expect(placed).toEqual(Object.keys(toolsById).sort());
  });

  it("connects the kitchen only to the entry and puts its window on the street wall", () => {
    const kitchenWalls = WALLS.filter((wall) => wall.positiveRoom === "kitchen" || wall.negativeRoom === "kitchen");
    const doorWalls = kitchenWalls.filter((wall) => wall.openings?.some((opening) => opening.kind === "door"));
    const windowWalls = kitchenWalls.filter((wall) => wall.openings?.some((opening) => opening.kind === "window"));
    expect(doorWalls.map((wall) => wall.id)).toEqual(["entry-kitchen"]);
    expect(windowWalls.map((wall) => wall.id)).toEqual(["east-kitchen"]);
  });

  it("keeps the street wall and the entry/kitchen boundary straight and continuous", () => {
    const street = ["east-kitchen", "east-living", "east-bedroom"].map((id) => WALLS.find((wall) => wall.id === id)!);
    for (const wall of street) {
      expect(wall.from.x).toBe(street[0].from.x);
      expect(wall.to.x).toBe(street[0].from.x);
    }
    expect(street[0].to).toEqual(street[1].from);
    expect(street[1].to).toEqual(street[2].from);
    const entry = WALLS.find((wall) => wall.id === "entry-living")!;
    const kitchen = WALLS.find((wall) => wall.id === "kitchen-living")!;
    expect(entry.to).toEqual(kitchen.from);
    expect(entry.from.y).toBe(kitchen.to.y);
    expect(WALLS.some((wall) => ["bedroom-step", "entry-living-return"].includes(wall.id))).toBe(false);
  });

  it("has solid rear walls and only the street-facing bedroom window", () => {
    const rear = WALLS.filter((wall) => wall.id.startsWith("south-"));
    expect(rear.every((wall) => !wall.openings?.length)).toBe(true);
    const bedroomWindows = WALLS.filter((wall) => (wall.positiveRoom === "bedroom" || wall.negativeRoom === "bedroom") && wall.openings?.some((opening) => opening.kind === "window"));
    expect(bedroomWindows.map((wall) => wall.id)).toEqual(["east-bedroom"]);
  });
});
