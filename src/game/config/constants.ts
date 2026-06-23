// Tunables for the 3D house
// Distances are in world units (one unit is roughly a metre)

export const SCENE = {
  background: 0x1b1d23,
  floorColour: 0x2a2d36,
  gridColour: 0x3a3e4a,
  floorSize: 40,
};

// Orthographic isometric camera
export const CAMERA = {
  offset: { x: 16, y: 18, z: 16 },
  viewSize: 14,
  near: 0.1,
  far: 200,
  followLerp: 8,
};

export const PLAYER = {
  radius: 0.6,
  height: 1.2,
  colour: 0x8ab4f8,
  maxSpeed: 6,
  acceleration: 60,
  friction: 40,
  turnSpeed: 12,
};

export const WALL = {
  thickness: 0.3,
  height: 2.4,
  colour: 0x3f4452,
  doorway: 3,
};

export const FURNITURE = {
  colour: 0x9aa0aa,
  highlight: 0xf6c177,
};

export const INTERACTION = {
  reach: 2.4,
};

export const SIM = {
  timestep: 1 / 60, // deterministic simulation timestep, regardless of frame rate
  maxStepsPerFrame: 5,
};
