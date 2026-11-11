import type { Vec2 } from "@/game/player/movement";
import type { AABB } from "@/game/world/collision";

export function closestPoint(position: Vec2, bounds: AABB): Vec2 {
  return { x: Math.max(bounds.minX, Math.min(position.x, bounds.maxX)), y: Math.max(bounds.minZ, Math.min(position.y, bounds.maxZ)) };
}

export function hasClearPath(from: Vec2, to: Vec2, obstacles: AABB[]): boolean {
  return !obstacles.some((bounds) => {
    let enter = 0;
    let leave = 1;
    for (const [origin, delta, min, max] of [
      [from.x, to.x - from.x, bounds.minX, bounds.maxX],
      [from.y, to.y - from.y, bounds.minZ, bounds.maxZ],
    ]) {
      if (Math.abs(delta) < 0.000001) {
        if (origin < min || origin > max) return false;
      } else {
        const first = (min - origin) / delta;
        const second = (max - origin) / delta;
        enter = Math.max(enter, Math.min(first, second));
        leave = Math.min(leave, Math.max(first, second));
        if (enter > leave) return false;
      }
    }
    return enter < 1 - 0.00001 && leave > 0.00001;
  });
}
