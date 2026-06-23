import type { Vec2 } from "@/game/player/movement";
import type { Interactable } from "@/game/world/Interactable";

// Find the nearest interactable within reach of the character that the current user is allowed to open
export function findNearest(
  position: Vec2,
  interactables: Interactable[],
  reach: number,
  canOpen: (toolId: string) => boolean
): Interactable | null {
  let best: Interactable | null = null;
  let bestDistSq = reach * reach;
  for (const item of interactables) {
    if (!canOpen(item.toolId)) continue;
    const dx = item.position.x - position.x;
    const dz = item.position.y - position.y;
    const distSq = dx * dx + dz * dz;
    if (distSq <= bestDistSq) {
      bestDistSq = distSq;
      best = item;
    }
  }
  return best;
}
