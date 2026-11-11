import { WALL } from "@/game/config/constants";
import type { Vec2 } from "@/game/player/movement";
import type { AABB } from "@/game/world/collision";

export type RoomId = "bathroom" | "entry" | "kitchen" | "living" | "nook" | "bedroom";
export type FloorKind = "wood" | "hexTile" | "squareTile";
export type WallPaint = "white" | "sage" | "salmon";
export type FurnitureBuilder = "bath" | "bed" | "board" | "bookcase" | "cabinet" | "chair" | "coatRack" | "counter" | "desk" | "diningTable" | "divider" | "entrance" | "guitarRack" | "hob" | "nightstand" | "piano" | "rattanBox" | "sideTable" | "sink" | "sofa" | "steppedShelving" | "tableLaptop" | "toilet" | "towelRail" | "tv" | "washer";

export interface RoomLayout {
  id: RoomId;
  floor: FloorKind;
  wallPaint: WallPaint;
  rect: AABB;
  regions?: AABB[];
}

export interface WallOpening {
  centre: number;
  width: number;
  kind: "door" | "window";
  sill?: number;
  lintel?: number;
  closed?: boolean;
}

export interface WallLayout {
  id: string;
  from: Vec2;
  to: Vec2;
  thickness: number;
  openings?: WallOpening[];
  exterior?: boolean;
  seeThrough?: boolean;
  positiveRoom?: RoomId;
  negativeRoom?: RoomId;
  bathroomTiling?: { from: number; to: number; height: number };
  doorDecoration?: { centre: number; width: number; height: number };
}

export interface VisualWallPiece {
  wallId: string;
  bounds: AABB;
  bottom: number;
  height: number;
  glass: boolean;
}

export interface FurnitureLayout {
  id: string;
  builder: FurnitureBuilder;
  x: number;
  z: number;
  rotation?: number;
  width?: number;
  depth?: number;
  height?: number;
  mountingHeight?: number;
  colour?: number;
  accentColour?: number;
  collision?: boolean;
  toolId?: ToolId;
  title?: string;
  content?: "accounting" | "calendar" | "kanban" | "tasks" | "travel";
  fitting?: "sink" | "fridge";
  fadeWithWall?: string;
  worktopOverhang?: { left?: number; right?: number; front?: number; back?: number };
}

export const TOOL_IDS = [
  "living-room_task-hub", "living-room_calendar", "kitchen_grocery-manager",
  "bathroom_quote-of-the-day", "bedroom_snooze-buddy", "study_accounting-hub",
  "study_kanban-board", "hobby-room_craft-log", "hobby-room_travel-log",
] as const;
export type ToolId = (typeof TOOL_IDS)[number];

export const FLAT_BOUNDS: AABB = { minX: -2.87, maxX: 3.55, minZ: -5.325, maxZ: 5.325 };
export const ENTRANCE = { x: -0.12, z: -5.325, width: 1.26, height: 2.2 };
export const SPAWN: Vec2 = { x: -0.12, y: -4.25 };
export const NOOK_PARTITION_X = -0.6;

export const ROOMS: RoomLayout[] = [
  { id: "bathroom", floor: "squareTile", wallPaint: "salmon", rect: { minX: -2.87, maxX: -1.05, minZ: -5.325, maxZ: -2.2 } },
  { id: "entry", floor: "wood", wallPaint: "white", rect: { minX: -1.05, maxX: 0.825, minZ: -5.325, maxZ: -3 } },
  { id: "kitchen", floor: "hexTile", wallPaint: "sage", rect: { minX: 0.825, maxX: 3.55, minZ: -5.325, maxZ: -3 } },
  { id: "living", floor: "wood", wallPaint: "white", rect: { minX: -2.87, maxX: 3.55, minZ: -3, maxZ: 1.125 }, regions: [
    { minX: -1.05, maxX: 3.55, minZ: -3, maxZ: -2.2 },
    { minX: -2.87, maxX: 3.55, minZ: -2.2, maxZ: 1.125 },
  ] },
  { id: "nook", floor: "wood", wallPaint: "white", rect: { minX: -2.87, maxX: NOOK_PARTITION_X, minZ: 1.125, maxZ: 5.325 } },
  { id: "bedroom", floor: "wood", wallPaint: "white", rect: { minX: NOOK_PARTITION_X, maxX: 3.55, minZ: 1.125, maxZ: 5.325 } },
];

function wall(id: string, x1: number, z1: number, x2: number, z2: number, options: Omit<WallLayout, "id" | "from" | "to" | "thickness">): WallLayout {
  return { id, from: { x: x1, y: z1 }, to: { x: x2, y: z2 }, thickness: options.exterior ? 0.16 : WALL.thickness, ...options };
}

export const WALLS: WallLayout[] = [
  wall("north-bathroom", -2.87, -5.325, -1.05, -5.325, { exterior: true, positiveRoom: "bathroom", openings: [
    { centre: -2.46, width: 0.32, kind: "window", sill: 1.65, lintel: 2.29 },
    { centre: -1.49, width: 0.6, kind: "window", sill: 1.95, lintel: 2.25 },
  ] }),
  wall("north-entry", -1.05, -5.325, 0.825, -5.325, { exterior: true, positiveRoom: "entry", openings: [{ centre: ENTRANCE.x, width: ENTRANCE.width, kind: "door", closed: true }] }),
  wall("north-kitchen", 0.825, -5.325, 3.55, -5.325, { exterior: true, positiveRoom: "kitchen" }),
  wall("west-bathroom", -2.87, -5.325, -2.87, -2.2, { exterior: true, positiveRoom: "bathroom", bathroomTiling: { from: -3, to: -2.2, height: 1.18 } }),
  wall("west-living", -2.87, -2.2, -2.87, 1.125, { exterior: true, positiveRoom: "living", openings: [{ centre: 0.2, width: 0.88, kind: "window", sill: 1.94, lintel: 2.38 }] }),
  wall("west-nook", -2.87, 1.125, -2.87, 5.325, { exterior: true, positiveRoom: "nook", openings: [{ centre: 2.35, width: 0.88, kind: "window", sill: 1.94, lintel: 2.38 }] }),
  wall("east-kitchen", 3.55, -5.325, 3.55, -3, { exterior: true, seeThrough: true, negativeRoom: "kitchen", openings: [{ centre: -4.15, width: 1.4, kind: "window", sill: 1.05, lintel: 2.28 }] }),
  wall("east-living", 3.55, -3, 3.55, 1.125, { exterior: true, seeThrough: true, negativeRoom: "living", openings: [{ centre: -0.45, width: 1.65, kind: "window", sill: 0.72, lintel: 2.32 }] }),
  wall("east-bedroom", 3.55, 1.125, 3.55, 5.325, { exterior: true, seeThrough: true, negativeRoom: "bedroom", openings: [{ centre: 3.375, width: 1.875, kind: "window", sill: 0.72, lintel: 2.32 }] }),
  wall("south-nook", -2.87, 5.325, NOOK_PARTITION_X, 5.325, { exterior: true, seeThrough: true, negativeRoom: "nook" }),
  wall("south-bedroom", NOOK_PARTITION_X, 5.325, 3.55, 5.325, { exterior: true, seeThrough: true, negativeRoom: "bedroom" }),
  wall("bathroom-entry", -1.05, -5.325, -1.05, -3, { seeThrough: true, positiveRoom: "entry", negativeRoom: "bathroom", openings: [{ centre: -3.675, width: 1.23, kind: "door" }] }),
  wall("bathroom-divider", -1.98, -5.325, -1.98, -4.5, { seeThrough: true, positiveRoom: "bathroom", negativeRoom: "bathroom" }),
  wall("entry-kitchen", 0.825, -5.325, 0.825, -3, { seeThrough: true, positiveRoom: "kitchen", negativeRoom: "entry", openings: [{ centre: -3.9, width: 1.16, kind: "door" }] }),
  wall("bathroom-living", -2.87, -2.2, -1.05, -2.2, { seeThrough: true, positiveRoom: "living", negativeRoom: "bathroom", bathroomTiling: { from: -2.87, to: -1.05, height: 1.18 } }),
  wall("bathroom-projection", -1.05, -3, -1.05, -2.2, { seeThrough: true, positiveRoom: "living", negativeRoom: "bathroom", bathroomTiling: { from: -3, to: -2.2, height: 1.18 } }),
  wall("bathroom-entry-return", -1.05, -3, -0.75, -3, { seeThrough: true, positiveRoom: "living", negativeRoom: "bathroom" }),
  wall("entry-living", -0.75, -3, 0.825, -3, { seeThrough: true, positiveRoom: "living", negativeRoom: "entry", openings: [{ centre: -0.12, width: 1.26, kind: "door" }] }),
  wall("kitchen-living", 0.825, -3, 3.55, -3, { seeThrough: true, positiveRoom: "living", negativeRoom: "kitchen" }),
  wall("living-bedroom", NOOK_PARTITION_X, 1.125, 3.55, 1.125, { seeThrough: true, positiveRoom: "bedroom", negativeRoom: "living", openings: [{ centre: 2.96, width: 0.94, kind: "door" }] }),
  wall("nook-bedroom", NOOK_PARTITION_X, 1.125, NOOK_PARTITION_X, 5.325, { seeThrough: true, positiveRoom: "bedroom", negativeRoom: "nook", doorDecoration: { centre: 2.23, width: 0.72, height: 2.1 } }),
];

export const FURNITURE: FurnitureLayout[] = [
  { id: "front-door", builder: "entrance", x: ENTRANCE.x, z: ENTRANCE.z, width: ENTRANCE.width, height: ENTRANCE.height, colour: 0xe3ded3 },
  { id: "bath", builder: "bath", x: -1.95, z: -2.6, width: 1.68, depth: 0.68, colour: 0xf6f3eb, collision: true },
  { id: "bathroom-sink", builder: "sink", x: -2.57, z: -3.6, width: 0.5, depth: 0.42, rotation: Math.PI / 2, colour: 0xf4f2ec, collision: true, toolId: "bathroom_quote-of-the-day", title: "Quote of the day" },
  { id: "bathroom-towel-rail", builder: "towelRail", x: -2.785, z: -3.145, depth: 0.44, mountingHeight: 0.82, rotation: Math.PI / 2, colour: 0x929caa },
  { id: "toilet", builder: "toilet", x: -2.43, z: -4.84, width: 0.46, depth: 0.68, colour: 0xf5f3ef, collision: true },
  { id: "washer", builder: "washer", x: -1.51, z: -4.94, width: 0.56, depth: 0.58, colour: 0xf0eee9, collision: true },
  { id: "kitchen-hob", builder: "hob", x: 1.25, z: -4.915, width: 0.68, depth: 0.62, worktopOverhang: { right: 0 }, colour: 0xc7d2c4, collision: true, toolId: "kitchen_grocery-manager", title: "Grocery manager" },
  { id: "kitchen-counter", builder: "counter", x: 2.2, z: -4.915, width: 1.22, depth: 0.62, worktopOverhang: { left: 0, right: 0 }, fitting: "fridge", colour: 0xc7d2c4, collision: true },
  { id: "kitchen-sink", builder: "counter", x: 3.14, z: -4.15, width: 2.18, depth: 0.62, worktopOverhang: { left: 0.005, right: 0 }, fitting: "sink", rotation: -Math.PI / 2, colour: 0xc7d2c4, collision: true },
  { id: "entry-coats", builder: "coatRack", x: -0.93, z: -4.7, width: 0.78, depth: 0.12, rotation: Math.PI / 2, colour: 0x554c45 },
  { id: "entry-shoes", builder: "bookcase", x: -0.82, z: -4.7, width: 0.78, depth: 0.3, height: 0.55, rotation: Math.PI / 2, colour: 0x574c43, collision: true },
  { id: "task-board", builder: "board", x: -1.9, z: -2.1, width: 0.95, depth: 0.06, height: 0.68, mountingHeight: 1.4, colour: 0xd8c19a, accentColour: 0x6f5436, toolId: "living-room_task-hub", title: "Task hub", content: "tasks" },
  { id: "calendar-tv", builder: "tv", x: -2.37, z: -1.7, width: 0.92, depth: 0.35, rotation: Math.PI / 4, colour: 0x252526, toolId: "living-room_calendar", title: "Calendar", content: "calendar" },
  { id: "piano", builder: "piano", x: -0.73, z: -2.26, width: 1.28, depth: 0.48, rotation: Math.PI / 2, colour: 0x242225, collision: true },
  { id: "living-sofa", builder: "sofa", x: 0.825, z: 0.665, width: 1.85, depth: 0.78, rotation: Math.PI, colour: 0xa6a8ad, collision: true },
  { id: "living-side-table", builder: "sideTable", x: -0.415, z: 0.725, width: 0.42, depth: 0.42, colour: 0xa9783d, collision: true },
  { id: "dining-table", builder: "diningTable", x: 2.42, z: -2.38, width: 1.05, depth: 1.05, colour: 0x8f7457, collision: true },
  { id: "dining-chair-west", builder: "chair", x: 1.66, z: -2.38, rotation: Math.PI / 2, colour: 0x70553e },
  { id: "dining-chair-east", builder: "chair", x: 3.2, z: -2.38, rotation: -Math.PI / 2, colour: 0x70553e },
  { id: "dining-chair-south", builder: "chair", x: 2.42, z: -1.62, rotation: Math.PI, colour: 0x70553e },
  { id: "kanban-board", builder: "board", x: -2.75, z: 2.35, width: 0.94, depth: 0.06, height: 0.66, mountingHeight: 1.43, rotation: Math.PI / 2, colour: 0xe9e5dc, accentColour: 0x6b6259, toolId: "study_kanban-board", title: "Kanban board", content: "kanban" },
  { id: "nook-bed", builder: "bed", x: -2.08, z: 4.205, width: 1.42, depth: 2.08, colour: 0xe9e4d9, accentColour: 0x704559, collision: true },
  { id: "nook-cabinet", builder: "cabinet", x: -1.015, z: 3.915, width: 0.71, depth: 2.66, height: 1.2, rotation: Math.PI, colour: 0xe3ded4, collision: true, fadeWithWall: "nook-bedroom" },
  { id: "accounting-table", builder: "tableLaptop", x: -1.04, z: 2.315, width: 0.76, depth: 0.54, rotation: -Math.PI, colour: 0x7b6048, collision: true, toolId: "study_accounting-hub", title: "Accounting hub", content: "accounting" },
  { id: "nook-chair", builder: "chair", x: -1.04, z: 1.755, colour: 0x6a5749 },
  { id: "nook-divider", builder: "divider", x: -0.66, z: 1.125, width: 1.38, height: 1.6, colour: 0x252427, collision: true },
  { id: "bedroom-shelving", builder: "steppedShelving", x: 1.25, z: 1.375, width: 1.38, depth: 0.34, height: 1.84, colour: 0xa38359, collision: true },
  { id: "travel-poster", builder: "board", x: 1.72, z: 1.225, width: 0.78, depth: 0.05, height: 0.62, mountingHeight: 2.01, colour: 0xe5ddd0, accentColour: 0x6d4a3b, toolId: "hobby-room_travel-log", title: "Travel log", content: "travel" },
  { id: "bedroom-rattan-box", builder: "rattanBox", x: -0.08, z: 1.525, width: 0.84, depth: 0.68, height: 0.48, colour: 0xcbb18a, collision: true },
  { id: "bedroom-guitars", builder: "guitarRack", x: -0.04, z: 2.98, width: 0.64, depth: 0.54, collision: true },
  { id: "bedroom-bed", builder: "bed", x: -0.06, z: 4.265, width: 0.92, depth: 1.96, colour: 0xe8e3d9, accentColour: 0x8a2f4a, collision: true, toolId: "bedroom_snooze-buddy", title: "Snooze buddy" },
  { id: "bedroom-nightstand", builder: "nightstand", x: 0.66, z: 5.025, width: 0.42, depth: 0.4, colour: 0x9a7149, collision: true },
  { id: "craft-desk", builder: "desk", x: 3.16, z: 4.625, width: 1.22, depth: 0.58, rotation: -Math.PI / 2, colour: 0xa77b4c, collision: true, toolId: "hobby-room_craft-log", title: "Craft log" },
  { id: "desk-chair", builder: "chair", x: 2.5, z: 4.625, rotation: Math.PI / 2, colour: 0x5c6093 },
];

export function currentRoom(point: Vec2): RoomLayout | null {
  return ROOMS.find((room) => (room.regions ?? [room.rect]).some((rect) =>
    point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minZ && point.y <= rect.maxZ
  )) ?? null;
}

export function buildWalls(): AABB[] { return wallsToCollision(WALLS); }
export function buildVisualWalls(): VisualWallPiece[] { return wallsToVisual(WALLS); }
export function wallsToCollision(walls: WallLayout[]): AABB[] {
  return walls.flatMap((wall) => {
    const [start, end] = joinedWallSpan(wall, walls);
    return solidSegments(start, end, (wall.openings ?? []).filter((opening) => opening.kind === "door" && !opening.closed)).map(([from, to]) => wallBounds(wall, from, to));
  });
}

export function wallsToVisual(walls: WallLayout[]): VisualWallPiece[] {
  return walls.flatMap((wall) => {
    const result: VisualWallPiece[] = [];
    const [wallStart, wallEnd] = joinedWallSpan(wall, walls);
    let cursor = wallStart;
    for (const opening of [...(wall.openings ?? [])].sort((a, b) => a.centre - b.centre)) {
      const start = Math.max(wallStart, opening.centre - opening.width / 2);
      const end = Math.min(wallEnd, opening.centre + opening.width / 2);
      if (start > cursor) result.push(visualPiece(wall, cursor, start, 0, WALL.height));
      if (opening.kind === "window") {
        const sill = opening.sill ?? 0.85;
        const lintel = opening.lintel ?? 2.25;
        result.push(visualPiece(wall, start, end, 0, sill));
        result.push(visualPiece(wall, start, end, lintel, WALL.height - lintel));
        result.push({ ...visualPiece(wall, start, end, sill, lintel - sill), glass: true });
      }
      cursor = Math.max(cursor, end);
    }
    if (cursor < wallEnd) result.push(visualPiece(wall, cursor, wallEnd, 0, WALL.height));
    return result;
  });
}

function visualPiece(wall: WallLayout, start: number, end: number, bottom: number, height: number): VisualWallPiece {
  return { wallId: wall.id, bounds: wallBounds(wall, start, end), bottom, height, glass: false };
}

function solidSegments(from: number, to: number, openings: WallOpening[]): Array<[number, number]> {
  const segments: Array<[number, number]> = [];
  let cursor = from;
  for (const opening of [...openings].sort((a, b) => a.centre - b.centre)) {
    const gapStart = opening.centre - opening.width / 2;
    const gapEnd = opening.centre + opening.width / 2;
    if (gapStart > cursor) segments.push([cursor, Math.min(gapStart, to)]);
    cursor = Math.max(cursor, gapEnd);
  }
  if (cursor < to) segments.push([cursor, to]);
  return segments;
}

function lineStart(wall: WallLayout): number {
  return wall.from.x === wall.to.x ? Math.min(wall.from.y, wall.to.y) : Math.min(wall.from.x, wall.to.x);
}
function lineEnd(wall: WallLayout): number {
  return wall.from.x === wall.to.x ? Math.max(wall.from.y, wall.to.y) : Math.max(wall.from.x, wall.to.x);
}

function joinedWallSpan(wall: WallLayout, walls: WallLayout[]): [number, number] {
  const start = lineStart(wall);
  const end = lineEnd(wall);
  if (wall.from.x === wall.to.x) return [start, end];
  const extension = (x: number) => Math.max(0, ...walls.filter((other) =>
    other.from.x === other.to.x && Math.abs(other.from.x - x) < 0.000001 &&
    wall.from.y >= lineStart(other) && wall.from.y <= lineEnd(other)
  ).map((other) => other.thickness / 2));
  // Horizontal runs cover the full corner while the surface union removes overlaps
  return [start - extension(start), end + extension(end)];
}

function wallBounds(wall: WallLayout, start: number, end: number): AABB {
  const half = wall.thickness / 2;
  return wall.from.x === wall.to.x
    ? { minX: wall.from.x - half, maxX: wall.from.x + half, minZ: start, maxZ: end }
    : { minX: start, maxX: end, minZ: wall.from.y - half, maxZ: wall.from.y + half };
}
