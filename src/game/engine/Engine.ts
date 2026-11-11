import * as THREE from "three";
import { CAMERA, INTERACTION, SCENE, WALL } from "@/game/config/constants";
import type { GameCallbacks } from "@/game/bridge/callbacks";
import { Input } from "@/game/engine/Input";
import { Loop } from "@/game/engine/Loop";
import { Player } from "@/game/player/Player";
import type { Vec2 } from "@/game/player/movement";
import { World } from "@/game/world/World";
import { ENTRANCE, ROOMS, SPAWN, WALLS } from "@/game/world/layout";
import { floorRegions } from "@/game/world/floors";
import { fitDirectionalShadow } from "@/game/engine/shadows";
import type { Interactable } from "@/game/world/Interactable";
import { findNearest } from "@/game/interaction/proximity";
import { pickInteractable } from "@/game/interaction/picking";
import { clearTextureCache } from "@/game/world/textures";

// Owns the renderer + isometric camera + simulation loop, lives entirely outside React
// React boots one Engine into a container and later disposes it (everything 3D happens in here)
export class Engine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.OrthographicCamera;
  private readonly input: Input;
  private readonly loop: Loop;
  private readonly player: Player;
  private readonly world: World;
  private readonly raycaster = new THREE.Raycaster();
  private readonly resizeObserver: ResizeObserver;

  // movement basis derived from the camera angle
  private readonly forward: Vec2;
  private readonly right: Vec2;
  private readonly cameraTarget = new THREE.Vector3();

  private active = true;
  private entranceArmed = true;
  private nearest: Interactable | null = null;
  private hovered: Interactable | null = null;
  private highlighted = new Set<Interactable>();

  constructor(
    private readonly container: HTMLElement,
    private readonly callbacks: GameCallbacks
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SCENE.background);

    this.camera = new THREE.OrthographicCamera();
    this.camera.near = CAMERA.near;
    this.camera.far = CAMERA.far;
    this.applyCameraFrustum();

    this.addLights();

    this.world = new World(this.renderer.capabilities.getMaxAnisotropy());
    this.scene.add(this.world.group);

    this.player = new Player(SPAWN);
    this.scene.add(this.player.object);
    this.cameraTarget.set(SPAWN.x, 0, SPAWN.y);

    // Flatten the camera-to-target direction onto the floor to get "forward", then rotate it a quarter turn for "right"
    const f = new THREE.Vector2(-CAMERA.offset.x, -CAMERA.offset.z).normalize();
    this.forward = { x: f.x, y: f.y };
    this.right = { x: -f.y, y: f.x };

    this.input = new Input();
    this.loop = new Loop(this.step, this.render);

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(container);
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.renderer.domElement.addEventListener("pointerdown", this.handlePointer);
    this.renderer.domElement.addEventListener("pointermove", this.handlePointerMove);
    this.renderer.domElement.addEventListener("pointerleave", this.handlePointerLeave);

    // Nothing is in reach until the player walks up to an interactable
    this.callbacks.onPromptChange(null);
  }

  start() {
    this.loop.start();
  }

  // Pause the simulation while a tool window is open so the character stays still behind it
  setActive(active: boolean) {
    this.active = active;
    this.input.setActive(active);
    if (!active) {
      this.setNearest(null);
      this.setHovered(null);
    }
  }

  dispose() {
    this.loop.stop();
    this.input.dispose();
    this.resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointer);
    this.renderer.domElement.removeEventListener("pointermove", this.handlePointerMove);
    this.renderer.domElement.removeEventListener("pointerleave", this.handlePointerLeave);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        if (object.customDepthMaterial) materials.add(object.customDepthMaterial);
        if (object.customDistanceMaterial) materials.add(object.customDistanceMaterial);
        const material = object.material;
        if (Array.isArray(material)) material.forEach((entry) => materials.add(entry));
        else materials.add(material);
      }
    });
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
      material.dispose();
    }
    textures.forEach((texture) => texture.dispose());
    geometries.forEach((geometry) => geometry.dispose());
    clearTextureCache();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private step = (dt: number) => {
    if (!this.active) return;
    const axis = this.input.getAxis();
    const direction: Vec2 = {
      x: this.right.x * axis.x + this.forward.x * axis.y,
      y: this.right.y * axis.x + this.forward.y * axis.y,
    };
    this.player.update(direction, dt, this.world.collide);
    const position = this.player.worldPosition;
    const entranceDistance = position.y - ENTRANCE.z;
    if (entranceDistance > 1.1) this.entranceArmed = true;
    if (this.entranceArmed && entranceDistance < 0.7 && Math.abs(position.x - ENTRANCE.x) < ENTRANCE.width / 2) {
      this.entranceArmed = false;
      this.setActive(false);
      this.callbacks.onExitHouse();
      return;
    }

    this.setNearest(
      findNearest(
        this.player.worldPosition,
        this.world.interactables,
        INTERACTION.reach,
        this.callbacks.canOpenTool,
        this.world.interactionWalls
      )
    );

    if (this.nearest && this.input.consumeInteract()) {
      this.callbacks.onOpenTool(this.nearest.toolId);
    }
  };

  // Track the interactable in reach: drives prompt + highlight source
  private setNearest(next: Interactable | null) {
    if (next === this.nearest) return;
    this.nearest = next;
    this.callbacks.onPromptChange(next ? `Press E to open ${next.title}` : null);
    this.refreshHighlights();
  }

  private setHovered(next: Interactable | null) {
    if (next === this.hovered) return;
    this.hovered = next;
    this.renderer.domElement.style.cursor = next ? "pointer" : "default";
    this.refreshHighlights();
  }

  // Highlight whatever is in reach or under the cursor
  private refreshHighlights() {
    const desired = new Set<Interactable>();
    if (this.nearest) desired.add(this.nearest);
    if (this.hovered) desired.add(this.hovered);
    for (const item of this.highlighted) {
      if (!desired.has(item)) item.setHighlighted(false);
    }
    for (const item of desired) {
      if (!this.highlighted.has(item)) item.setHighlighted(true);
    }
    this.highlighted = desired;
  }

  // clicking on an interactable opens it, as an alternative to walking up and pressing E
  private handlePointer = (event: PointerEvent) => {
    if (!this.active) return;
    const hit = this.pick(event);
    if (hit && this.callbacks.canOpenTool(hit.toolId)) {
      this.callbacks.onOpenTool(hit.toolId);
    }
  };

  private handlePointerMove = (event: PointerEvent) => {
    if (!this.active) return;
    const hit = this.pick(event);
    this.setHovered(hit && this.callbacks.canOpenTool(hit.toolId) ? hit : null);
  };

  private handlePointerLeave = () => this.setHovered(null);

  private pick(event: PointerEvent): Interactable | null {
    const item = pickInteractable(
      event,
      this.renderer.domElement,
      this.camera,
      this.raycaster,
      this.world.interactableMeshes()
    );
    return item && this.world.isAccessible(this.player.worldPosition, item) ? item : null;
  }

  private render = (frameTime: number) => {
    this.followPlayer(frameTime);
    this.world.updateVisibility(this.player.worldPosition, frameTime);
    for (const item of this.world.interactables) item.updateHighlight(frameTime);
    this.renderer.render(this.scene, this.camera);
  };

  // Ease the camera so it trails the player rather than snapping + keeps the fixed isometric offset
  // Exponential smoothing on the real frame time (identical follow speed on any refresh rate)
  private followPlayer(frameTime: number) {
    const pos = this.player.worldPosition;
    const t = 1 - Math.exp(-CAMERA.followLerp * frameTime);
    this.cameraTarget.x += (pos.x - this.cameraTarget.x) * t;
    this.cameraTarget.z += (pos.y - this.cameraTarget.z) * t;
    this.camera.position.set(
      this.cameraTarget.x + CAMERA.offset.x,
      CAMERA.offset.y,
      this.cameraTarget.z + CAMERA.offset.z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  private addLights() {
    this.scene.add(new THREE.HemisphereLight(0xfffbf3, 0xb8afa6, 0.82));
    const key = new THREE.DirectionalLight(0xfff4df, 1.55);
    key.position.set(4, 8, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    const bounds = new THREE.Box3();
    for (const rect of ROOMS.flatMap((room) => floorRegions(room, WALLS))) {
      bounds.expandByPoint(new THREE.Vector3(rect.minX, 0, rect.minZ));
      bounds.expandByPoint(new THREE.Vector3(rect.maxX, WALL.height, rect.maxZ));
    }
    fitDirectionalShadow(key, bounds);
    this.scene.add(key);
  }

  private applyCameraFrustum() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const half = CAMERA.viewSize;
    this.camera.left = -half * aspect;
    this.camera.right = half * aspect;
    this.camera.top = half;
    this.camera.bottom = -half;
    this.camera.updateProjectionMatrix();
  }

  private handleResize = () => {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.applyCameraFrustum();
  };

  private handleVisibility = () => {
    if (document.hidden) this.loop.stop();
    else this.loop.start();
  };
}
