import type { Vec2 } from "@/game/player/movement";
import type { Interactable } from "@/game/world/Interactable";
import { closestPoint, hasClearPath } from "@/game/interaction/visibility";
import type { AABB } from "@/game/world/collision";

// Find the nearest interactable within reach of the character that the current user is allowed to open
export function findNearest(
  position: Vec2,
  interactables: Interactable[],
  reach: number,
  canOpen: (toolId: string) => boolean,
  obstacles: AABB[] = []
): Interactable | null {
  let best: Interactable | null = null;
  let bestDistSq = reach * reach;
  for (const item of interactables) {
    if (!canOpen(item.toolId)) continue;
    const target = closestPoint(position, item.footprint);
    if (!hasClearPath(position, target, obstacles)) continue;
    const dx = target.x - position.x;
    const dz = target.y - position.y;
    const distSq = dx * dx + dz * dz;
    if (distSq <= bestDistSq) {
      bestDistSq = distSq;
      best = item;
    }
  }
  return best;
}
