import * as THREE from "three";
import { WALL } from "@/game/config/constants";
import type { FloorKind, WallLayout } from "@/game/world/layout";

type ScreenContent = "accounting" | "calendar" | "kanban" | "tasks" | "travel";

const textureCache = new Map<string, THREE.CanvasTexture>();

export function floorTexture(kind: FloorKind, width: number, depth: number, anisotropy: number, minX = 0, maxZ = 0): THREE.Texture {
  const base = cachedTexture(`floor:${kind}`, () => drawFloor(kind));
  const texture = base.clone();
  const periodX = kind === "wood" ? 3.6 : kind === "hexTile" ? 0.8 : 1.2;
  const periodZ = kind === "wood" ? 2.4 : kind === "hexTile" ? 0.8 * Math.sqrt(3) / 2 : periodX;
  texture.repeat.set(width / periodX, depth / periodZ);
  texture.offset.set(minX / periodX, -maxZ / periodZ);
  configureTexture(texture, anisotropy);
  return texture;
}

export function bathroomTileTexture(width: number, height: number, anisotropy: number): THREE.Texture {
  const texture = cachedTexture("wall:squareTile", () => drawSquareTiles()).clone();
  texture.repeat.set(width / 0.6, height / 0.6);
  configureTexture(texture, anisotropy);
  return texture;
}

export function screenTexture(content: ScreenContent): THREE.Texture {
  const texture = cachedTexture(`screen:${content}`, () => drawScreen(content)).clone();
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function rattanTexture(width: number, height: number): THREE.Texture {
  const texture = cachedTexture("rattan", drawRattan).clone();
  texture.repeat.set(width / 0.16, height / 0.16);
  configureTexture(texture, 4);
  return texture;
}

export function decoratedWallTexture(wall: WallLayout, paint: number, anisotropy: number, tiling = false): THREE.Texture {
  const texture = cachedTexture(`wall:${wall.id}:${paint}:${tiling}`, () => drawDecoratedWall(wall, paint, tiling)).clone();
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function clearTextureCache() {
  for (const texture of textureCache.values()) texture.dispose();
  textureCache.clear();
}

function cachedTexture(key: string, draw: () => HTMLCanvasElement): THREE.CanvasTexture {
  const cached = textureCache.get(key);
  if (cached) return cached;
  const texture = new THREE.CanvasTexture(draw());
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

function configureTexture(texture: THREE.Texture, anisotropy: number) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
}

function canvas(size = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const element = document.createElement("canvas");
  element.width = size;
  element.height = size;
  const context = element.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");
  return [element, context];
}

function drawFloor(kind: FloorKind): HTMLCanvasElement {
  if (kind === "wood") return drawWood();
  if (kind === "hexTile") return drawHexTiles();
  return drawSquareTiles();
}

function drawDecoratedWall(wall: WallLayout, paint: number, tiling: boolean): HTMLCanvasElement {
  const vertical = wall.from.x === wall.to.x;
  const start = vertical ? Math.min(wall.from.y, wall.to.y) : Math.min(wall.from.x, wall.to.x);
  const length = vertical ? Math.abs(wall.to.y - wall.from.y) : Math.abs(wall.to.x - wall.from.x);
  const [element, context] = canvas(1024);
  element.width = Math.round(element.height * length / WALL.height);
  context.fillStyle = `#${paint.toString(16).padStart(6, "0")}`;
  context.fillRect(0, 0, element.width, element.height);
  const scaleX = element.width / length;
  const scaleY = element.height / WALL.height;
  // Metre-based rectangles are baked directly into the wall's colour map.
  // Painted bevels retain the panelled appearance without extra transparent layers.
  const rect = (x: number, y: number, width: number, height: number, colour: string) => {
    context.fillStyle = colour;
    context.fillRect((x - start) * scaleX, element.height - (y + height) * scaleY, width * scaleX, height * scaleY);
  };
  const band = tiling && wall.bathroomTiling;
  if (band) {
    rect(band.from, 0, band.to - band.from, band.height, "#d1ceca");
    const size = 0.15;
    const grout = size * 4 / 128;
    for (let column = Math.floor(band.from / size); column < Math.ceil(band.to / size); column += 1) {
      for (let row = 0; row < Math.ceil(band.height / size); row += 1) {
        const left = Math.max(band.from, column * size + grout);
        const right = Math.min(band.to, (column + 1) * size - grout);
        const bottom = row * size + grout;
        const top = Math.min(band.height, (row + 1) * size - grout);
        if (right > left && top > bottom) rect(left, bottom, right - left, top - bottom, (column + row) % 3 === 0 ? "#f7f6f1" : "#efeee9");
      }
    }
  }
  const door = wall.doorDecoration;
  if (!door) return element;
  const left = door.centre - door.width / 2;
  rect(left - 0.04, 0, door.width + 0.08, door.height + 0.045, "#f4f1e9");
  rect(left - 0.04, 0, 0.009, door.height + 0.045, "#b5ada0");
  rect(left + door.width + 0.031, 0, 0.009, door.height + 0.045, "#d0c8bb");
  rect(left - 0.04, door.height + 0.036, door.width + 0.08, 0.009, "#fffaf0");
  rect(left, 0, door.width, door.height, "#a9a195");
  rect(left + 0.009, 0, door.width - 0.018, door.height - 0.009, "#e3ded3");
  for (const [bottom, height] of [[0.16, door.height * 0.32], [door.height * 0.49, door.height * 0.41]]) {
    rect(left + 0.075, bottom, door.width - 0.15, height, "#bdb5a8");
    rect(left + 0.084, bottom + 0.009, door.width - 0.168, height - 0.018, "#f6f1e7");
    rect(left + 0.094, bottom + 0.018, door.width - 0.188, height - 0.036, "#ede8dd");
  }
  rect(left + door.width - 0.115, 0.94, 0.026, 0.12, "#9b8056");
  rect(left + door.width - 0.18, 1.005, 0.09, 0.018, "#b69b6d");
  return element;
}

function drawWood(): HTMLCanvasElement {
  const size = 1024;
  const [element, context] = canvas(size);
  context.fillStyle = "#563f2d";
  context.fillRect(0, 0, size, size);
  let seed = 2749;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const plankHeight = 64;
  for (let row = 0; row < size / plankHeight; row += 1) {
    const offset = Math.floor(random() * size);
    const lengths = Array.from({ length: 3 + row % 3 }, () => 0.65 + random());
    const total = lengths.reduce((sum, length) => sum + length, 0);
    let travelled = 0;
    for (const length of lengths) {
      const start = Math.round(travelled / total * size);
      travelled += length;
      const width = Math.round(travelled / total * size) - start;
      const lightness = 29 + Math.floor(random() * 8);
      const grainOffset = random() * 7;
      // Repeat the same plank at the edges to keep joints and grain seamless
      for (let repeat = -1; repeat <= 1; repeat += 1) {
        const x = offset + start + repeat * size;
        const y = row * plankHeight;
        context.fillStyle = `hsl(27 34% ${lightness}%)`;
        context.fillRect(x + 1, y + 1, width - 2, plankHeight - 2);
        context.strokeStyle = "rgba(31, 20, 14, 0.28)";
        context.strokeRect(x + 1, y + 1, width - 2, plankHeight - 2);
        context.strokeStyle = "rgba(255, 245, 225, 0.06)";
        for (let grain = 0; grain < 3; grain += 1) {
          const grainY = y + 12 + grain * 15 + grainOffset;
          context.beginPath();
          context.moveTo(x + width * 0.06, grainY);
          context.bezierCurveTo(x + width * 0.27, grainY - 5, x + width * 0.68, grainY + 6, x + width * 0.94, grainY);
          context.stroke();
        }
      }
    }
  }
  return element;
}

function drawHexTiles(): HTMLCanvasElement {
  const [element, context] = canvas();
  context.fillStyle = "#dbc5bc";
  context.fillRect(0, 0, 512, 512);
  const pitch = 128;
  for (let row = -1; row <= 4; row += 1) {
    for (let column = -1; column <= 4; column += 1) {
      const x = column * pitch + (row % 2 !== 0 ? pitch / 2 : 0);
      const y = row * pitch;
      hexPath(context, x, y, pitch);
      const seed = ((row % 4 + 4) % 4) * 7 + ((column % 4 + 4) % 4);
      context.fillStyle = seed % 4 === 0 ? "#8d3345" : "#9c3b50";
      context.fill();
      context.strokeStyle = "#c9bfb3";
      context.lineWidth = 3;
      context.stroke();
    }
  }
  return element;
}

function hexPath(context: CanvasRenderingContext2D, x: number, y: number, pitch: number) {
  context.beginPath();
  const corners = [[0, -2 / 3], [0.5, -1 / 3], [0.5, 1 / 3], [0, 2 / 3], [-0.5, 1 / 3], [-0.5, -1 / 3]];
  for (let index = 0; index < corners.length; index += 1) {
    const px = x + corners[index][0] * pitch;
    const py = y + corners[index][1] * pitch;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
}

function drawSquareTiles(): HTMLCanvasElement {
  const [element, context] = canvas();
  context.fillStyle = "#d1ceca";
  context.fillRect(0, 0, 512, 512);
  const size = 128;
  for (let y = 0; y < 512; y += size) {
    for (let x = 0; x < 512; x += size) {
      context.fillStyle = (x + y) / size % 3 === 0 ? "#f7f6f1" : "#efeee9";
      context.fillRect(x + 4, y + 4, size - 8, size - 8);
    }
  }
  return element;
}

function drawRattan(): HTMLCanvasElement {
  const [element, context] = canvas();
  context.fillStyle = "#a98c61";
  context.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const x = column * 64;
      const y = row * 64;
      const horizontal = (row + column) % 2 === 0;
      context.fillStyle = horizontal ? "#cfb58c" : "#bea077";
      context.fillRect(x + (horizontal ? 0 : 5), y + (horizontal ? 5 : 0), horizontal ? 64 : 54, horizontal ? 54 : 64);
      context.fillStyle = "#ddc7a4";
      for (let strand = 0; strand < 4; strand += 1) {
        if (horizontal) context.fillRect(x, y + 12 + strand * 11, 64, 2);
        else context.fillRect(x + 12 + strand * 11, y, 2, 64);
      }
    }
  }
  return element;
}

function drawScreen(content: ScreenContent): HTMLCanvasElement {
  const [element, context] = canvas(768);
  if (content === "travel") return drawTravel(element, context);
  context.fillStyle = content === "tasks" ? "#f3ead8" : "#edf1f0";
  context.fillRect(0, 0, 768, 768);
  context.fillStyle = "#29333d";
  context.font = "700 58px system-ui";
  const heading = content === "calendar" ? "Today" : content === "kanban" ? "House board" : content === "accounting" ? "Overview" : "Task hub";
  context.fillText(heading, 50, 86);
  if (content === "calendar") drawCalendar(context);
  else if (content === "kanban") drawKanban(context);
  else if (content === "accounting") drawAccounting(context);
  else drawTasks(context);
  return element;
}

function drawCalendar(context: CanvasRenderingContext2D) {
  context.fillStyle = "#9a2845";
  context.font = "700 88px system-ui";
  context.fillText("7", 54, 198);
  context.fillStyle = "#554e4f";
  context.font = "500 36px system-ui";
  context.fillText("NOVEMBER", 168, 176);
  context.font = "500 28px system-ui";
  context.fillText("Dinner · 19:30", 54, 280);
  context.fillText("Water the plants", 54, 338);
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      context.fillStyle = row === 0 && column === 5 ? "#d25374" : "#ffffff";
      context.beginPath();
      context.arc(82 + column * 94, 445 + row * 61, 22, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function drawTasks(context: CanvasRenderingContext2D) {
  const notes = ["Laundry", "Call Mum", "Water plants", "Book train", "Buy oats", "Fix lamp"];
  const colours = ["#ffd48f", "#f4b8c8", "#b8d7c2"];
  notes.forEach((note, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    context.fillStyle = colours[index % colours.length];
    context.fillRect(50 + column * 235, 145 + row * 245, 195, 190);
    context.fillStyle = "#493f38";
    context.font = "600 28px system-ui";
    context.fillText(note, 66 + column * 235, 205 + row * 245);
  });
}

function drawKanban(context: CanvasRenderingContext2D) {
  ["TO DO", "DOING", "DONE"].forEach((title, column) => {
    const x = 40 + column * 242;
    context.fillStyle = "#6c7775";
    context.font = "700 25px system-ui";
    context.fillText(title, x, 145);
    for (let row = 0; row < 3 - column; row += 1) {
      context.fillStyle = row % 2 ? "#f6cf8a" : "#ffffff";
      context.fillRect(x, 176 + row * 142, 205, 108);
      context.fillStyle = "#49515a";
      context.fillRect(x + 18, 204 + row * 142, 130, 9);
      context.fillRect(x + 18, 230 + row * 142, 164, 9);
    }
  });
}

function drawAccounting(context: CanvasRenderingContext2D) {
  context.fillStyle = "#7c8ea2";
  context.fillRect(50, 140, 310, 170);
  context.fillStyle = "#ffffff";
  context.font = "500 28px system-ui";
  context.fillText("This month", 78, 196);
  context.font = "700 54px system-ui";
  context.fillText("£1,842", 78, 265);
  const bars = [160, 250, 190, 330, 275, 410];
  bars.forEach((height, index) => {
    context.fillStyle = index === 5 ? "#d25374" : "#abb6c4";
    context.fillRect(60 + index * 108, 690 - height, 62, height);
  });
}

function drawTravel(element: HTMLCanvasElement, context: CanvasRenderingContext2D): HTMLCanvasElement {
  context.fillStyle = "#e7dfca";
  context.fillRect(0, 0, 768, 768);
  context.fillStyle = "#4e8175";
  context.beginPath();
  context.ellipse(220, 330, 170, 90, -0.25, 0, Math.PI * 2);
  context.ellipse(500, 360, 200, 105, 0.18, 0, Math.PI * 2);
  context.ellipse(435, 540, 74, 135, -0.16, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#9a2845";
  [[190, 315], [420, 310], [540, 405], [460, 545]].forEach(([x, y]) => {
    context.beginPath();
    context.arc(x, y, 17, 0, Math.PI * 2);
    context.fill();
  });
  context.fillStyle = "#554e4f";
  context.font = "700 52px system-ui";
  context.fillText("PLACES TO GO", 50, 86);
  return element;
}
