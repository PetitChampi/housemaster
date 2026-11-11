import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bathroomTileTexture, clearTextureCache, decoratedWallTexture, floorTexture } from "@/game/world/textures";
import { WALL } from "@/game/config/constants";
import { WALLS } from "@/game/world/layout";

interface Polygon { colour: string; points: Array<[number, number]> }
let polygons: Polygon[];
let rectangles: Array<{ x: number; y: number; width: number; height: number; colour: string }>;

beforeEach(() => {
  polygons = [];
  rectangles = [];
  let path: Array<[number, number]> = [];
  const context = {
    fillStyle: "", strokeStyle: "", lineWidth: 1,
    fillRect: (x: number, y: number, width: number, height: number) => rectangles.push({ x, y, width, height, colour: context.fillStyle }),
    strokeRect: vi.fn(), stroke: vi.fn(), closePath: vi.fn(), bezierCurveTo: vi.fn(),
    beginPath: () => { path = []; },
    moveTo: (x: number, y: number) => { path.push([x, y]); },
    lineTo: (x: number, y: number) => { path.push([x, y]); },
    fill: () => polygons.push({ colour: context.fillStyle, points: [...path] }),
  };
  vi.stubGlobal("document", { createElement: () => ({ width: 0, height: 0, getContext: () => context }) });
});

afterEach(() => { clearTextureCache(); vi.unstubAllGlobals(); });

function colourAt(x: number, y: number): string | undefined {
  return [...polygons].reverse().find(({ points }) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  })?.colour;
}

describe("floor texture continuity", () => {
  it("matches hexagon shapes and colours at both repeat boundaries", () => {
    floorTexture("hexTile", 3, 2, 1);
    for (let sample = 3.17; sample < 512; sample += 13.31) {
      expect(colourAt(0.17, sample)).toBeDefined();
      expect(colourAt(0.17, sample)).toBe(colourAt(512.17, sample));
      expect(colourAt(sample, 0.17)).toBe(colourAt(sample, 512.17));
    }
  });

  it("aligns the wood grain phase across adjoining floor sections", () => {
    const west = floorTexture("wood", 2, 3, 1, -2, 3);
    const east = floorTexture("wood", 4, 3, 1, 0, 3);
    expect(west.offset.x + west.repeat.x).toBeCloseTo(east.offset.x);
    expect(west.offset.y).toBe(east.offset.y);
    const south = floorTexture("wood", 2, 2, 1, -2, 5);
    expect(south.offset.y + south.repeat.y).toBeCloseTo(west.offset.y);
  });

  it("varies plank lengths and joint offsets without a discontinuity at the repeat", () => {
    floorTexture("wood", 3, 2, 1);
    const planks = rectangles.filter((rectangle) => rectangle.height < 100);
    expect(new Set(planks.map((plank) => plank.width)).size).toBeGreaterThan(20);
    const jointsByRow = new Map<number, number[]>();
    for (const plank of planks.filter((plank) => plank.x >= 0 && plank.x < 1024)) {
      jointsByRow.set(plank.y, [...(jointsByRow.get(plank.y) ?? []), plank.x]);
    }
    expect(new Set([...jointsByRow.values()].map((joints) => joints.sort((a, b) => a - b).join(","))).size).toBe(16);
    const colour = (x: number, y: number) => planks.find((plank) => x >= plank.x && x <= plank.x + plank.width && y >= plank.y && y <= plank.y + plank.height)?.colour;
    for (let y = 3; y < 1024; y += 17) expect(colour(0.17, y)).toBe(colour(1024.17, y));
  });

  it("uses floor tiles twice the width of the unchanged bathroom wall tiles", () => {
    const floor = floorTexture("squareTile", 1.2, 1.2, 1);
    const wall = bathroomTileTexture(1.2, 1.2, 1);
    expect(floor.repeat.x * 2).toBe(wall.repeat.x);
    expect(floor.repeat.y * 2).toBe(wall.repeat.y);
  });

  it("paints bath tiles only within the specified band of a single wall texture", () => {
    const wall = WALLS.find((wall) => wall.id === "west-bathroom")!;
    const texture = decoratedWallTexture(wall, 0xd9a08f, 1, true);
    const image = texture.image as HTMLCanvasElement;
    const band = wall.bathroomTiling!;
    expect(rectangles[0].colour).toBe("#d9a08f");
    const scaleX = image.width / (wall.to.y - wall.from.y);
    const scaleY = image.height / WALL.height;
    const tiles = rectangles.slice(1);
    expect(tiles.length).toBeGreaterThan(30);
    for (const tile of tiles) {
      expect(tile.x).toBeGreaterThanOrEqual((band.from - wall.from.y) * scaleX - 1e-6);
      expect(tile.x + tile.width).toBeLessThanOrEqual((band.to - wall.from.y) * scaleX + 1e-6);
      expect(tile.y).toBeGreaterThanOrEqual(image.height - band.height * scaleY - 1e-6);
      expect(tile.y + tile.height).toBeLessThanOrEqual(image.height + 1e-6);
    }
  });
});
