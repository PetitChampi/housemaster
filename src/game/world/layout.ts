import { WALL } from "@/game/config/constants";
import type { Vec2 } from "@/game/player/movement";
import type { AABB } from "@/game/world/collision";

// The house's temp floor plan: 3 x 2 grid of square rooms, each 10 sq units
// Room ids match the registry so the world can place each room's tools inside the matching rectangle
export const ROOM_RECTS: Record<string, AABB> = {
  "living-room": { minX: -15, maxX: -5, minZ: -10, maxZ: 0 },
  kitchen: { minX: -5, maxX: 5, minZ: -10, maxZ: 0 },
  bathroom: { minX: 5, maxX: 15, minZ: -10, maxZ: 0 },
  bedroom: { minX: -15, maxX: -5, minZ: 0, maxZ: 10 },
  study: { minX: -5, maxX: 5, minZ: 0, maxZ: 10 },
  "hobby-room": { minX: 5, maxX: 15, minZ: 0, maxZ: 10 },
};

// character spawn point
export const SPAWN: Vec2 = { x: -10, y: -5 };

// A wall = straight run along one axis with optional doorway centres
// "x" lines sit at a fixed x and span a range of z, "z" lines do the reverse.
interface WallLine {
  axis: "x" | "z";
  at: number;
  from: number;
  to: number;
  doors?: number[];
}

const WALL_LINES: WallLine[] = [
  { axis: "x", at: -15, from: -10, to: 10 },
  { axis: "x", at: -5, from: -10, to: 10, doors: [-5, 5] },
  { axis: "x", at: 5, from: -10, to: 10, doors: [-5, 5] },
  { axis: "x", at: 15, from: -10, to: 10 },
  { axis: "z", at: -10, from: -15, to: 15 },
  { axis: "z", at: 0, from: -15, to: 15, doors: [-10, 0, 10] },
  { axis: "z", at: 10, from: -15, to: 15 },
];

// Build every solid wall box for the house, doorways already removed
export function buildWalls(): AABB[] {
  const half = WALL.thickness / 2;
  const boxes: AABB[] = [];
  for (const line of WALL_LINES) {
    for (const [start, end] of solidSegments(line.from, line.to, line.doors ?? [])) {
      boxes.push(
        line.axis === "x"
          ? { minX: line.at - half, maxX: line.at + half, minZ: start, maxZ: end }
          : { minX: start, maxX: end, minZ: line.at - half, maxZ: line.at + half }
      );
    }
  }
  return boxes;
}

// Split a wall into the segments that stay solid once the doorway gaps are removed
function solidSegments(from: number, to: number, doors: number[]): Array<[number, number]> {
  const half = WALL.doorway / 2;
  const gaps = doors.map((d): [number, number] => [d - half, d + half]).sort((a, b) => a[0] - b[0]);
  const segments: Array<[number, number]> = [];
  let cursor = from;
  for (const [gapStart, gapEnd] of gaps) {
    if (gapStart > cursor) segments.push([cursor, Math.min(gapStart, to)]);
    cursor = Math.max(cursor, gapEnd);
  }
  if (cursor < to) segments.push([cursor, to]);
  return segments;
}
