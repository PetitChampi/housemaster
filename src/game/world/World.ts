import * as THREE from "three";
import type { Vec2 } from "@/game/player/movement";
import { resolveCollision, type AABB } from "@/game/world/collision";
import {
  FURNITURE,
  ROOMS,
  WALLS,
  buildVisualWalls,
  buildWalls,
  SPAWN,
  type RoomId,
  type WallLayout,
  type WallPaint,
} from "@/game/world/layout";
import { Interactable } from "@/game/world/Interactable";
import { buildFurniture } from "@/game/world/furniture/builders";
import { decoratedWallTexture, floorTexture } from "@/game/world/textures";
import { floorRegions } from "@/game/world/floors";
import { RoomFades } from "@/game/world/RoomFades";
import { buildWallGeometries } from "@/game/world/wallGeometry";
import { closestPoint, hasClearPath } from "@/game/interaction/visibility";

const PAINT_COLOURS: Record<WallPaint, number> = {
  white: 0xf1efea,
  sage: 0xb7c5b6,
  salmon: 0xd9a08f,
};

export class World {
  readonly group = new THREE.Group();
  readonly walls: AABB[];
  readonly interactables: Interactable[] = [];
  readonly interactionWalls: AABB[];
  private readonly fades = new RoomFades();

  constructor(private readonly anisotropy: number) {
    this.walls = buildWalls();
    this.interactionWalls = [...this.walls];
    this.buildFloors();
    this.buildWallMeshes();
    this.buildFurniture();
    this.updateVisibility(SPAWN, 1);
  }

  collide = (from: Vec2, to: Vec2, radius: number): Vec2 =>
    resolveCollision(from, to, radius, this.walls);

  interactableMeshes(): THREE.Object3D[] {
    return this.interactables.map((item) => item.object);
  }

  isAccessible(position: Vec2, item: Interactable): boolean {
    return hasClearPath(position, closestPoint(position, item.footprint), this.interactionWalls);
  }

  updateVisibility(position: Vec2, dt: number) {
    this.fades.update(position, dt);
  }

  private buildFloors() {
    for (const room of ROOMS) {
      for (const rect of floorRegions(room, WALLS)) {
        const width = rect.maxX - rect.minX;
        const depth = rect.maxZ - rect.minZ;
        const texture = floorTexture(room.floor, width, depth, this.anisotropy, rect.minX, rect.maxZ);
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(width, depth),
          new THREE.MeshStandardMaterial({ map: texture, roughness: 0.82 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set((rect.minX + rect.maxX) / 2, 0.002, (rect.minZ + rect.maxZ) / 2);
        floor.receiveShadow = true;
        this.group.add(floor);
      }
    }
  }

  private buildWallMeshes() {
    const visualPieces = buildVisualWalls();
    const geometries = buildWallGeometries(WALLS);
    const shadowMaterial = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, shadowSide: THREE.DoubleSide });
    for (const { geometry, shadowGeometry, wallIds, fadeWithWall } of geometries.junctions) {
      const indices = [...new Set(geometry.groups.map((group) => group.materialIndex!))];
      const materials = indices.map((index) => {
        const wall = WALLS[Math.floor(index / 3)];
        return index % 3 === 2
          ? new THREE.MeshStandardMaterial({ color: 0xe5e1db, roughness: 0.86 })
          : this.wallFaceMaterial(index % 3 === 0 ? wall.positiveRoom : wall.negativeRoom, wall);
      });
      for (const group of geometry.groups) group.materialIndex = indices.indexOf(group.materialIndex!);
      const junction = new THREE.Mesh(geometry, materials);
      junction.name = "wall-junction";
      junction.userData.wallIds = wallIds;
      junction.receiveShadow = true;
      const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      shadow.name = "junction-shadow";
      shadow.userData.shadowProxy = true;
      shadow.castShadow = true;
      junction.add(shadow);
      if (fadeWithWall) this.registerFadingObject(junction, fadeWithWall);
      this.group.add(junction);
    }
    for (const wall of WALLS) {
      const wallGroup = new THREE.Group();
      wallGroup.name = wall.id;
      const mesh = new THREE.Mesh(geometries.walls.get(wall.id), [
        this.wallFaceMaterial(wall.positiveRoom, wall),
        this.wallFaceMaterial(wall.negativeRoom, wall),
        new THREE.MeshStandardMaterial({ color: 0xe5e1db, roughness: 0.86 }),
      ]);
      mesh.name = "wall-solid";
      mesh.receiveShadow = true;
      wallGroup.add(mesh);
      const shadow = new THREE.Mesh(geometries.shadows.get(wall.id), shadowMaterial);
      shadow.name = "wall-shadow";
      shadow.userData.shadowProxy = true;
      shadow.castShadow = true;
      wallGroup.add(shadow);
      for (const piece of visualPieces.filter((piece) => piece.wallId === wall.id && piece.glass)) {
        wallGroup.add(this.createGlass(piece.bounds, piece.bottom, piece.height));
      }
      if (wall.seeThrough) this.registerFadingObject(wallGroup, wall);
      this.group.add(wallGroup);
    }
  }

  private registerFadingObject(group: THREE.Object3D, wall: WallLayout) {
    if (wall.negativeRoom) this.fades.add(group, wall.negativeRoom);
  }

  private wallFaceMaterial(roomId: RoomId | undefined, wall?: WallLayout): THREE.MeshStandardMaterial {
    const room = ROOMS.find((candidate) => candidate.id === roomId);
    const colour = room ? PAINT_COLOURS[room.wallPaint] : 0xe5e1db;
    const tiling = roomId === "bathroom" && !!wall?.bathroomTiling;
    return new THREE.MeshStandardMaterial(wall && (wall.doorDecoration || tiling)
      ? { map: decoratedWallTexture(wall, colour, this.anisotropy, tiling), roughness: 0.88 }
      : { color: colour, roughness: 0.88 });
  }

  private createGlass(bounds: AABB, bottom: number, height: number): THREE.Mesh {
    const width = Math.max(0.025, bounds.maxX - bounds.minX - 0.045);
    const depth = Math.max(0.025, bounds.maxZ - bounds.minZ - 0.045);
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshPhysicalMaterial({
        color: 0xcbe4e8,
        transparent: true,
        opacity: 0.26,
        roughness: 0.12,
        transmission: 0.3,
        depthWrite: false,
      })
    );
    glass.position.set((bounds.minX + bounds.maxX) / 2, bottom + height / 2, (bounds.minZ + bounds.maxZ) / 2);
    return glass;
  }

  private buildFurniture() {
    for (const placement of FURNITURE) {
      const object = buildFurniture(placement);
      this.group.add(object);

      let footprint: AABB;
      if (placement.toolId && placement.title) {
        const interactable = new Interactable(placement.toolId, placement.title, object);
        this.interactables.push(interactable);
        footprint = interactable.footprint;
      } else {
        const bounds = new THREE.Box3().setFromObject(object);
        footprint = { minX: bounds.min.x, maxX: bounds.max.x, minZ: bounds.min.z, maxZ: bounds.max.z };
      }
      if (placement.collision) this.walls.push(footprint);
      if (placement.builder === "divider") this.interactionWalls.push(footprint);
      if (placement.fadeWithWall) {
        const wall = WALLS.find((wall) => wall.id === placement.fadeWithWall);
        if (wall) this.registerFadingObject(object, wall);
      }
    }
  }
}
