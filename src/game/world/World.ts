import * as THREE from "three";
import { WALL } from "@/game/config/constants";
import { rooms } from "@/tools/registry";
import type { Vec2 } from "@/game/player/movement";
import { resolveCollision, type AABB } from "@/game/world/collision";
import { ROOM_RECTS, buildWalls } from "@/game/world/layout";
import { Interactable } from "@/game/world/Interactable";

// The house itself: walls (meshes + boxes) and interactables
// reads the room and tool list from the registry, so the house and the menu stay in step
export class World {
  readonly group = new THREE.Group();
  readonly walls: AABB[];
  readonly interactables: Interactable[] = [];

  constructor() {
    this.walls = buildWalls();
    this.buildWallMeshes();
    this.buildInteractables();
  }

  // Slide the player against the walls. Bound so it can be handed to the player as a plain callback.
  collide = (from: Vec2, to: Vec2, radius: number): Vec2 =>
    resolveCollision(from, to, radius, this.walls);

  interactableMeshes(): THREE.Object3D[] {
    return this.interactables.map((it) => it.object);
  }

  private buildWallMeshes() {
    const material = new THREE.MeshStandardMaterial({ color: WALL.colour });
    for (const wall of this.walls) {
      const width = wall.maxX - wall.minX;
      const depth = wall.maxZ - wall.minZ;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, WALL.height, depth), material);
      mesh.position.set((wall.minX + wall.maxX) / 2, WALL.height / 2, (wall.minZ + wall.maxZ) / 2);
      this.group.add(mesh);
    }
  }

  private buildInteractables() {
    for (const room of rooms) {
      const rect = ROOM_RECTS[room.id];
      if (!rect) continue;
      room.tools.forEach((tool, index) => {
        const { x, z } = placeInRoom(rect, index, room.tools.length);
        const interactable = new Interactable(tool.id, tool.title, x, z);
        this.interactables.push(interactable);
        this.group.add(interactable.object);
      });
    }
  }
}

// Space tools evenly across their room's width (centred front to back w/ a margin off the walls)
function placeInRoom(rect: AABB, index: number, count: number): { x: number; z: number } {
  const margin = 2.5;
  const innerMin = rect.minX + margin;
  const innerMax = rect.maxX - margin;
  const z = (rect.minZ + rect.maxZ) / 2;
  const x = count === 1 ? (rect.minX + rect.maxX) / 2 : innerMin + ((innerMax - innerMin) * index) / (count - 1);
  return { x, z };
}
