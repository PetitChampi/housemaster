import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { WALL } from "@/game/config/constants";
import { WALLS, type WallLayout } from "@/game/world/layout";
import { buildWallGeometries } from "@/game/world/wallGeometry";

function distances(walls: WallLayout[], origin: THREE.Vector3, direction: THREE.Vector3): number[] {
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const geometries = buildWallGeometries(walls);
  const meshes = [...geometries.walls.values(), ...geometries.junctions.map((junction) => junction.geometry)].map((geometry) => new THREE.Mesh(geometry, Array(walls.length * 3).fill(material)));
  const hits = new THREE.Raycaster(origin, direction).intersectObjects(meshes);
  const result = [...new Set(hits.map((hit) => Math.round(hit.distance * 10000) / 10000))];
  meshes.forEach((mesh) => mesh.geometry.dispose());
  geometries.shadows.forEach((geometry) => geometry.dispose());
  geometries.junctions.forEach((junction) => junction.shadowGeometry.dispose());
  material.dispose();
  return result;
}

const windowWall: WallLayout = {
  id: "window-wall", from: { x: 0, y: 0 }, to: { x: 4, y: 0 }, thickness: 0.12,
  openings: [{ kind: "window", centre: 2, width: 1, sill: 0.8, lintel: 2.1 }],
};

describe("joined wall surfaces", () => {
  it("cuts a real window opening with solid jambs and no hidden faces below or above it", () => {
    expect(distances([windowWall], new THREE.Vector3(2, 1.4, -1), new THREE.Vector3(0, 0, 1))).toEqual([]);
    for (const y of [0.4, 2.4]) {
      expect(distances([windowWall], new THREE.Vector3(-1, y, 0), new THREE.Vector3(1, 0, 0))).toEqual([1, 5]);
      expect(distances([windowWall], new THREE.Vector3(2, y, -1), new THREE.Vector3(0, 0, 1))).toEqual([0.94, 1.06]);
    }
    expect(distances([windowWall], new THREE.Vector3(-1, 1.4, 0), new THREE.Vector3(1, 0, 0))).toEqual([1, 2.5, 3.5, 5]);
  });

  it("fills the outer corner with a closed core that remains visible through faded walls", () => {
    const walls: WallLayout[] = [
      { id: "north", from: { x: 0, y: 0 }, to: { x: 2, y: 0 }, thickness: 0.2 },
      { id: "west", from: { x: 0, y: 0 }, to: { x: 0, y: 2 }, thickness: 0.2 },
    ];
    expect(distances(walls, new THREE.Vector3(-0.08, 1, -1), new THREE.Vector3(0, 0, 1))).toEqual([0.9, 1.1, 3]);
    expect(distances(walls, new THREE.Vector3(-1, 1, -0.08), new THREE.Vector3(1, 0, 0))).toEqual([0.9, 1.1, 3]);
  });

  it("also closes the core where a branch meets the middle of a wall", () => {
    const walls: WallLayout[] = [
      { id: "across", from: { x: -2, y: 0 }, to: { x: 2, y: 0 }, thickness: 0.16 },
      { id: "branch", from: { x: 0, y: 0 }, to: { x: 0, y: 2 }, thickness: 0.12 },
    ];
    expect(distances(walls, new THREE.Vector3(0.02, 1, -1), new THREE.Vector3(0, 0, 1))).toEqual([0.92, 1.08, 3]);
  });

  it("closes every junction and every independent shadow caster, including window reveals", () => {
    const geometries = buildWallGeometries(WALLS);
    for (const geometry of [...geometries.shadows.values(), ...geometries.junctions.map((junction) => junction.shadowGeometry)]) {
      const edges = new Map<string, number>();
      const positions = geometry.getAttribute("position");
      const point = (index: number) => [positions.getX(index), positions.getY(index), positions.getZ(index)].map((value) => value.toFixed(5)).join(",");
      for (let triangle = 0; triangle < positions.count; triangle += 3) {
        for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
          const key = [point(triangle + a), point(triangle + b)].sort().join("|");
          edges.set(key, (edges.get(key) ?? 0) + 1);
        }
      }
      expect(edges.size).toBeGreaterThan(0);
      expect([...edges].filter(([, count]) => count !== 2)).toEqual([]);
      geometry.dispose();
    }
    geometries.walls.forEach((geometry) => geometry.dispose());
    geometries.junctions.forEach((junction) => junction.geometry.dispose());
  });

  it("removes internal corner faces when both adjoining walls fade together", () => {
    const walls: WallLayout[] = [
      { id: "south", from: { x: 0, y: 2 }, to: { x: 2, y: 2 }, thickness: 0.2, seeThrough: true, negativeRoom: "bedroom" },
      { id: "east", from: { x: 2, y: 0 }, to: { x: 2, y: 2 }, thickness: 0.2, seeThrough: true, negativeRoom: "bedroom" },
    ];
    // Rays travelling along either wall see only the ends of the joined shell,
    // never an extra cap at the start of the corner block.
    expect(distances(walls, new THREE.Vector3(2.05, 1, -1), new THREE.Vector3(0, 0, 1))).toEqual([1, 3.1]);
    expect(distances(walls, new THREE.Vector3(-1, 1, 2.05), new THREE.Vector3(1, 0, 0))).toEqual([1, 3.1]);
  });

  it("maps the door artwork continuously onto both faces of its wall", () => {
    const wall = WALLS.find((wall) => wall.doorDecoration)!;
    const geometry = buildWallGeometries([wall]).walls.get(wall.id)!;
    const positions = geometry.getAttribute("position");
    const uvs = geometry.getAttribute("uv");
    const length = wall.to.y - wall.from.y;
    for (let index = 0; index < positions.count; index += 1) {
      expect(uvs.getX(index)).toBeCloseTo((positions.getZ(index) - wall.from.y) / length);
      expect(uvs.getY(index)).toBeCloseTo(positions.getY(index) / WALL.height);
    }
    geometry.dispose();
  });
});
