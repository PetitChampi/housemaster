import * as THREE from "three";
import type { FurnitureLayout } from "@/game/world/layout";
import { bathroomTileTexture } from "@/game/world/textures";
import { box, cylinder, material } from "@/game/world/furniture/helpers";

const WHITE = 0xf4f2ec;
const CHROME = 0xa7adaf;

export function buildBathroomSink(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 0.5;
  const depth = item.depth ?? 0.42;
  const colour = item.colour ?? WHITE;
  const basin = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14), material(colour, 0.3));
  basin.name = "basin";
  basin.scale.set(width / 2, 0.085, depth / 2);
  basin.position.y = 0.73;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), material(0xd8e0e1, 0.2));
  bowl.scale.set(width * 0.38, 0.018, depth * 0.36);
  bowl.position.set(0, 0.805, 0.02);
  group.add(cylinder(0.085, 0.67, colour, 0, 0.335), basin, bowl);

  const tap = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.8, -0.12), new THREE.Vector3(0, 0.99, -0.12),
    new THREE.Vector3(0, 1.03, -0.06), new THREE.Vector3(0, 0.97, -0.015),
  ]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(tap, 18, 0.012, 8, false), material(CHROME, 0.2, 0.45)));
  for (const x of [-0.065, 0.065]) {
    group.add(cylinder(0.014, 0.06, CHROME, x, 0.83, -0.11, 10), box(0.045, 0.01, 0.012, CHROME, x, 0.865, -0.11));
  }

  const wallBack = -depth / 2 - 0.008;
  const tiles = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.64, 0.006),
    new THREE.MeshStandardMaterial({ map: bathroomTileTexture(0.72, 0.64, 4), roughness: 0.6 })
  );
  tiles.name = "basin-tiles";
  tiles.position.set(0, 1.12, wallBack + 0.006);
  group.add(tiles);

  const shelf = box(0.66, 0.025, 0.15, WHITE, 0, 1.18, wallBack + 0.08);
  shelf.name = "basin-shelf";
  group.add(shelf, buildMirrorCabinet(wallBack));
  return group;
}

function buildMirrorCabinet(wallBack: number): THREE.Group {
  const cabinet = new THREE.Group();
  cabinet.name = "mirror-cabinet";
  const width = 0.64;
  const depth = 0.11;
  const bottom = 1.41;
  const height = 0.78;
  cabinet.add(box(width, height, depth, WHITE, 0, bottom + height / 2, wallBack + depth / 2));
  const top = box(width, 0.1, depth + 0.015, WHITE, 0, bottom + height - 0.05, wallBack + depth / 2);
  top.name = "cabinet-top-bar";
  cabinet.add(top);
  for (let index = 0; index < 2; index += 1) {
    const drawer = box(width / 2 - 0.006, 0.1, 0.015, WHITE, (index - 0.5) * width / 2, bottom + 0.05, wallBack + depth + 0.004);
    drawer.name = `cabinet-drawer-${index + 1}`;
    cabinet.add(drawer);
  }
  const doorWidth = (width - 0.016) / 3;
  for (let index = 0; index < 3; index += 1) {
    const door = new THREE.Group();
    door.name = `mirror-door-${index + 1}`;
    door.position.set((index - 1) * doorWidth, bottom + height / 2, wallBack + depth + 0.004);
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth - 0.01, height - 0.212), material(0xb6c3c5, 0.16, 0.12));
    mirror.position.z = 0.009;
    door.add(box(doorWidth - 0.003, height - 0.2, 0.014, CHROME, 0, 0), mirror);
    cabinet.add(door);
  }
  return cabinet;
}

export function buildTowelRail(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const length = item.depth ?? 0.44;
  const height = item.mountingHeight ?? 0.82;
  const mount = box(0.055, 0.075, 0.025, WHITE, 0, height, 0.0125);
  mount.name = "towel-wall-mount";
  const rail = cylinder(0.012, length, CHROME, 0, height, 0.02 + length / 2, 12);
  rail.rotation.x = Math.PI / 2;
  rail.name = "towel-bar";
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), material(CHROME));
  tip.position.set(0, height, length + 0.02);
  group.add(mount, rail, tip);
  const cloth = new THREE.PlaneGeometry(length * 0.85, 0.36, 10, 10);
  const positions = cloth.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    positions.setZ(index, Math.sin(positions.getX(index) / length * Math.PI * 8) * 0.006);
  }
  cloth.computeVertexNormals();
  const towel = new THREE.Mesh(cloth, new THREE.MeshStandardMaterial({ color: item.colour ?? 0x929caa, roughness: 1, side: THREE.DoubleSide }));
  towel.name = "hanging-towel";
  towel.rotation.y = Math.PI / 2;
  towel.position.set(0.014, height - 0.17, 0.02 + length / 2);
  group.add(towel);
  return group;
}
