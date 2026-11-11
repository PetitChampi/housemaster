import * as THREE from "three";

export function fitDirectionalShadow(light: THREE.DirectionalLight, bounds: THREE.Box3, margin = 0.5) {
  light.updateMatrixWorld();
  light.target.updateMatrixWorld();
  light.shadow.updateMatrices(light);
  const camera = light.shadow.camera;
  const lightBounds = new THREE.Box3();
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        lightBounds.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
      }
    }
  }
  // These extents are in the light's view, not the flat's world x/z axes.
  camera.left = lightBounds.min.x - margin;
  camera.right = lightBounds.max.x + margin;
  camera.bottom = lightBounds.min.y - margin;
  camera.top = lightBounds.max.y + margin;
  camera.near = Math.max(0.1, -lightBounds.max.z - margin);
  camera.far = -lightBounds.min.z + margin;
  camera.updateProjectionMatrix();
  light.shadow.updateMatrices(light);
}
