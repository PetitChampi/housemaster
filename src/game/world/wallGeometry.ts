import * as THREE from "three";
import { WALL } from "@/game/config/constants";
import type { AABB } from "@/game/world/collision";
import { wallsToVisual, type WallLayout } from "@/game/world/layout";
import { junctionFadeWall } from "@/game/world/wallVisibility";

type Point = [number, number, number];
interface Surface { positions: number[]; normals: number[]; uvs: number[] }
export interface WallGeometries {
  walls: Map<string, THREE.BufferGeometry>;
  shadows: Map<string, THREE.BufferGeometry>;
  junctions: Array<{ geometry: THREE.BufferGeometry; shadowGeometry: THREE.BufferGeometry; wallIds: string[]; fadeWithWall?: WallLayout }>;
}

const snap = (value: number) => Math.round(value * 1000000) / 1000000;
const coordinates = (values: number[]) => [...new Set(values.map(snap))].sort((a, b) => a - b);

// Exposed wall skins share a grid with solid junctions.
// Separate closed shadow volumes keep shadows complete when individual room walls stop casting them.
export function buildWallGeometries(walls: WallLayout[]): WallGeometries {
  const solids = wallsToVisual(walls).filter((piece) => !piece.glass);
  if (!solids.length) return { walls: new Map(), shadows: new Map(), junctions: [] };
  const junctions = junctionBounds(walls);
  const junctionFades = junctions.map((junction) => junctionFadeWall(junction.walls));
  const axes = [
    coordinates([...solids.flatMap(({ bounds }) => [bounds.minX, bounds.maxX]), ...junctions.flatMap(({ bounds }) => [bounds.minX, bounds.maxX])]),
    coordinates(solids.flatMap(({ bottom, height }) => [bottom, bottom + height])),
    coordinates([...solids.flatMap(({ bounds }) => [bounds.minZ, bounds.maxZ]), ...junctions.flatMap(({ bounds }) => [bounds.minZ, bounds.maxZ])]),
  ];
  const sizes = axes.map((axis) => axis.length - 1);
  const index = (x: number, y: number, z: number) => (x * sizes[1] + y) * sizes[2] + z;
  const cells = new Int16Array(sizes[0] * sizes[1] * sizes[2]).fill(-1);
  const wallIndices = new Map(walls.map((wall, index) => [wall.id, index]));
  for (const solid of solids) {
    const minimum = [solid.bounds.minX, solid.bottom, solid.bounds.minZ];
    const maximum = [solid.bounds.maxX, solid.bottom + solid.height, solid.bounds.maxZ];
    const starts = minimum.map((value, axis) => axes[axis].indexOf(snap(value)));
    const ends = maximum.map((value, axis) => axes[axis].indexOf(snap(value)));
    for (let x = starts[0]; x < ends[0]; x += 1) {
      for (let y = starts[1]; y < ends[1]; y += 1) {
        for (let z = starts[2]; z < ends[2]; z += 1) cells[index(x, y, z)] = wallIndices.get(solid.wallId)!;
      }
    }
  }

  const paintOwners = cells.slice();
  for (let x = 0; x < sizes[0]; x += 1) {
    for (let z = 0; z < sizes[2]; z += 1) {
      const midX = (axes[0][x] + axes[0][x + 1]) / 2;
      const midZ = (axes[2][z] + axes[2][z + 1]) / 2;
      const junction = junctions.findIndex(({ bounds }) => midX > bounds.minX && midX < bounds.maxX && midZ > bounds.minZ && midZ < bounds.maxZ);
      if (junction < 0) continue;
      for (let y = 0; y < sizes[1]; y += 1) {
        if (cells[index(x, y, z)] >= 0) cells[index(x, y, z)] = walls.length + junction;
      }
    }
  }

  const surface = (): Surface => ({ positions: [], normals: [], uvs: [] });
  const surfaces = walls.map(() => Array.from({ length: 3 }, surface));
  const shadows = walls.map(() => [surface()]);
  const cores = junctions.map(() => Array.from({ length: walls.length * 3 }, surface));
  const coreShadows = junctions.map(() => [surface()]);
  for (let x = 0; x < sizes[0]; x += 1) {
    for (let y = 0; y < sizes[1]; y += 1) {
      for (let z = 0; z < sizes[2]; z += 1) {
        const owner = cells[index(x, y, z)];
        if (owner < 0) continue;
        const cell: Point = [x, y, z];
        const paintOwner = paintOwners[index(x, y, z)];
        const wall = walls[paintOwner];
        const core = owner >= walls.length;
        const faceAxis = wall.from.x === wall.to.x ? 0 : 2;
        for (let axis = 0; axis < 3; axis += 1) {
          for (const sign of [-1, 1]) {
            const neighbour: Point = [...cell];
            neighbour[axis] += sign;
            const outside = neighbour[axis] < 0 || neighbour[axis] >= sizes[axis];
            const neighbourOwner = outside ? -1 : cells[index(...neighbour)];
            if (neighbourOwner === owner) continue;
            const materialIndex = axis === faceAxis ? (sign > 0 ? 0 : 1) : 2;
            if (core) {
              const junction = owner - walls.length;
              addFace(coreShadows[junction][0], axes, cell, axis, sign, wall);
              // Fading corners use only the continuous exterior skin.
              // Internal caps would add extra transparent layers and outline a pillar.
              if (!junctionFades[junction] || neighbourOwner < 0) {
                const faceWall = axis === 1 ? wall : junctionFaceWall(junctions[junction].walls, axis, axes, cell);
                const faceMaterial = axis === 1 ? 2 : sign > 0 ? 0 : 1;
                addFace(cores[junction][wallIndices.get(faceWall.id)! * 3 + faceMaterial], axes, cell, axis, sign, faceWall);
              }
            } else {
              addFace(shadows[owner][0], axes, cell, axis, sign, wall);
              if (neighbourOwner < 0) addFace(surfaces[owner][materialIndex], axes, cell, axis, sign, wall);
            }
          }
        }
      }
    }
  }

  return {
    walls: new Map(walls.map((wall, i) => [wall.id, geometryFrom(surfaces[i])])),
    shadows: new Map(walls.map((wall, i) => [wall.id, geometryFrom(shadows[i])])),
    junctions: cores.map((surfaces, index) => ({
      geometry: geometryFrom(surfaces), shadowGeometry: geometryFrom(coreShadows[index]),
      wallIds: junctions[index].walls.map((wall) => wall.id), fadeWithWall: junctionFades[index],
    })),
  };
}

function junctionFaceWall(walls: WallLayout[], axis: number, axes: number[][], cell: Point): WallLayout {
  const alongAxis = axis === 0 ? 2 : 0;
  const along = (axes[alongAxis][cell[alongAxis]] + axes[alongAxis][cell[alongAxis] + 1]) / 2;
  const candidates = walls.filter((wall) => (wall.from.x === wall.to.x) === (axis === 0));
  const distance = (wall: WallLayout) => {
    const ends = axis === 0 ? [wall.from.y, wall.to.y] : [wall.from.x, wall.to.x];
    return Math.max(Math.min(...ends) - along, along - Math.max(...ends), 0);
  };
  // Carry each wall's paint round its end, even where the perpendicular wall supplied the solid cell, so a fading corner has no differently coloured strip.
  return candidates.reduce((nearest, wall) => distance(wall) < distance(nearest) ? wall : nearest);
}

function junctionBounds(walls: WallLayout[]): Array<{ bounds: AABB; walls: WallLayout[] }> {
  const junctions = new Map<string, { bounds: AABB; walls: WallLayout[] }>();
  for (const vertical of walls.filter((wall) => wall.from.x === wall.to.x)) {
    for (const horizontal of walls.filter((wall) => wall.from.y === wall.to.y)) {
      const x = vertical.from.x;
      const z = horizontal.from.y;
      if (x < Math.min(horizontal.from.x, horizontal.to.x) || x > Math.max(horizontal.from.x, horizontal.to.x) ||
        z < Math.min(vertical.from.y, vertical.to.y) || z > Math.max(vertical.from.y, vertical.to.y)) continue;
      const bounds = { minX: x - vertical.thickness / 2, maxX: x + vertical.thickness / 2, minZ: z - horizontal.thickness / 2, maxZ: z + horizontal.thickness / 2 };
      const key = `${snap(x)},${snap(z)}`;
      const previous = junctions.get(key);
      junctions.set(key, {
        bounds: previous ? {
          minX: Math.min(bounds.minX, previous.bounds.minX), maxX: Math.max(bounds.maxX, previous.bounds.maxX),
          minZ: Math.min(bounds.minZ, previous.bounds.minZ), maxZ: Math.max(bounds.maxZ, previous.bounds.maxZ),
        } : bounds,
        walls: [...new Set([...(previous?.walls ?? []), vertical, horizontal])],
      });
    }
  }
  return [...junctions.values()];
}

function geometryFrom(surfaces: Surface[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  for (const [materialIndex, surface] of surfaces.entries()) {
    if (!surface.positions.length) continue;
    geometry.addGroup(positions.length / 3, surface.positions.length / 3, materialIndex);
    positions.push(...surface.positions);
    normals.push(...surface.normals);
    uvs.push(...surface.uvs);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function addFace(surface: Surface, axes: number[][], cell: Point, axis: number, sign: number, wall: WallLayout) {
  const u = (axis + 1) % 3;
  const v = (axis + 2) % 3;
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([du, dv]) => {
    const point: Point = [0, 0, 0];
    point[axis] = axes[axis][cell[axis] + (sign > 0 ? 1 : 0)];
    point[u] = axes[u][cell[u] + du];
    point[v] = axes[v][cell[v] + dv];
    return point;
  });
  const normal: Point = [0, 0, 0];
  normal[axis] = sign;
  const winding = sign > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
  const vertical = wall.from.x === wall.to.x;
  const start = vertical ? Math.min(wall.from.y, wall.to.y) : Math.min(wall.from.x, wall.to.x);
  const length = vertical ? Math.abs(wall.to.y - wall.from.y) : Math.abs(wall.to.x - wall.from.x);
  for (const corner of winding) {
    const point = corners[corner];
    surface.positions.push(...point);
    surface.normals.push(...normal);
    surface.uvs.push((point[vertical ? 2 : 0] - start) / length, point[1] / WALL.height);
  }
}
