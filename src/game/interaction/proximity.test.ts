import { describe, expect, it } from "vitest";
import { findNearest } from "@/game/interaction/proximity";
import type { Interactable } from "@/game/world/Interactable";

function item(toolId: string, minX: number, maxX: number): Interactable {
  return {
    toolId,
    position: { x: (minX + maxX) / 2, y: 0 },
    footprint: { minX, maxX, minZ: -0.5, maxZ: 0.5 },
  } as Interactable;
}

describe("findNearest", () => {
  it("measures reach from the closest point on a footprint", () => {
    const wide = item("wide", 1, 5);
    expect(findNearest({ x: 0.4, y: 0 }, [wide], 0.7, () => true)).toBe(wide);
  });

  it("chooses the nearest permitted footprint", () => {
    const blocked = item("blocked", 0.5, 1);
    const allowed = item("allowed", 1.2, 1.5);
    expect(findNearest({ x: 0, y: 0 }, [blocked, allowed], 2, (id) => id === "allowed")).toBe(allowed);
  });

  it("rejects a tool across a wall and allows it through an opening", () => {
    const target = item("target", 1, 1.5);
    const wall = { minX: 0.7, maxX: 0.8, minZ: -1, maxZ: 1 };
    expect(findNearest({ x: 0.5, y: 0 }, [target], 1, () => true, [wall])).toBeNull();
    expect(findNearest({ x: 0.5, y: 0 }, [target], 1, () => true, [
      { ...wall, maxZ: -0.4 }, { ...wall, minZ: 0.4 },
    ])).toBe(target);
  });
});
