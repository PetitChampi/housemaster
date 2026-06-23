import * as THREE from "three";
import { Interactable } from "@/game/world/Interactable";

// Turn a click into the interactable under the cursor (null if the click missed)
export function pickInteractable(
  event: PointerEvent,
  dom: HTMLElement,
  camera: THREE.Camera,
  raycaster: THREE.Raycaster,
  meshes: THREE.Object3D[]
): Interactable | null {
  const rect = dom.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(meshes, false)[0];
  const interactable = hit?.object.userData.interactable;
  return interactable instanceof Interactable ? interactable : null;
}
