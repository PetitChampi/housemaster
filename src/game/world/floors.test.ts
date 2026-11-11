import { describe, expect, it } from "vitest";
import { floorRegions } from "@/game/world/floors";
import { ROOMS, WALLS, buildWalls } from "@/game/world/layout";

const regions = ROOMS.flatMap((room) => floorRegions(room, WALLS));
const covering = (x: number, z: number) => regions.filter((rect) => x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ);

describe("floor coverage under walls", () => {
  it("extends to the outside face at every wall corner", () => {
    for (const bounds of buildWalls()) {
      for (const x of [bounds.minX + 0.00001, bounds.maxX - 0.00001]) {
        for (const z of [bounds.minZ + 0.00001, bounds.maxZ - 0.00001]) {
          expect(covering(x, z).length, `${x}, ${z}`).toBeGreaterThan(0);
        }
      }
    }
    expect(Math.min(...regions.map((region) => region.minX))).toBeCloseTo(-2.95);
    expect(Math.max(...regions.map((region) => region.maxX))).toBeCloseTo(3.63);
    expect(Math.min(...regions.map((region) => region.minZ))).toBeCloseTo(-5.405);
    expect(Math.max(...regions.map((region) => region.maxZ))).toBeCloseTo(5.405);
  });

  it("has no overlapping planes that can flicker through a faded wall", () => {
    for (let i = 0; i < regions.length; i += 1) {
      for (const b of regions.slice(i + 1)) {
        const a = regions[i];
        const area = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)) *
          Math.max(0, Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ));
        expect(area).toBe(0);
      }
    }
  });
});
