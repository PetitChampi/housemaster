import { KEY_BINDINGS, type GameAction } from "@/game/config/bindings";

// Tracks which movement keys are held + exposes result as a raw input axis
// The axis lives in "screen space" (forward = up the screen). The player turns it into a world direction using the camera basis.
// = Differentiating what is pressed vs how it translates in the 3d world
export class Input {
  private held = new Set<GameAction>();
  private active = true;
  private interactQueued = false;

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  // While inactive (tool window open) the player shouldn't drift, so movement reads as zero and held keys are cleared
  setActive(active: boolean) {
    this.active = active;
    if (!active) {
      this.held.clear();
      this.interactQueued = false;
    }
  }

  // True at most once per keypress, so holding the interact key doesn't reopen the tool every frame
  consumeInteract(): boolean {
    if (!this.interactQueued) return false;
    this.interactQueued = false;
    return true;
  }

  // Forward on y axis, strafe on x axis, each in range -1 to 1
  getAxis(): { x: number; y: number } {
    if (!this.active) return { x: 0, y: 0 };
    const x = (this.held.has("right") ? 1 : 0) - (this.held.has("left") ? 1 : 0);
    const y = (this.held.has("up") ? 1 : 0) - (this.held.has("down") ? 1 : 0);
    return { x, y };
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.held.clear();
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    const action = KEY_BINDINGS[event.code];
    if (!action || !this.active) return;
    if (action === "up" || action === "down" || action === "left" || action === "right") {
      event.preventDefault();
      this.held.add(action);
    } else if (action === "interact") {
      event.preventDefault();
      this.interactQueued = true;
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const action = KEY_BINDINGS[event.code];
    if (action) this.held.delete(action);
  };
}
