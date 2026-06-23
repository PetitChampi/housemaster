// Pure helpers for character movement, no three.js for better testability

export interface Vec2 {
  x: number;
  y: number;
}

// Diagonal input would travel faster than cardinal input if not clamping anything past unit length back to it
export function clampToUnit(v: Vec2): Vec2 {
  const lengthSq = v.x * v.x + v.y * v.y;
  if (lengthSq <= 1) return v;
  const length = Math.sqrt(lengthSq);
  return { x: v.x / length, y: v.y / length };
}

// Ease current velocity towards a target, accelerating / braking w/ input start / stop
// Returns the new velocity after one step of length dt
export function approachVelocity(
  velocity: Vec2,
  target: Vec2,
  acceleration: number,
  friction: number,
  dt: number
): Vec2 {
  const hasInput = target.x !== 0 || target.y !== 0;
  const rate = hasInput ? acceleration : friction;
  return {
    x: moveTowards(velocity.x, target.x, rate * dt),
    y: moveTowards(velocity.y, target.y, rate * dt),
  };
}

// Step a value towards a goal by at most maxDelta w/o overshooting
function moveTowards(value: number, goal: number, maxDelta: number): number {
  const diff = goal - value;
  if (Math.abs(diff) <= maxDelta) return goal;
  return value + Math.sign(diff) * maxDelta;
}

// Rotate an angle towards a goal by at most the given step (shortest way round the circle)
export function turnTowards(angle: number, goal: number, maxStep: number): number {
  let diff = goal - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) <= maxStep) return goal;
  return angle + Math.sign(diff) * maxStep;
}
