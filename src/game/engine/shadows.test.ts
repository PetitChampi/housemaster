import * as THREE from "three";
import { expect, it } from "vitest";
import { WALL } from "@/game/config/constants";
import { fitDirectionalShadow } from "@/game/engine/shadows";
import { floorRegions } from "@/game/world/floors";
import { ROOMS, WALLS } from "@/game/world/layout";

it("keeps every wall top and floor corner inside the directional shadow frustum", () => {
  const light = new THREE.DirectionalLight();
  light.position.set(4, 8, 3);
  const points: THREE.Vector3[] = [];
  for (const rect of ROOMS.flatMap((room) => floorRegions(room, WALLS))) {
    for (const x of [rect.minX, rect.maxX]) {
      for (const z of [rect.minZ, rect.maxZ]) {
        for (const y of [0, WALL.height]) points.push(new THREE.Vector3(x, y, z));
      }
    }
  }
  fitDirectionalShadow(light, new THREE.Box3().setFromPoints(points));
  for (const point of points) {
    const clip = point.clone().project(light.shadow.camera);
    for (const value of clip.toArray()) {
      expect(value).toBeGreaterThan(-1);
      expect(value).toBeLessThan(1);
    }
  }
});
