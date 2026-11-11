import * as THREE from "three";

export function material(colour: number, roughness = 0.72, metalness = 0.02): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: colour, roughness, metalness });
}

export function box(
  width: number,
  height: number,
  depth: number,
  colour: number,
  x = 0,
  y = height / 2,
  z = 0,
  roughness = 0.72
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(colour, roughness));
  mesh.position.set(x, y, z);
  return mesh;
}

export function cylinder(
  radius: number,
  height: number,
  colour: number,
  x = 0,
  y = height / 2,
  z = 0,
  segments = 20
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material(colour));
  mesh.position.set(x, y, z);
  return mesh;
}

export function finish(group: THREE.Group): THREE.Group {
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });
  return group;
}
