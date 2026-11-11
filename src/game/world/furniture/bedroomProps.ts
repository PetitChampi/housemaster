import * as THREE from "three";
import type { FurnitureLayout } from "@/game/world/layout";
import { rattanTexture } from "@/game/world/textures";
import { box, cylinder, material } from "@/game/world/furniture/helpers";

export function buildRattanBox(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 0.84;
  const depth = item.depth ?? 0.68;
  const height = item.height ?? 0.48;
  const body = new THREE.Mesh(new THREE.BoxGeometry(width - 0.02, height - 0.045, depth - 0.02), [
    [depth, height], [depth, height], [width, depth], [width, depth], [width, height], [width, height],
  ].map(([w, h]) => new THREE.MeshStandardMaterial({ map: rattanTexture(w, h), roughness: 0.95 })));
  body.position.y = (height - 0.045) / 2;
  body.name = "woven-rattan";
  const lid = new THREE.Mesh(new THREE.BoxGeometry(width, 0.045, depth), new THREE.MeshStandardMaterial({ map: rattanTexture(width, depth), roughness: 0.95 }));
  lid.position.y = height - 0.0225;
  group.add(body, lid, box(width, 0.012, depth, item.colour ?? 0xcbb18a, 0, height - 0.05));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 16), material(0x92774f));
  handle.scale.x = 2;
  handle.position.set(0, height * 0.65, depth / 2);
  group.add(handle);
  return group;
}

export function buildGuitarRack(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 0.64;
  const depth = item.depth ?? 0.54;
  const steel = 0x292a2c;
  const padding = 0x454348;
  for (const x of [-width / 2 + 0.025, width / 2 - 0.025]) {
    const foot = cylinder(0.025, depth, steel, x, 0.06, 0, 10);
    foot.rotation.x = Math.PI / 2;
    group.add(foot, cylinder(0.022, 0.71, steel, x, 0.395, 0.15, 10));
  }
  for (const [y, z] of [[0.13, -0.15], [0.13, 0.17], [0.75, 0.15]]) {
    const bar = cylinder(0.028, width, padding, 0, y, z, 12);
    bar.rotation.z = Math.PI / 2;
    group.add(bar);
  }
  const spacing = width * 0.3;
  for (let index = 0; index < 4; index += 1) {
    const divider = cylinder(0.015, 0.22, padding, (index - 1.5) * spacing, 0.75, 0.04, 10);
    divider.name = "padded-divider";
    divider.rotation.x = Math.PI / 2;
    group.add(divider);
  }
  for (const [index, colour] of [0x70283b, 0xe5cf9c, 0x252527].entries()) {
    const x = (index - 1) * spacing;
    const guitar = buildElectricGuitar(colour);
    guitar.name = `electric-guitar-${index + 1}`;
    guitar.position.set(x, 0.05, -0.035);
    guitar.rotation.set(0.16, Math.PI / 2, 0);
    group.add(guitar);
  }
  return group;
}

function buildElectricGuitar(colour: number): THREE.Group {
  const group = new THREE.Group();
  const outline = new THREE.Shape();
  outline.moveTo(0, 0);
  outline.bezierCurveTo(-0.15, 0, -0.15, 0.14, -0.09, 0.18);
  outline.bezierCurveTo(-0.065, 0.22, -0.12, 0.28, -0.075, 0.35);
  outline.quadraticCurveTo(-0.055, 0.365, -0.043, 0.25);
  outline.lineTo(-0.027, 0.28);
  outline.lineTo(0.027, 0.28);
  outline.bezierCurveTo(0.045, 0.36, 0.10, 0.35, 0.07, 0.23);
  outline.bezierCurveTo(0.055, 0.20, 0.08, 0.16, 0.105, 0.14);
  outline.bezierCurveTo(0.16, 0.03, 0.12, 0, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(outline, { depth: 0.04, steps: 1, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2, curveSegments: 8 });
  geometry.translate(0, 0.11, -0.02);
  const body = new THREE.Mesh(geometry, material(colour, 0.3));
  body.name = "guitar-body";
  const neck = box(0.037, 0.55, 0.027, 0xb3956b, 0, 0.64);
  neck.name = "guitar-neck";
  const head = box(0.06, 0.14, 0.028, 0xc8a978, 0.008, 0.97);
  head.rotation.z = -0.12;
  group.add(body, neck, head, box(0.039, 0.53, 0.008, 0x49382c, 0, 0.64, 0.018));
  for (const y of [0.28, 0.36]) group.add(box(0.075, 0.025, 0.018, 0x252629, 0, y, 0.028));
  group.add(box(0.075, 0.025, 0.015, 0xb0afa9, 0, 0.21, 0.03));
  for (let fret = 0; fret < 14; fret += 1) group.add(box(0.039, 0.003, 0.003, 0xb0afa9, 0, 0.4 + fret * 0.035, 0.024));
  for (let string = 0; string < 6; string += 1) {
    group.add(box(0.001, 0.76, 0.001, 0xc9c5ba, (string - 2.5) * 0.005, 0.59, 0.039));
    const peg = cylinder(0.009, 0.025, 0xb0afa9, string % 2 ? 0.044 : -0.031, 0.93 + Math.floor(string / 2) * 0.035, 0, 8);
    peg.rotation.z = Math.PI / 2;
    group.add(peg);
  }
  return group;
}
