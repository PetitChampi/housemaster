import * as THREE from "three";
import { PLAYER } from "@/game/config/constants";
import {
  approachVelocity,
  clampToUnit,
  turnTowards,
  type Vec2,
} from "@/game/player/movement";

// The proto-character: upright capsule with a small nose so its facing is legible
// Position and velocity are tracked on the floor plane (x, z); the mesh is placed from them each step
export class Player {
  readonly object: THREE.Group;
  private position: Vec2;
  private velocity: Vec2 = { x: 0, y: 0 };
  private facing = 0;

  constructor(spawn: Vec2) {
    this.position = { ...spawn };
    this.object = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(PLAYER.radius, PLAYER.height, 6, 12),
      new THREE.MeshStandardMaterial({ color: PLAYER.colour })
    );
    body.position.y = PLAYER.radius + PLAYER.height / 2;

    const nose = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, PLAYER.radius),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    nose.position.set(0, PLAYER.radius + PLAYER.height / 2, PLAYER.radius);

    this.object.add(body, nose);
    this.syncObject();
  }

  // Integrate one fixed step. The direction is camera-relative and already on the floor plane
  // The collide callback slides the move against the walls
  update(direction: Vec2, dt: number, collide: (from: Vec2, to: Vec2, radius: number) => Vec2) {
    const wish = clampToUnit(direction);
    const target = { x: wish.x * PLAYER.maxSpeed, y: wish.y * PLAYER.maxSpeed };
    this.velocity = approachVelocity(
      this.velocity,
      target,
      PLAYER.acceleration,
      PLAYER.friction,
      dt
    );

    const next: Vec2 = {
      x: this.position.x + this.velocity.x * dt,
      y: this.position.y + this.velocity.y * dt,
    };
    this.position = collide(this.position, next, PLAYER.radius);

    // Only turn while actually moving, otherwise the proto would snap back to a default heading when it stops
    const speedSq = this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y;
    if (speedSq > 0.0001) {
      const goal = Math.atan2(this.velocity.x, this.velocity.y);
      this.facing = turnTowards(this.facing, goal, PLAYER.turnSpeed * dt);
    }

    this.syncObject();
  }

  get worldPosition(): Vec2 {
    return { ...this.position };
  }

  private syncObject() {
    this.object.position.set(this.position.x, 0, this.position.y);
    this.object.rotation.y = this.facing;
  }
}
