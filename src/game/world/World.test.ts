import * as THREE from "three";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { INTERACTION, PLAYER, WALL } from "@/game/config/constants";
import { findNearest } from "@/game/interaction/proximity";
import type { Vec2 } from "@/game/player/movement";
import { World } from "@/game/world/World";
import { ENTRANCE, FURNITURE, NOOK_PARTITION_X, ROOMS, SPAWN, WALLS, currentRoom } from "@/game/world/layout";
import { toolsById } from "@/tools/registry";
import { canAccess } from "@/lib/roles";

vi.mock("@/game/world/textures", () => ({
  floorTexture: () => new THREE.Texture(),
  bathroomTileTexture: () => new THREE.Texture(),
  screenTexture: () => new THREE.Texture(),
  rattanTexture: () => new THREE.Texture(),
  decoratedWallTexture: () => new THREE.Texture(),
}));

let world: World;
let reachable: Vec2[];

beforeAll(() => {
  world = new World(1);
  reachable = reachablePositions(world);
});

function reachablePositions(world: World): Vec2[] {
  const spacing = 0.12;
  const queue = [{ x: 0, y: 0 }];
  const visited = new Set(["0,0"]);
  const points: Vec2[] = [];
  for (let index = 0; index < queue.length; index += 1) {
    const gridPoint = queue[index];
    const point = { x: SPAWN.x + gridPoint.x * spacing, y: SPAWN.y + gridPoint.y * spacing };
    points.push(point);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nextGrid = { x: gridPoint.x + dx, y: gridPoint.y + dz };
      const key = `${nextGrid.x},${nextGrid.y}`;
      if (visited.has(key)) continue;
      const next = { x: SPAWN.x + nextGrid.x * spacing, y: SPAWN.y + nextGrid.y * spacing };
      if (!currentRoom(next)) continue;
      const resolved = world.collide(point, next, PLAYER.radius);
      if (Math.abs(resolved.x - next.x) > 0.0001 || Math.abs(resolved.y - next.y) > 0.0001) continue;
      visited.add(key);
      queue.push(nextGrid);
    }
  }
  return points;
}

function object(id: string): THREE.Object3D {
  const result = world.group.getObjectByName(id);
  if (!result) throw new Error(`Missing furniture: ${id}`);
  return result;
}

describe("flat navigation", () => {
  it("lets the player walk from the entry to every room around the actual furniture", () => {
    const visitedRooms = new Set(reachable.map((point) => currentRoom(point)?.id));
    expect([...visitedRooms].sort()).toEqual(ROOMS.map((room) => room.id).sort());
  });

  it("connects every player-sized clear floor area to the entry", () => {
    const visited = new Set(reachable.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`));
    const isolated: Vec2[] = [];
    for (let x = -30; x <= 40; x += 1) {
      for (let z = -10; z <= 82; z += 1) {
        const point = { x: SPAWN.x + x * 0.12, y: SPAWN.y + z * 0.12 };
        if (!currentRoom(point)) continue;
        const blocked = world.walls.some((wall) => point.x > wall.minX - PLAYER.radius && point.x < wall.maxX + PLAYER.radius && point.y > wall.minZ - PLAYER.radius && point.y < wall.maxZ + PLAYER.radius);
        if (!blocked && !visited.has(`${point.x.toFixed(3)},${point.y.toFixed(3)}`)) isolated.push(point);
      }
    }
    expect(isolated).toEqual([]);
  });

  it("makes all nine interactables reachable from the entry", () => {
    for (const item of world.interactables) {
      const inReach = reachable.some((point) => findNearest(point, [item], INTERACTION.reach, () => true, world.interactionWalls) === item);
      expect(inReach, `${item.title} is blocked`).toBe(true);
    }
  });

  it("keeps the player inside the closed entrance", () => {
    let position = { ...SPAWN };
    for (let step = 0; step < 60; step += 1) {
      position = world.collide(position, { x: position.x, y: position.y - 0.05 }, PLAYER.radius);
    }
    expect(position.y).toBeCloseTo(ENTRANCE.z + 0.08 + PLAYER.radius);
  });

  it("blocks poster interactions from the living room even when its wall fades", () => {
    const poster = world.interactables.find((item) => item.toolId === "hobby-room_travel-log")!;
    const behindWall = { x: poster.position.x, y: 0.8 };
    expect(findNearest(behindWall, [poster], INTERACTION.reach, () => true, world.interactionWalls)).toBeNull();
    expect(world.isAccessible(behindWall, poster)).toBe(false);
    expect(world.isAccessible({ x: poster.position.x, y: 2 }, poster)).toBe(true);
  });

  it("lets the player cross every interior doorway in both directions", () => {
    for (const wall of WALLS.filter((candidate) => !candidate.exterior)) {
      for (const door of wall.openings?.filter((opening) => opening.kind === "door") ?? []) {
        const vertical = wall.from.x === wall.to.x;
        const centre = vertical ? { x: wall.from.x, y: door.centre } : { x: door.centre, y: wall.from.y };
        const offset = wall.thickness / 2 + PLAYER.radius + 0.05;
        for (const direction of [-1, 1]) {
          let position = { x: centre.x - (vertical ? direction * offset : 0), y: centre.y - (vertical ? 0 : direction * offset) };
          for (let step = 0; step < 20; step += 1) {
            position = world.collide(position, {
              x: position.x + (vertical ? direction * offset / 10 : 0),
              y: position.y + (vertical ? 0 : direction * offset / 10),
            }, PLAYER.radius);
          }
          expect(vertical ? position.x : position.y, wall.id).toBeCloseTo((vertical ? centre.x : centre.y) + direction * offset);
        }
      }
    }
  });
});

describe("furniture corrections", () => {
  it("uses one pillow on each bed and a single-width bedroom bed", () => {
    for (const bed of FURNITURE.filter((item) => item.builder === "bed")) {
      const pillows: THREE.Object3D[] = [];
      object(bed.id).traverse((child) => { if (child.name === "pillow") pillows.push(child); });
      expect(pillows).toHaveLength(1);
    }
    const bed = new THREE.Box3().setFromObject(object("bedroom-bed"));
    expect(bed.max.x - bed.min.x).toBeCloseTo(0.92);
    const nookBed = new THREE.Box3().setFromObject(object("nook-bed"));
    expect(nookBed.max.z - nookBed.min.z).toBeGreaterThan(bed.max.z - bed.min.z);
    expect(nookBed.max.z).toBeCloseTo(5.245);
  });

  it("faces the desk chair towards the desk in the bedroom corner", () => {
    const desk = object("craft-desk");
    const chair = object("desk-chair");
    const front = new THREE.Vector3(0, 0, 1).applyQuaternion(chair.quaternion);
    const towardsDesk = desk.position.clone().sub(chair.position).normalize();
    expect(front.dot(towardsDesk)).toBeGreaterThan(0.99);
    expect(world.group.getObjectByName("bedroom-bookcase")).toBeUndefined();
  });

  it("places the travel poster above the shorter shelving without overlapping the tallest column", () => {
    const shelving = object("bedroom-shelving");
    const poster = new THREE.Box3().setFromObject(object("travel-poster"));
    expect(shelving.children.map((child) => child.name)).toEqual(["shelving-1x4", "shelving-1x3", "shelving-1x2"]);
    for (const column of shelving.children) {
      const bounds = new THREE.Box3().setFromObject(column);
      expect(poster.intersectsBox(bounds)).toBe(false);
      if (column.name === "shelving-1x4") expect(poster.min.x).toBeGreaterThan(bounds.max.x);
      else expect(poster.min.y).toBeGreaterThan(bounds.max.y);
    }
  });

  it("keeps the nook board below the high window", () => {
    const board = new THREE.Box3().setFromObject(object("kanban-board"));
    const window = WALLS.find((wall) => wall.id === "west-nook")?.openings?.[0];
    expect(board.max.y).toBeLessThan(window?.sill ?? 0);
  });

  it("eases whole walls on room entry and restores them on the other side", () => {
    const wall = object("living-bedroom");
    expect(wall.scale.y).toBe(1);
    expect(new THREE.Box3().setFromObject(wall).max.y).toBeCloseTo(WALL.height);
    const materials: THREE.Material[] = [];
    wall.traverse((child) => {
      if (child instanceof THREE.Mesh && !child.userData.shadowProxy) {
        expect(child.name).toBe("wall-solid");
        expect(child.geometry.boundingBox?.max.y).toBeCloseTo(WALL.height);
        materials.push(...(Array.isArray(child.material) ? child.material : [child.material]));
      }
    });
    expect(materials.length).toBeGreaterThan(0);
    world.updateVisibility({ x: 1.2, y: 2 }, 2);
    world.updateVisibility({ x: 0.2, y: -2 }, 1 / 60);
    expect(materials.every((material) => material.opacity > WALL.fadedOpacity && material.opacity < 1)).toBe(true);
    world.updateVisibility({ x: 0.2, y: -2 }, 2);
    expect(materials.every((material) => Math.abs(material.opacity - WALL.fadedOpacity) < 0.001)).toBe(true);
    world.updateVisibility({ x: 1.2, y: 2 }, 2);
    expect(materials.every((material) => material.opacity > 0.999)).toBe(true);
  });

  it("fits the nook bed and its half-width cabinet between the side walls", () => {
    const bed = new THREE.Box3().setFromObject(object("nook-bed"));
    const cabinet = new THREE.Box3().setFromObject(object("nook-cabinet"));
    const room = ROOMS.find((room) => room.id === "nook")!;
    expect(bed.max.x).toBeCloseTo(cabinet.min.x);
    expect(cabinet.max.x).toBeCloseTo(room.rect.maxX - 0.06);
    expect(bed.min.x).toBeCloseTo(room.rect.minX + 0.08);
    expect(cabinet.max.x - cabinet.min.x).toBeCloseTo((bed.max.x - bed.min.x) / 2);
    expect(cabinet.min.z).toBeLessThanOrEqual(bed.min.z);
    expect(cabinet.max.z).toBeCloseTo(bed.max.z, 2);
    expect(cabinet.max.y).toBeLessThan(1.3);
    const table = new THREE.Box3().setFromObject(object("accounting-table"));
    expect(table.max.z).toBeCloseTo(cabinet.min.z, 2);
    expect(table.max.x).toBeGreaterThan(cabinet.min.x);
    expect(table.max.x).toBeCloseTo(room.rect.maxX - 0.06);
  });

  it("fades shared room corners and keeps mixed corners closed through every room transition", () => {
    const junctions = world.group.children.filter((child) => child.name === "wall-junction") as THREE.Mesh[];
    expect(junctions.length).toBeGreaterThan(0);
    for (const room of ROOMS) {
      const rect = (room.regions ?? [room.rect])[0];
      world.updateVisibility({ x: (rect.minX + rect.maxX) / 2, y: (rect.minZ + rect.maxZ) / 2 }, 2);
      for (const junction of junctions) {
        const walls = WALLS.filter((wall) => (junction.userData.wallIds as string[]).includes(wall.id));
        const faded = walls.every((wall) => wall.seeThrough && wall.negativeRoom === room.id);
        const shadow = junction.getObjectByName("junction-shadow") as THREE.Mesh;
        expect(shadow.castShadow).toBe(!faded);
        for (const material of junction.material as THREE.Material[]) {
          expect(material.opacity).toBeCloseTo(faded ? WALL.fadedOpacity : 1);
          expect(material.depthWrite).toBe(!faded);
        }
      }
      for (const layout of WALLS) {
        const wall = object(layout.id);
        const shadow = wall.getObjectByName("wall-shadow") as THREE.Mesh;
        const material = shadow.material as THREE.Material;
        expect(material.colorWrite).toBe(false);
        expect(material.depthWrite).toBe(false);
        expect(shadow.castShadow).toBe(!(layout.seeThrough && layout.negativeRoom === room.id));
        wall.traverse((child) => {
          if (child instanceof THREE.Mesh && !child.userData.shadowProxy) expect(child.castShadow).toBe(false);
        });
      }
    }
  });

  it("keeps the bedroom and bathroom corner opacity identical to their walls throughout the fade", () => {
    for (const [wallId, neighbourId, position] of [
      ["south-bedroom", "east-bedroom", { x: 1.1, y: 3 }],
      ["bathroom-living", "bathroom-projection", { x: -2.4, y: -3.8 }],
      ["bathroom-entry-return", "bathroom-projection", { x: -2.4, y: -3.8 }],
    ] as const) {
      const corner = world.group.children.find((child) => child instanceof THREE.Mesh && child.name === "wall-junction" &&
        (child.userData.wallIds as string[]).includes(wallId) &&
        (child.userData.wallIds as string[]).includes(neighbourId)) as THREE.Mesh;
      expect(corner).toBeDefined();
      const wall = object(wallId).getObjectByName("wall-solid") as THREE.Mesh;
      world.updateVisibility({ x: 10, y: 10 }, 2);
      for (let frame = 0; frame < 30; frame += 1) {
        world.updateVisibility(position, 1 / 60);
        for (const material of corner.material as THREE.Material[]) {
          expect(material.opacity).toBeCloseTo((wall.material as THREE.Material[])[0].opacity, 8);
        }
      }
    }
  });

  it("fades the cabinet with the nook walls and restores it outside the nook", () => {
    const meshes: THREE.Mesh[] = [];
    object("nook-cabinet").traverse((child) => { if (child instanceof THREE.Mesh) meshes.push(child); });
    world.updateVisibility({ x: -2.4, y: 2.6 }, 2);
    for (const mesh of meshes) expect((mesh.material as THREE.Material).opacity).toBeCloseTo(WALL.fadedOpacity);
    world.updateVisibility({ x: -2.4, y: 0.5 }, 2);
    for (const mesh of meshes) expect((mesh.material as THREE.Material).opacity).toBeCloseTo(1);
  });

  it("joins all three divider panels at their hinges and anchors the first to the corner", () => {
    const divider = object("nook-divider");
    const panelWidth = FURNITURE.find((item) => item.id === "nook-divider")!.width! / 3;
    const ends = divider.children.map((panel) => ({
      start: panel.localToWorld(new THREE.Vector3(panelWidth / 2, 0, 0)),
      end: panel.localToWorld(new THREE.Vector3(-panelWidth / 2, 0, 0)),
    }));
    expect(ends).toHaveLength(3);
    expect(ends[0].start.distanceTo(new THREE.Vector3(NOOK_PARTITION_X - 0.06, 0, 1.125))).toBeLessThan(0.001);
    expect(ends[0].end.distanceTo(ends[1].start)).toBeLessThan(0.001);
    expect(ends[1].end.distanceTo(ends[2].start)).toBeLessThan(0.001);
    expect(ends[2].end.z).toBeCloseTo(ends[0].start.z);
    const dividerBounds = new THREE.Box3().setFromObject(divider);
    const nook = ROOMS.find((room) => room.id === "nook")!;
    expect(dividerBounds.min.x - (nook.rect.minX + 0.08)).toBeGreaterThan(PLAYER.radius * 2 + 0.2);
  });

  it("leaves room to sit in the dining chair with its back close to the outside wall", () => {
    const chair = object("dining-chair-east");
    const bounds = new THREE.Box3().setFromObject(chair);
    const wall = WALLS.find((wall) => wall.id === "east-living")!;
    const gap = wall.from.x - wall.thickness / 2 - bounds.max.x;
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(0.1);
    expect(reachable.some((point) => Math.hypot(point.x - chair.position.x, point.y - chair.position.z) < 0.12)).toBe(true);
  });

  it("places the rattan box before the shelving and the three guitars at the foot of the bed", () => {
    const box = new THREE.Box3().setFromObject(object("bedroom-rattan-box"));
    const shelf = new THREE.Box3().setFromObject(object("bedroom-shelving"));
    const bed = new THREE.Box3().setFromObject(object("bedroom-bed"));
    const rack = object("bedroom-guitars");
    const rackBounds = new THREE.Box3().setFromObject(rack);
    expect(box.min.x).toBeGreaterThan(NOOK_PARTITION_X + 0.06);
    expect(box.max.x).toBeLessThan(shelf.min.x);
    expect(rackBounds.min.z).toBeGreaterThan(box.max.z);
    expect(rackBounds.max.z).toBeLessThan(bed.min.z);
    expect(bed.min.z - rackBounds.max.z).toBeLessThan(0.1);
    const guitars = rack.children.filter((child) => child.name.startsWith("electric-guitar-"));
    expect(guitars).toHaveLength(3);
    const dividers = rack.children.filter((child) => child.name === "padded-divider").sort((a, b) => a.position.x - b.position.x);
    expect(dividers).toHaveLength(4);
    for (const [index, guitar] of guitars.entries()) {
      const base = guitar.localToWorld(new THREE.Vector3(0, 0.2, 0));
      const head = guitar.localToWorld(new THREE.Vector3(0, 1, 0));
      expect(head.z).toBeGreaterThan(base.z);
      expect(head.z).toBeLessThan(bed.min.z);
      const front = new THREE.Vector3(0, 0, 1).applyQuaternion(guitar.quaternion);
      expect(front.x).toBeCloseTo(1);
      const guitarBounds = new THREE.Box3().setFromObject(guitar);
      expect(guitarBounds.max.x - guitarBounds.min.x).toBeLessThan(0.08);
      expect(guitar.position.x).toBeGreaterThan(dividers[index].position.x + 0.015);
      expect(guitar.position.x).toBeLessThan(dividers[index + 1].position.x - 0.015);
      const slotWidth = dividers[index + 1].position.x - dividers[index].position.x - 0.03;
      expect(slotWidth).toBeGreaterThan(0.04);
    }
  });

  it("paints the sealed door on the wall itself so it fades without extra layers", () => {
    expect(world.group.getObjectByName("bedroom-sealed-door")).toBeUndefined();
    const wall = WALLS.find((wall) => wall.id === "nook-bedroom")!;
    const door = wall.doorDecoration!;
    const mesh = object(wall.id).getObjectByName("wall-solid") as THREE.Mesh;
    const materials = mesh.material as THREE.MeshStandardMaterial[];
    expect(materials[0].map).toBeInstanceOf(THREE.Texture);
    expect(materials[1].map).toBeInstanceOf(THREE.Texture);
    world.updateVisibility({ x: -2.4, y: 2.6 }, 2);
    expect(materials[0].opacity).toBeCloseTo(WALL.fadedOpacity);
    expect(materials[1].opacity).toBeCloseTo(WALL.fadedOpacity);
    const rack = new THREE.Box3().setFromObject(object("bedroom-guitars"));
    const box = new THREE.Box3().setFromObject(object("bedroom-rattan-box"));
    expect(door.centre + door.width / 2).toBeLessThan(rack.min.z);
    expect(door.centre - door.width / 2).toBeGreaterThan(box.max.z - 0.1);
    expect(door.width).toBeLessThan(ENTRANCE.width);
    expect(mesh.userData.interactable).toBeUndefined();
    const from = { x: NOOK_PARTITION_X + 0.5, y: door.centre };
    let position = from;
    for (let step = 0; step < 30; step += 1) position = world.collide(position, { x: position.x - 0.04, y: position.y }, PLAYER.radius);
    expect(position.x).toBeCloseTo(NOOK_PARTITION_X + 0.06 + PLAYER.radius);
  });

  it("leaves a reachable chair position facing the accounting table and preserves admin access", () => {
    const chair = object("nook-chair");
    const table = object("accounting-table");
    const front = new THREE.Vector3(0, 0, 1).applyQuaternion(chair.quaternion);
    expect(front.dot(table.position.clone().sub(chair.position).normalize())).toBeGreaterThan(0.99);
    const tableFront = new THREE.Vector3(0, 0, 1).applyQuaternion(table.quaternion);
    expect(tableFront.z).toBeCloseTo(-1);
    const atChair = { x: chair.position.x, y: chair.position.z };
    expect(reachable.some((point) => Math.hypot(point.x - atChair.x, point.y - atChair.y) < 0.12)).toBe(true);
    const toolId = "study_accounting-hub";
    const accounting = world.interactables.find((item) => item.toolId === toolId)!;
    const canOpen = (id: string) => canAccess("ADMIN", toolsById[id].minRole);
    expect(findNearest(atChair, world.interactables, INTERACTION.reach, canOpen, world.interactionWalls)).toBe(accounting);
    expect(world.isAccessible(atChair, accounting)).toBe(true);
    expect(canOpen(toolId)).toBe(true);
    expect(canAccess("GUEST", toolsById[toolId].minRole)).toBe(false);
  });

  it("fills the bathroom recess with the bath and lets the piano project past its shorter wall", () => {
    const bath = new THREE.Box3().setFromObject(object("bath"));
    const projection = WALLS.find((wall) => wall.id === "bathroom-projection")!;
    const bathroom = ROOMS.find((room) => room.id === "bathroom")!;
    expect(bath.min.x).toBeCloseTo(bathroom.rect.minX + 0.08);
    expect(bath.max.x).toBeCloseTo(bathroom.rect.maxX - 0.06);
    expect(bath.min.z).toBeCloseTo(projection.from.y + 0.06);
    expect(bath.max.z).toBeCloseTo(projection.to.y - 0.06);
    const piano = new THREE.Box3().setFromObject(object("piano"));
    const panel = new THREE.Box3().setFromObject(object("bathroom-entry-return"));
    expect(piano.min.z - panel.max.z).toBeGreaterThan(0.03);
    expect(piano.intersectsBox(panel)).toBe(false);
    expect(piano.max.z).toBeGreaterThan(projection.to.y);
    const washer = new THREE.Box3().setFromObject(object("washer"));
    const divider = WALLS.find((wall) => wall.id === "bathroom-divider")!;
    expect(divider.to.y - washer.max.z).toBeGreaterThan(0);
    expect(divider.to.y - washer.max.z).toBeLessThan(0.15);
  });

  it("fits the reference cabinet, splashback, shelf and towel rail around the moved sink", () => {
    const sink = object("bathroom-sink");
    const cabinet = sink.getObjectByName("mirror-cabinet")!;
    expect(cabinet.children.filter((child) => child.name.startsWith("mirror-door-"))).toHaveLength(3);
    const drawers = cabinet.children.filter((child) => child.name.startsWith("cabinet-drawer-"));
    expect(drawers).toHaveLength(2);
    const top = new THREE.Box3().setFromObject(cabinet.getObjectByName("cabinet-top-bar")!);
    const drawer = new THREE.Box3().setFromObject(drawers[0]);
    expect(top.max.y - top.min.y).toBeCloseTo(drawer.max.y - drawer.min.y);
    const cabinetBounds = new THREE.Box3().setFromObject(cabinet);
    const basin = new THREE.Box3().setFromObject(sink.getObjectByName("basin")!);
    const shelf = new THREE.Box3().setFromObject(sink.getObjectByName("basin-shelf")!);
    const tiles = new THREE.Box3().setFromObject(sink.getObjectByName("basin-tiles")!);
    expect(shelf.min.y).toBeGreaterThan(basin.max.y);
    expect(shelf.max.y).toBeLessThan(cabinetBounds.min.y);
    expect(tiles.min.y).toBeLessThan(basin.max.y);
    expect(tiles.max.y).toBeGreaterThan(cabinetBounds.min.y);
    const rail = new THREE.Box3().setFromObject(object("bathroom-towel-rail"));
    const bath = new THREE.Box3().setFromObject(object("bath"));
    expect(rail.min.z).toBeGreaterThan(basin.max.z);
    expect(rail.max.z).toBeLessThan(bath.min.z);
    const bar = new THREE.Box3().setFromObject(object("bathroom-towel-rail").getObjectByName("towel-bar")!);
    expect(Math.abs(bar.getCenter(new THREE.Vector3()).y - basin.max.y)).toBeLessThan(0.05);
    expect(bar.max.x - bar.min.x).toBeGreaterThan(0.4);
    expect(bar.max.z - bar.min.z).toBeLessThan(0.03);
    const towel = new THREE.Box3().setFromObject(object("bathroom-towel-rail").getObjectByName("hanging-towel")!);
    expect(towel.max.x - towel.min.x).toBeGreaterThan(0.35);
    expect(towel.max.z - towel.min.z).toBeLessThan(0.02);
    expect(object("bathroom-towel-rail").children.filter((child) => child.name === "towel-wall-mount")).toHaveLength(1);
  });

  it("joins both counter worktops and keeps the small fridge under the long run", () => {
    const long = new THREE.Box3().setFromObject(object("kitchen-counter").getObjectByName("counter-worktop")!);
    const short = new THREE.Box3().setFromObject(object("kitchen-sink").getObjectByName("counter-worktop")!);
    const hob = new THREE.Box3().setFromObject(object("kitchen-hob").getObjectByName("counter-worktop")!);
    expect(long.max.x).toBeCloseTo(short.min.x, 6);
    expect(hob.max.x).toBeCloseTo(long.min.x, 6);
    expect(short.min.z).toBeCloseTo(long.min.z, 6);
    for (const [a, b] of [[hob, long], [long, short], [hob, short]]) {
      const overlap = Math.max(0, Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x)) * Math.max(0, Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z));
      expect(overlap).toBeLessThan(1e-7);
    }
    expect(object("kitchen-counter").getObjectByName("undercounter-fridge")).toBeDefined();
    expect(world.group.getObjectByName("kitchen-fridge")).toBeUndefined();
    expect(world.group.getObjectByName("bathroom-cabinet")).toBeUndefined();
  });

  it("bakes the bath tiling into its wall face without a second fading layer", () => {
    expect(world.group.getObjectByName("bath-tiles")).toBeUndefined();
    for (const id of ["bathroom-divider", "north-bathroom"]) {
      const mesh = object(id).getObjectByName("wall-solid") as THREE.Mesh;
      expect((mesh.material as THREE.MeshStandardMaterial[]).every((material) => !material.map)).toBe(true);
    }
    const bathWall = object("bathroom-living").getObjectByName("wall-solid") as THREE.Mesh;
    const faces = bathWall.material as THREE.MeshStandardMaterial[];
    expect(faces[0].map).toBeNull();
    expect(faces[1].map).toBeInstanceOf(THREE.Texture);
  });
});
