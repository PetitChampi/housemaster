import type { Vec2 } from "@/game/player/movement";

// axis-aligned box on the floor plane, used both for walls and for collision maths
export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

// Each axis is resolved on its own, which is what produces the "slide along the wall" feel when walking into one at an angle
export function resolveCollision(from: Vec2, to: Vec2, radius: number, walls: AABB[]): Vec2 {
  const pos: Vec2 = { x: from.x, y: from.y };

  pos.x = to.x;
  for (const wall of walls) {
    if (!overlaps(pos, radius, wall)) continue;
    if (to.x > from.x) pos.x = wall.minX - radius;
    else if (to.x < from.x) pos.x = wall.maxX + radius;
  }

  pos.y = to.y;
  for (const wall of walls) {
    if (!overlaps(pos, radius, wall)) continue;
    if (to.y > from.y) pos.y = wall.minZ - radius;
    else if (to.y < from.y) pos.y = wall.maxZ + radius;
  }

  return pos;
}

// A circle overlaps a box when its centre falls inside the box grown by the radius on every side
function overlaps(p: Vec2, radius: number, w: AABB): boolean {
  return (
    p.x > w.minX - radius &&
    p.x < w.maxX + radius &&
    p.y > w.minZ - radius &&
    p.y < w.maxZ + radius
  );
}
