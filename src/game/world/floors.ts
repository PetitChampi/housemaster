import type { AABB } from "@/game/world/collision";
import type { RoomLayout, WallLayout } from "@/game/world/layout";

// Internal room boundaries already meet under their shared walls.
// Extend only the exterior edges, so the floor reaches the outside face without overlaps.
export function floorRegions(room: RoomLayout, walls: WallLayout[]): AABB[] {
  return (room.regions ?? [room.rect]).map((region) => {
    const bounds = { ...region };
    for (const wall of walls.filter((wall) => wall.exterior)) {
      const half = wall.thickness / 2;
      if (wall.from.x === wall.to.x) {
        if (Math.min(wall.from.y, wall.to.y) > region.minZ || Math.max(wall.from.y, wall.to.y) < region.maxZ) continue;
        if (wall.from.x === region.minX) bounds.minX = region.minX - half;
        if (wall.from.x === region.maxX) bounds.maxX = region.maxX + half;
      } else {
        if (Math.min(wall.from.x, wall.to.x) > region.minX || Math.max(wall.from.x, wall.to.x) < region.maxX) continue;
        if (wall.from.y === region.minZ) bounds.minZ = region.minZ - half;
        if (wall.from.y === region.maxZ) bounds.maxZ = region.maxZ + half;
      }
    }
    return bounds;
  });
}
