import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { FURNITURE } from "@/game/config/constants";
import { Interactable } from "@/game/world/Interactable";

function fixture() {
  const object = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ emissive: 0x123456, emissiveIntensity: 0.12 }));
  object.add(mesh);
  const item = new Interactable("test", "Test", object);
  return { item, material: mesh.material };
}

describe("highlight transitions", () => {
  it("eases towards yellow and restores the original screen glow on release", () => {
    const { item, material } = fixture();
    const original = material.emissive.clone();
    item.setHighlighted(true);
    expect(material.emissive.equals(original)).toBe(true);
    item.updateHighlight(1 / 60);
    expect(material.emissive.equals(original)).toBe(false);
    expect(material.emissive.equals(new THREE.Color(FURNITURE.highlight))).toBe(false);
    item.updateHighlight(2);
    expect(material.emissive.getHex()).toBe(FURNITURE.highlight);
    expect(material.emissiveIntensity).toBeCloseTo(FURNITURE.highlightIntensity);
    item.setHighlighted(false);
    item.updateHighlight(1 / 60);
    expect(material.emissive.equals(original)).toBe(false);
    item.updateHighlight(2);
    expect(material.emissive.getHex()).toBe(original.getHex());
    expect(material.emissiveIntensity).toBeCloseTo(0.12);
  });

  it("runs at the same speed across frame rates and reverses without snapping", () => {
    const slow = fixture();
    const fast = fixture();
    for (const { item } of [slow, fast]) item.setHighlighted(true);
    for (let frame = 0; frame < 6; frame += 1) slow.item.updateHighlight(1 / 30);
    for (let frame = 0; frame < 24; frame += 1) fast.item.updateHighlight(1 / 120);
    expect(slow.material.emissive.r).toBeCloseTo(fast.material.emissive.r);
    const before = fast.material.emissive.clone();
    fast.item.setHighlighted(false);
    expect(fast.material.emissive.equals(before)).toBe(true);
    fast.item.updateHighlight(1 / 120);
    expect(fast.material.emissive.r).toBeLessThan(before.r);
  });
});
