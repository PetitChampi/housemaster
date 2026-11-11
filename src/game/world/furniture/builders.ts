import * as THREE from "three";
import type { FurnitureLayout } from "@/game/world/layout";
import { WALL } from "@/game/config/constants";
import { screenTexture } from "@/game/world/textures";
import { box, cylinder, finish, material } from "@/game/world/furniture/helpers";
import { buildGuitarRack, buildRattanBox } from "@/game/world/furniture/bedroomProps";
import { buildBathroomSink, buildTowelRail } from "@/game/world/furniture/bathroomProps";

const WHITE = 0xf4f2ec;
const DARK = 0x29282a;
const METAL = 0x92979a;

export function buildFurniture(item: FurnitureLayout): THREE.Group {
  const builders: Record<FurnitureLayout["builder"], (layout: FurnitureLayout) => THREE.Group> = {
    bath: buildBath,
    bed: buildBed,
    board: buildBoard,
    bookcase: buildBookcase,
    cabinet: buildCabinet,
    chair: buildChair,
    coatRack: buildCoatRack,
    counter: buildCounter,
    desk: buildDesk,
    diningTable: buildDiningTable,
    divider: buildDivider,
    entrance: buildEntrance,
    guitarRack: buildGuitarRack,
    hob: buildHob,
    nightstand: buildNightstand,
    piano: buildPiano,
    rattanBox: buildRattanBox,
    sideTable: buildSideTable,
    sink: buildBathroomSink,
    sofa: buildSofa,
    steppedShelving: buildSteppedShelving,
    tableLaptop: buildTableLaptop,
    toilet: buildToilet,
    towelRail: buildTowelRail,
    tv: buildTv,
    washer: buildWasher,
  };
  const group = builders[item.builder](item);
  group.name = item.id;
  group.position.set(item.x, 0, item.z);
  group.rotation.y = item.rotation ?? 0;
  return finish(group);
}

function buildBath(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 1.65;
  const depth = item.depth ?? 0.68;
  const colour = item.colour ?? WHITE;
  group.add(
    box(width, 0.48, 0.12, colour, 0, 0.24, -depth / 2 + 0.06),
    box(width, 0.48, 0.12, colour, 0, 0.24, depth / 2 - 0.06),
    box(0.12, 0.48, depth - 0.2, colour, -width / 2 + 0.06, 0.24),
    box(0.12, 0.48, depth - 0.2, colour, width / 2 - 0.06, 0.24),
    box(width - 0.22, 0.03, depth - 0.18, 0xc6d9db, 0, 0.34)
  );
  return group;
}

function buildToilet(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const colour = item.colour ?? WHITE;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16), material(colour, 0.32));
  bowl.scale.set(0.2, 0.21, 0.27);
  bowl.position.set(0, 0.32, 0.08);
  const seat = cylinder(0.21, 0.045, colour, 0, 0.52, 0.07, 32);
  seat.scale.set(0.9, 1, 1.22);
  const cistern = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), material(colour, 0.32));
  cistern.scale.set(0.19, 0.32, 0.12);
  cistern.position.set(0, 0.43, -0.22);
  group.add(bowl, seat, cistern, cylinder(0.12, 0.2, colour, 0, 0.1, 0.06));
  return group;
}

function buildWasher(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 0.56;
  const depth = item.depth ?? 0.58;
  const body = box(width, 0.82, depth, item.colour ?? WHITE, 0, 0.41);
  const door = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.035, 28), material(0x4e555a, 0.28));
  door.rotation.x = Math.PI / 2;
  door.position.set(0, 0.42, depth / 2 + 0.02);
  group.add(body, door, box(width * 0.78, 0.06, 0.03, 0xd8d7d3, 0, 0.75, depth / 2 + 0.02));
  return group;
}

function buildCounter(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 1;
  const depth = item.depth ?? 0.62;
  const colour = item.colour ?? 0xc7d2c4;
  const fridgeWidth = item.fitting === "fridge" ? 0.6 : 0;
  const overhang = { left: 0.02, right: 0.02, front: 0.02, back: 0.02, ...item.worktopOverhang };
  const worktop = box(width + overhang.left + overhang.right, 0.06, depth + overhang.front + overhang.back, 0xf1eee6, (overhang.right - overhang.left) / 2, 0.81, (overhang.front - overhang.back) / 2);
  worktop.name = "counter-worktop";
  group.add(
    box(width - fridgeWidth, 0.78, depth, colour, -fridgeWidth / 2, 0.39),
    worktop,
    box(width * 0.84, 0.018, 0.014, 0x7b817d, 0, 0.56, depth / 2 + 0.01)
  );
  if (item.fitting === "fridge") {
    const x = width / 2 - 0.3;
    const fridge = box(0.58, 0.76, depth - 0.02, 0xe9e8df, x, 0.38);
    fridge.name = "undercounter-fridge";
    group.add(fridge, box(0.22, 0.025, 0.025, METAL, x, 0.67, depth / 2 + 0.02));
  }
  if (item.fitting === "sink") {
    const sink = box(0.64, 0.025, depth * 0.68, 0xb4c6c8, 0, 0.85, 0, 0.2);
    sink.name = "kitchen-basin";
    group.add(sink, cylinder(0.022, 0.22, METAL, 0, 0.96, -depth * 0.36, 12));
  }
  return group;
}

function buildHob(item: FurnitureLayout): THREE.Group {
  const group = buildCounter(item);
  const width = item.width ?? 0.68;
  const depth = item.depth ?? 0.62;
  const top = box(width * 0.86, 0.025, depth * 0.72, 0x292b2b, 0, 0.86, 0, 0.25);
  group.add(top);
  for (const x of [-0.18, 0.18]) {
    for (const z of [-0.13, 0.13]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.012, 8, 20), material(0xaeb0aa, 0.28, 0.4));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.88, z);
      group.add(ring);
    }
  }
  return group;
}

function buildEntrance(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 1.26;
  const height = item.height ?? 2.2;
  const colour = item.colour ?? 0xe3ded3;
  group.add(
    box(width - 0.08, height, 0.085, colour, 0, height / 2),
    box(0.045, height, 0.12, 0xf4f1e9, -width / 2 + 0.02, height / 2),
    box(0.045, height, 0.12, 0xf4f1e9, width / 2 - 0.02, height / 2),
    box(width, 0.055, 0.12, 0xf4f1e9, 0, height),
    box(width, WALL.height - height, 0.16, 0xf1efea, 0, height + (WALL.height - height) / 2),
    box(width * 0.68, height * 0.35, 0.018, 0xede8dd, 0, height * 0.68, 0.05),
    box(width * 0.68, height * 0.25, 0.018, 0xede8dd, 0, height * 0.26, 0.05),
    box(0.14, 0.035, 0.065, 0x9b8056, width * 0.34, 1, 0.08)
  );
  return group;
}

function buildDivider(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const panelWidth = (item.width ?? 1.04) / 3;
  const height = item.height ?? 1.6;
  const hinge = new THREE.Vector3();
  const fold = 0.16;
  const angles = [fold, -Math.asin(2 * Math.sin(fold)), fold];
  // Start at the corner and hinge each panel onto the previous panel's free edge
  for (let index = 0; index < 3; index += 1) {
    const panel = new THREE.Group();
    panel.name = `divider-panel-${index + 1}`;
    panel.rotation.y = angles[index];
    const direction = new THREE.Vector3(Math.cos(panel.rotation.y), 0, -Math.sin(panel.rotation.y));
    panel.position.copy(hinge).addScaledVector(direction, -panelWidth / 2);
    panel.add(box(panelWidth, height, 0.045, item.colour ?? DARK, 0, height / 2));
    for (let slat = 0; slat < 8; slat += 1) {
      panel.add(box(panelWidth * 0.84, 0.018, 0.052, 0x464349, 0, 0.15 + slat * (height - 0.3) / 8));
    }
    const pin = cylinder(0.018, height * 0.85, 0x343236, panelWidth / 2, height / 2, 0, 8);
    panel.add(pin);
    group.add(panel);
    hinge.addScaledVector(direction, -panelWidth);
  }
  return group;
}

function buildCoatRack(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const colour = item.colour ?? 0x554c45;
  const width = item.width ?? 0.78;
  group.add(box(width, 0.1, 0.04, colour, 0, 1.68));
  for (let index = 0; index < 4; index += 1) {
    const x = -width * 0.36 + index * width * 0.24;
    group.add(box(0.025, 0.035, 0.12, METAL, x, 1.68, 0.06));
    if (index < 3) {
      const coatColours = [0xd6d1c6, 0x48484b, 0x8b4b36];
      group.add(box(0.16, 0.58, 0.08, coatColours[index], x, 1.32, 0.1));
    }
  }
  return group;
}

function buildTv(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 0.92;
  const bezel = box(width, 0.57, 0.055, DARK, 0, 0.82, 0.04, 0.32);
  bezel.name = "tv-bezel";
  const foot = box(width * 0.4, 0.03, 0.21, DARK, 0, 0.425, 0.05);
  foot.name = "tv-foot";
  group.add(box(width, 0.38, 0.32, 0x2f3032, 0, 0.19), bezel, foot, box(0.055, 0.12, 0.05, DARK, 0, 0.49, 0.04));
  const screen = screenPanel(width * 0.92, 0.53, item.content ?? "calendar");
  screen.position.set(0, 0.82, 0.071);
  group.add(screen);
  return group;
}

function buildBoard(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 1;
  const height = item.height ?? 0.7;
  const depth = item.depth ?? 0.05;
  const frame = item.accentColour ?? 0x6f5436;
  const y = item.mountingHeight ?? 1.5;
  group.add(
    box(width + 0.08, height + 0.08, depth, frame, 0, y),
    box(width, height, depth + 0.012, item.colour ?? 0xe8e1d5, 0, y, 0.008)
  );
  if (item.content) {
    const panel = screenPanel(width * 0.94, height * 0.9, item.content);
    panel.position.set(0, y, depth / 2 + 0.025);
    group.add(panel);
  }
  return group;
}

function buildPiano(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 1.25;
  const depth = item.depth ?? 0.46;
  const colour = item.colour ?? DARK;
  group.add(
    box(width, 0.12, depth, colour, 0, 0.72),
    box(0.06, 0.7, 0.06, colour, -width * 0.42, 0.35, 0),
    box(0.06, 0.7, 0.06, colour, width * 0.42, 0.35, 0),
    box(width * 0.9, 0.06, depth * 0.64, 0xf4f1e6, 0, 0.79, depth * 0.08),
    box(width * 0.78, 0.52, 0.05, colour, 0, 1.03, -depth / 2 + 0.03)
  );
  for (let index = 0; index < 14; index += 1) {
    group.add(box(0.025, 0.025, 0.13, 0x202023, -width * 0.38 + index * width * 0.058, 0.83, 0.03));
  }
  return group;
}

function buildSofa(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 1.85;
  const depth = item.depth ?? 0.78;
  const colour = item.colour ?? 0xa6a8ad;
  group.add(
    box(width, 0.26, depth, colour, 0, 0.29),
    box(width, 0.65, 0.18, colour, 0, 0.55, -depth / 2 + 0.09),
    box(0.18, 0.48, depth, colour, -width / 2 + 0.09, 0.38),
    box(0.18, 0.48, depth, colour, width / 2 - 0.09, 0.38),
    box(width * 0.42, 0.12, depth * 0.64, 0xb9bbc0, -width * 0.22, 0.48, 0.03),
    box(width * 0.42, 0.12, depth * 0.64, 0xb9bbc0, width * 0.22, 0.48, 0.03)
  );
  return group;
}

function buildSideTable(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 0.42;
  const colour = item.colour ?? 0x8f6a47;
  group.add(cylinder(width / 2, 0.055, colour, 0, 0.48), cylinder(0.04, 0.45, colour, 0, 0.25), cylinder(width * 0.38, 0.04, colour, 0, 0.02));
  return group;
}

function buildDiningTable(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 1.05;
  const colour = item.colour ?? 0x8f7457;
  group.add(cylinder(width / 2, 0.07, colour, 0, 0.75), cylinder(0.08, 0.72, colour, 0, 0.37), cylinder(width * 0.28, 0.05, colour, 0, 0.025));
  return group;
}

function buildChair(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const colour = item.colour ?? 0x70553e;
  group.add(box(0.42, 0.07, 0.42, colour, 0, 0.46));
  for (const x of [-0.16, 0.16]) {
    for (const z of [-0.16, 0.16]) group.add(box(0.045, 0.44, 0.045, colour, x, 0.22, z));
  }
  group.add(box(0.42, 0.5, 0.05, colour, 0, 0.73, -0.18));
  return group;
}

function buildBed(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 0.92;
  const depth = item.depth ?? 1.95;
  const linen = item.colour ?? 0xe9e4d9;
  const duvet = item.accentColour ?? 0x704559;
  group.add(
    box(width, 0.24, depth, 0x80664d, 0, 0.18),
    box(width * 0.95, 0.22, depth * 0.94, linen, 0, 0.39),
    box(width * 0.92, 0.12, depth * 0.65, duvet, 0, 0.55, -depth * 0.08),
    box(width, 0.72, 0.08, 0x7b614b, 0, 0.42, depth / 2 - 0.04)
  );
  const pillow = box(Math.min(0.6, width * 0.72), 0.12, 0.32, 0xf2eee6, 0, 0.57, depth * 0.32);
  pillow.name = "pillow";
  group.add(pillow);
  return group;
}

function buildTableLaptop(item: FurnitureLayout): THREE.Group {
  const group = buildSmallTable(item);
  const laptop = buildLaptop(item.content ?? "accounting");
  laptop.position.set(0, 0.73, 0);
  group.add(laptop);
  return group;
}

function buildSmallTable(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 0.76;
  const depth = item.depth ?? 0.54;
  const colour = item.colour ?? 0x7b6048;
  group.add(box(width, 0.055, depth, colour, 0, 0.7));
  for (const x of [-width * 0.4, width * 0.4]) {
    for (const z of [-depth * 0.38, depth * 0.38]) group.add(box(0.045, 0.68, 0.045, colour, x, 0.34, z));
  }
  return group;
}

function buildLaptop(content: "accounting" | "calendar" | "kanban" | "tasks" | "travel"): THREE.Group {
  const group = new THREE.Group();
  group.add(box(0.42, 0.025, 0.3, 0x7d8082, 0, 0.012));
  const screen = screenPanel(0.4, 0.25, content);
  screen.rotation.x = -0.22;
  screen.position.set(0, 0.16, -0.14);
  group.add(screen);
  return group;
}

function buildCabinet(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 1.1;
  const depth = item.depth ?? 0.5;
  const height = item.height ?? 2;
  const colour = item.colour ?? 0x8b694a;
  group.add(box(width, height, depth, colour, 0, height / 2));
  return group;
}

function buildSteppedShelving(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 1.38;
  const depth = item.depth ?? 0.34;
  const cellWidth = width / 3;
  const cellHeight = (item.height ?? 1.84) / 4;
  const thickness = 0.035;
  const colour = item.colour ?? 0xa38359;
  for (let column = 0; column < 3; column += 1) {
    const rows = 4 - column;
    const unit = new THREE.Group();
    unit.name = `shelving-1x${rows}`;
    const x = -width / 2 + (column + 0.5) * cellWidth;
    const height = rows * cellHeight;
    unit.add(
      box(thickness, height, depth, colour, x - cellWidth / 2 + thickness / 2, height / 2),
      box(thickness, height, depth, colour, x + cellWidth / 2 - thickness / 2, height / 2)
    );
    for (let row = 0; row <= rows; row += 1) {
      const y = thickness / 2 + row * (height - thickness) / rows;
      unit.add(box(cellWidth, thickness, depth, colour, x, y));
      if (row === rows) continue;
      for (let book = 0; book < 4; book += 1) {
        unit.add(box(0.05, 0.22 + book % 2 * 0.04, depth * 0.7, 0x6c4650 + book * 0x080706, x - 0.12 + book * 0.07, y + 0.15));
      }
    }
    group.add(unit);
  }
  return group;
}

function buildNightstand(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 0.42;
  const depth = item.depth ?? 0.4;
  const colour = item.colour ?? 0x9a7149;
  group.add(box(width, 0.48, depth, colour, 0, 0.24), box(width * 0.75, 0.025, 0.018, 0x6f5238, 0, 0.32, depth / 2 + 0.01));
  return group;
}

function buildDesk(item: FurnitureLayout): THREE.Group {
  const group = buildSmallTable(item);
  const width = item.width ?? 1.2;
  const depth = item.depth ?? 0.58;
  group.add(box(width * 0.28, 0.48, depth * 0.86, item.colour ?? 0xa77b4c, width * 0.33, 0.43));
  const yarnColours = [0x9a2845, 0x5f7890, 0xd2a35e];
  yarnColours.forEach((colour, index) => {
    const yarn = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), material(colour));
    yarn.position.set(-width * 0.28 + index * 0.15, 0.81, 0.05);
    group.add(yarn);
  });
  const hook = cylinder(0.012, 0.34, 0x9b6427, 0.12, 0.81, -0.05, 8);
  hook.rotation.z = Math.PI / 2;
  group.add(hook, box(0.3, 0.018, 0.2, 0xc7758c, -0.05, 0.79, -0.15));
  return group;
}

function buildBookcase(item: FurnitureLayout): THREE.Group {
  const group = new THREE.Group();
  const width = item.width ?? 0.75;
  const depth = item.depth ?? 0.34;
  const height = item.height ?? 1.2;
  const colour = item.colour ?? 0x9d794f;
  group.add(
    box(0.06, height, depth, colour, -width / 2 + 0.03, height / 2),
    box(0.06, height, depth, colour, width / 2 - 0.03, height / 2)
  );
  for (let shelf = 0; shelf < 4; shelf += 1) {
    const y = shelf / 3 * (height - 0.05) + 0.025;
    group.add(box(width, 0.05, depth, colour, 0, y));
    if (shelf < 3) {
      for (let book = 0; book < 5; book += 1) {
        group.add(box(0.055, 0.19 + (book % 2) * 0.04, depth * 0.65, 0x6c4650 + book * 0x080706, -width * 0.32 + book * 0.11, y + 0.12));
      }
    }
  }
  return group;
}

function screenPanel(width: number, height: number, content: "accounting" | "calendar" | "kanban" | "tasks" | "travel"): THREE.Mesh {
  const texture = screenTexture(content);
  const screenMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: 0xffffff,
    emissiveIntensity: 0.12,
    roughness: 0.48,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(width, height), screenMaterial);
  return screen;
}
