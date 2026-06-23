import * as THREE from "three";
import { FURNITURE } from "@/game/config/constants";
import type { Vec2 } from "@/game/player/movement";

export class Interactable {
  readonly object: THREE.Mesh;
  readonly position: Vec2;

  // carries toolId for app callback, and title for the prompt
  constructor(
    readonly toolId: string,
    readonly title: string,
    x: number,
    z: number
  ) {
    this.position = { x, y: z };
    this.object = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.2, 1.4),
      new THREE.MeshStandardMaterial({ color: FURNITURE.colour })
    );
    this.object.position.set(x, 0.6, z);
    // Let a raycast hit map straight back to this interactable
    this.object.userData.interactable = this;
  }

  // change the object's colour when it's the one in reach
  setHighlighted(highlighted: boolean) {
    const material = this.object.material as THREE.MeshStandardMaterial;
    material.color.setHex(highlighted ? FURNITURE.highlight : FURNITURE.colour);
  }
}
