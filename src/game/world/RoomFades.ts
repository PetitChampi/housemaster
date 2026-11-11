import * as THREE from "three";
import { WALL } from "@/game/config/constants";
import type { Vec2 } from "@/game/player/movement";
import { currentRoom, type RoomId } from "@/game/world/layout";

interface RoomFade {
  opacity: number;
  materials: Map<THREE.Material, { opacity: number; transparent: boolean; depthWrite: boolean }>;
  meshes: Map<THREE.Mesh, boolean>;
  shadow: THREE.MeshDepthMaterial;
}

export class RoomFades {
  private readonly rooms = new Map<RoomId, RoomFade>();

  add(object: THREE.Object3D, room: RoomId) {
    let fade = this.rooms.get(room);
    if (!fade) {
      fade = { opacity: 1, materials: new Map(), meshes: new Map(), shadow: fadingShadowMaterial() };
      this.rooms.set(room, fade);
    }
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (!fade.meshes.has(child)) {
        fade.meshes.set(child, child.castShadow);
        if (child.castShadow) child.customDepthMaterial = fade.shadow;
      }
      if (child.userData.shadowProxy) return;
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
        if (!fade.materials.has(material)) {
          fade.materials.set(material, { opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite });
        }
      }
    });
  }

  update(position: Vec2, dt: number) {
    const occupied = currentRoom(position)?.id;
    const amount = 1 - Math.exp(-WALL.fadeSpeed * dt);
    for (const [room, fade] of this.rooms) {
      const target = occupied === room ? WALL.fadedOpacity : 1;
      fade.opacity += (target - fade.opacity) * amount;
      if (Math.abs(fade.opacity - target) < 0.0001) fade.opacity = target;
      const solid = fade.opacity === 1;
      for (const [material, base] of fade.materials) {
        material.opacity = base.opacity * fade.opacity;
        material.depthWrite = base.depthWrite && solid;
        const transparent = base.transparent || !solid;
        if (material.transparent !== transparent) {
          material.transparent = transparent;
          material.needsUpdate = true;
        }
      }
      // Shadow coverage follows the same transition, instead of returning at full strength on the first frame after the player leaves the room.
      fade.shadow.opacity = (fade.opacity - WALL.fadedOpacity) / (1 - WALL.fadedOpacity);
      for (const [mesh, castsShadow] of fade.meshes) mesh.castShadow = castsShadow && fade.shadow.opacity > 0;
    }
  }
}

function fadingShadowMaterial(): THREE.MeshDepthMaterial {
  const material = new THREE.MeshDepthMaterial({ depthPacking: THREE.BasicDepthPacking });
  material.onBeforeCompile = (shader) => {
    // A stable shadow-map pixel mask gives every face of a closed wall the same coverage.
    // PCF filtering softens it, no extra colour pass is necessary.
    shader.fragmentShader = shader.fragmentShader.replace("#include <alphatest_fragment>", `
      #include <alphatest_fragment>
      float coverage = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      if (opacity <= coverage) discard;
    `);
  };
  material.customProgramCacheKey = () => "room-shadow-fade";
  return material;
}
