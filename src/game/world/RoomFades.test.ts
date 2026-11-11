import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { WALL } from "@/game/config/constants";
import { RoomFades } from "@/game/world/RoomFades";

const inside = { x: -2.2, y: 2.5 };
const outside = { x: 0, y: -1 };

describe("synchronised room fades", () => {
  it("updates shared materials once and keeps separately registered wall parts in sync through reversals", () => {
    const fades = new RoomFades();
    const shared = new THREE.MeshStandardMaterial();
    const corner = new THREE.MeshStandardMaterial();
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), [shared, shared, shared]), new THREE.Mesh(new THREE.BoxGeometry(), shared));
    fades.add(group, "nook");
    fades.add(new THREE.Mesh(new THREE.BoxGeometry(), corner), "nook");
    for (const position of [inside, outside, inside, outside]) {
      for (const dt of [1 / 60, 1 / 30, 1 / 144, 0.2]) {
        fades.update(position, dt);
        expect(shared.opacity).toBe(corner.opacity);
        expect(shared.depthWrite).toBe(corner.depthWrite);
        expect(shared.transparent).toBe(corner.transparent);
      }
    }
  });

  it("restores shadows gradually with the wall instead of switching them on at full strength", () => {
    const fades = new RoomFades();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    mesh.castShadow = true;
    fades.add(mesh, "nook");
    const shadow = mesh.customDepthMaterial!;
    fades.update(inside, 2);
    expect(mesh.castShadow).toBe(false);
    expect(shadow.opacity).toBe(0);
    fades.update(outside, 1 / 60);
    expect(shadow.opacity).toBeGreaterThan(0);
    expect(shadow.opacity).toBeLessThan(0.25);
    expect(shadow.opacity).toBeCloseTo((mesh.material.opacity - WALL.fadedOpacity) / (1 - WALL.fadedOpacity));
    const returning = shadow.opacity;
    fades.update(inside, 1 / 60);
    expect(shadow.opacity).toBeGreaterThan(0);
    expect(shadow.opacity).toBeLessThan(returning);
    fades.update(outside, 2);
    expect(shadow.opacity).toBe(1);
  });

  it("changes depth-writing and blending only at the common opaque endpoint, preserving glass", () => {
    const fades = new RoomFades();
    const paint = new THREE.MeshStandardMaterial();
    const glass = new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.26, depthWrite: false });
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), paint), new THREE.Mesh(new THREE.BoxGeometry(), glass));
    fades.add(group, "nook");
    fades.update(inside, 2);
    fades.update(outside, 0.45);
    expect(paint.opacity).toBeGreaterThan(0.99);
    expect(paint.opacity).toBeLessThan(1);
    expect(paint.transparent).toBe(true);
    expect(paint.depthWrite).toBe(false);
    expect(glass.opacity / 0.26).toBeCloseTo(paint.opacity);
    fades.update(outside, 2);
    expect(paint.opacity).toBe(1);
    expect(paint.transparent).toBe(false);
    expect(paint.depthWrite).toBe(true);
    expect(glass.opacity).toBe(0.26);
    expect(glass.transparent).toBe(true);
    expect(glass.depthWrite).toBe(false);
  });
});
