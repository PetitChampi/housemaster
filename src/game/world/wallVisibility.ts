import { WALL } from "@/game/config/constants";
import type { Vec2 } from "@/game/player/movement";
import { currentRoom, type WallLayout } from "@/game/world/layout";

export function wallOpacity(wall: WallLayout, position: Vec2): number {
  if (!wall.seeThrough || currentRoom(position)?.id !== wall.negativeRoom) return 1;
  return WALL.fadedOpacity;
}

// A corner can share its walls' fade only when every incident wall fades for the same room.
// Mixed corners retain their closed ends beside solid walls.
export function junctionFadeWall(walls: WallLayout[]): WallLayout | undefined {
  const first = walls[0];
  return first?.negativeRoom && walls.every((wall) => wall.seeThrough && wall.negativeRoom === first.negativeRoom)
    ? first : undefined;
}
