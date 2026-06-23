// Abstract actions the game responds to, separate from the physical keys that trigger them
// Adding a controller or remapping keys later = changing only KEY_BINDINGS below
export type GameAction = "up" | "down" | "left" | "right" | "interact" | "cancel";

// (matched against KeyboardEvent.code, so layout independent)
export const KEY_BINDINGS: Record<string, GameAction> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  KeyE: "interact",
  Enter: "interact",
  Escape: "cancel",
};
