// Tunables for the 3D flat
// Distances are in metres

export const SCENE = {
  background: 0x1b1d23,
};

// Orthographic isometric camera
export const CAMERA = {
  offset: { x: 8, y: 12, z: 8 },
  viewSize: 5.2,
  near: 0.1,
  far: 200,
  followLerp: 8,
};

export const PLAYER = {
  radius: 0.23,
  height: 0.9,
  colour: 0x7189b8,
  maxSpeed: 2.2,
  acceleration: 18,
  friction: 14,
  turnSpeed: 12,
};

export const WALL = {
  thickness: 0.12,
  height: 2.62,
  fadedOpacity: 0.22,
  fadeSpeed: 12,
};

export const FURNITURE = {
  highlight: 0xe59a3a,
  highlightIntensity: 0.32,
  highlightSpeed: 12,
};

export const INTERACTION = {
  reach: 0.92,
};

export const SIM = {
  timestep: 1 / 60, // deterministic simulation timestep, regardless of frame rate
  maxStepsPerFrame: 5,
};
