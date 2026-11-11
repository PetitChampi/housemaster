import * as THREE from "three";
import { FURNITURE } from "@/game/config/constants";
import type { Vec2 } from "@/game/player/movement";
import type { AABB } from "@/game/world/collision";

interface MaterialState {
  material: THREE.MeshStandardMaterial;
  emissive: THREE.Color;
  emissiveIntensity: number;
}

export class Interactable {
  readonly position: Vec2;
  readonly footprint: AABB;
  private readonly materialStates: MaterialState[] = [];
  private readonly highlightColour = new THREE.Color(FURNITURE.highlight);
  private highlightTarget = 0;
  private highlightAmount = 0;

  constructor(
    readonly toolId: string,
    readonly title: string,
    readonly object: THREE.Group
  ) {
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.userData.interactable = this;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const clones = materials.map((source) => source.clone());
      child.material = Array.isArray(child.material) ? clones : clones[0];
      materials.forEach((source) => source.dispose());
      for (const cloned of clones) {
        if (!(cloned instanceof THREE.MeshStandardMaterial)) continue;
        this.materialStates.push({
          material: cloned,
          emissive: cloned.emissive.clone(),
          emissiveIntensity: cloned.emissiveIntensity,
        });
      }
    });

    const bounds = new THREE.Box3().setFromObject(object);
    this.footprint = { minX: bounds.min.x, maxX: bounds.max.x, minZ: bounds.min.z, maxZ: bounds.max.z };
    this.position = { x: (bounds.min.x + bounds.max.x) / 2, y: (bounds.min.z + bounds.max.z) / 2 };
  }

  setHighlighted(highlighted: boolean) {
    this.highlightTarget = highlighted ? 1 : 0;
  }

  updateHighlight(dt: number) {
    const amount = 1 - Math.exp(-FURNITURE.highlightSpeed * dt);
    this.highlightAmount += (this.highlightTarget - this.highlightAmount) * amount;
    for (const state of this.materialStates) {
      state.material.emissive.copy(state.emissive).lerp(this.highlightColour, this.highlightAmount);
      const intensity = Math.max(state.emissiveIntensity, FURNITURE.highlightIntensity);
      state.material.emissiveIntensity = state.emissiveIntensity + (intensity - state.emissiveIntensity) * this.highlightAmount;
    }
  }
}
