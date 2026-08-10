"use client";

/**
 * Procedural surface maps for the gallery shell.
 * Canvas/Data textures — no external image fetches, mobile-safe sizes.
 */

import {
  CanvasTexture,
  Color,
  DataTexture,
  LinearFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from "three";

import type { FloorStyle } from "@/core/entities";

export function createFloorTexture(
  style: FloorStyle,
  baseHex: string,
  opts: { mobile?: boolean } = {},
): CanvasTexture {
  const size = opts.mobile ? 256 : 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const base = new Color(baseHex);

  switch (style) {
    case "parquet":
      paintParquet(ctx, size, base);
      break;
    case "concrete":
      paintConcrete(ctx, size, base);
      break;
    case "stone":
      paintStone(ctx, size, base);
      break;
    case "plank":
    default:
      paintPlanks(ctx, size, base);
      break;
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = opts.mobile ? 2 : 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Multiplicative plaster detail (centred near white) so material.color
 * from the inspector stays the visible albedo under ACES lighting.
 */
export function createWallTexture(
  _baseHex: string,
  opts: { mobile?: boolean } = {},
): DataTexture {
  const size = opts.mobile ? 96 : 192;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      // Fine grain — keep very quiet so walls don't read as gravel.
      const fine = (hash2(x, y) - 0.5) * 3.2;
      // Large soft blotches (plaster roller / skim variation).
      const blotch =
        (smoothHash(x / 28, y / 22) - 0.5) * 7 +
        (smoothHash(x / 11, y / 14) - 0.5) * 3.5;
      // Gentle vertical wash — slightly brighter mid-height.
      const wash = Math.sin((y / size) * Math.PI) * 2.2;
      // Very soft horizontal drift so repeats don't lock into a grid.
      const drift = (smoothHash(x / 40, y / 60) - 0.5) * 2;
      const n = fine + blotch + wash + drift;
      const o = i * 4;
      // Bias slightly under 255 so lit plaster doesn't blow to pure white.
      const mid = 236;
      data[o] = clampByte(mid + n);
      data[o + 1] = clampByte(mid + n * 0.96);
      data[o + 2] = clampByte(mid + n * 0.92);
      data[o + 3] = 255;
    }
  }

  return finishDataTexture(data, size);
}

/**
 * Quiet multiplicative ceiling detail — colour comes from material.color.
 */
export function createCeilingTexture(
  _baseHex: string,
  opts: { mobile?: boolean } = {},
): DataTexture {
  const size = opts.mobile ? 64 : 128;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const fine = (hash2(x + 17, y + 9) - 0.5) * 2.8;
      const blotch = (smoothHash(x / 16, y / 16) - 0.5) * 5;
      const cx = x / size - 0.5;
      const cy = y / size - 0.5;
      const radial = (cx * cx + cy * cy) * 10;
      const n = fine + blotch - radial;
      const o = i * 4;
      const mid = 242;
      data[o] = clampByte(mid + n);
      data[o + 1] = clampByte(mid + n * 0.97);
      data[o + 2] = clampByte(mid + n * 0.94);
      data[o + 3] = 255;
    }
  }

  return finishDataTexture(data, size);
}

export function disposeTexture(
  texture: CanvasTexture | DataTexture | null | undefined,
): void {
  texture?.dispose();
}

function finishDataTexture(data: Uint8Array, size: number): DataTexture {
  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Directional oak-style planks with grain, butt joints, and soft bevels. */
function paintPlanks(
  ctx: CanvasRenderingContext2D,
  size: number,
  base: Color,
): void {
  // Base fill first — gaps must never sample cleared/transparent canvas (black).
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  // Slightly finer boards read better in large halls without looking busy.
  const rows = 8;
  const plankH = size / rows;
  for (let row = 0; row < rows; row++) {
    const y = row * plankH;
    const rowShift = (row % 2) * (size / 3.2);
    const plankW = size / 3.8;
    const gap = 0.5;
    for (let col = -1; col < 7; col++) {
      const x = col * plankW + rowShift;
      const shade = (hash2(row, col) - 0.5) * 0.055;
      const warm = (hash2(col + 3, row) - 0.5) * 0.018;
      const c = base.clone().offsetHSL(warm, 0.012 * shade, shade);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x, y, plankW - gap, plankH - gap);

      // Soft butt joint (end grain) — tinted, not near-black
      ctx.fillStyle = "rgba(55,38,22,0.055)";
      ctx.fillRect(x + plankW - gap, y, gap, plankH - gap);

      // Directional grain — mostly horizontal with slight wave
      const grainAlpha = 0.02 + hash2(col, row) * 0.028;
      ctx.strokeStyle = `rgba(55,36,20,${grainAlpha})`;
      ctx.lineWidth = 1;
      const grains = 10;
      for (let g = 0; g < grains; g++) {
        const gy = y + 2.5 + hash2(row * 17 + g, col) * (plankH - 5);
        const wave = (hash2(g, row) - 0.5) * 2.6;
        ctx.beginPath();
        ctx.moveTo(x + 2, gy);
        ctx.quadraticCurveTo(
          x + plankW * 0.45,
          gy + wave,
          x + plankW - 4,
          gy + wave * 0.4,
        );
        ctx.stroke();
      }

      // Soft top bevel highlight (matte wood, not plastic)
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.beginPath();
      ctx.moveTo(x + 1, y + 1);
      ctx.lineTo(x + plankW - 2, y + 1);
      ctx.stroke();
      // Soft bottom shade
      ctx.strokeStyle = "rgba(0,0,0,0.032)";
      ctx.beginPath();
      ctx.moveTo(x + 1, y + plankH - 1.6);
      ctx.lineTo(x + plankW - 2, y + plankH - 1.6);
      ctx.stroke();
    }
    // Long board seam — warm brown, not harsh black strips
    ctx.fillStyle = "rgba(48,32,18,0.065)";
    ctx.fillRect(0, y + plankH - gap, size, gap);
  }
}

function paintParquet(
  ctx: CanvasRenderingContext2D,
  size: number,
  base: Color,
): void {
  const cell = size / 4;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = col * cell;
      const y = row * cell;
      const horizontal = (row + col) % 2 === 0;
      const shade = (hash2(row, col) - 0.5) * 0.06;
      const c = base.clone().offsetHSL(0.008 * shade, 0.02, shade);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x, y, cell, cell);

      const strip = cell / 5;
      // Strip grain
      for (let i = 0; i < 5; i++) {
        const stripShade = (hash2(row * 5 + i, col) - 0.5) * 0.025;
        const sc = c.clone().offsetHSL(0, 0, stripShade);
        if (horizontal) {
          ctx.fillStyle = `#${sc.getHexString()}`;
          ctx.fillRect(x + 1, y + i * strip + 0.5, cell - 2, strip - 1);
        } else {
          ctx.fillStyle = `#${sc.getHexString()}`;
          ctx.fillRect(x + i * strip + 0.5, y + 1, strip - 1, cell - 2);
        }
      }

      ctx.strokeStyle = "rgba(48,32,16,0.08)";
      ctx.lineWidth = 1;
      if (horizontal) {
        for (let i = 1; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(x + 1, y + i * strip);
          ctx.lineTo(x + cell - 1, y + i * strip);
          ctx.stroke();
        }
      } else {
        for (let i = 1; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * strip, y + 1);
          ctx.lineTo(x + i * strip, y + cell - 1);
          ctx.stroke();
        }
      }
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
      ctx.strokeStyle = "rgba(40,28,16,0.08)";
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
    }
  }
}

function paintConcrete(
  ctx: CanvasRenderingContext2D,
  size: number,
  base: Color,
): void {
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);
  const image = ctx.getImageData(0, 0, size, size);
  const d = image.data;
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    const fine = (hash2(x, y) - 0.5) * 18;
    const blotch = (smoothHash(x / 14, y / 14) - 0.5) * 12;
    const n = fine + blotch;
    const o = i * 4;
    d[o] = clampByte(d[o]! + n);
    d[o + 1] = clampByte(d[o + 1]! + n * 0.95);
    d[o + 2] = clampByte(d[o + 2]! + n * 0.9);
  }
  ctx.putImageData(image, 0, 0);

  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    const y = (size / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (hash2(i, 3) - 0.5) * 4);
    ctx.stroke();
  }
}

function paintStone(
  ctx: CanvasRenderingContext2D,
  size: number,
  base: Color,
): void {
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  // Large museum slabs (~4×4 in the map) so repeats read as big polished tiles.
  const tiles = 4;
  const tile = size / tiles;
  const joint = Math.max(1.2, size * 0.004);

  for (let row = 0; row < tiles; row++) {
    for (let col = 0; col < tiles; col++) {
      const x = col * tile;
      const y = row * tile;
      const shade = (hash2(row * 3, col * 5) - 0.5) * 0.045;
      const cool = (hash2(col, row + 2) - 0.5) * 0.01;
      const c = base.clone().offsetHSL(cool, -0.015, shade);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x + joint, y + joint, tile - joint * 2, tile - joint * 2);

      // Soft marble veining — quiet, not cartoon cracks.
      const veins = 3 + Math.floor(hash2(row + 9, col + 4) * 3);
      for (let v = 0; v < veins; v++) {
        const alpha = 0.035 + hash2(v, row * col + 1) * 0.045;
        const warmVein = hash2(col + v, row) > 0.55;
        ctx.strokeStyle = warmVein
          ? `rgba(90,78,68,${alpha})`
          : `rgba(55,62,70,${alpha})`;
        ctx.lineWidth = 0.8 + hash2(v + 2, col) * 1.4;
        const x0 = x + joint * 2 + hash2(row, v) * (tile - joint * 4);
        const y0 = y + joint * 2 + hash2(v, col) * (tile - joint * 4);
        const x1 = x0 + (hash2(v + 3, row) - 0.5) * tile * 0.85;
        const y1 = y0 + (hash2(col, v + 5) - 0.35) * tile * 0.9;
        const cx = (x0 + x1) / 2 + (hash2(v, row + col) - 0.5) * tile * 0.35;
        const cy = (y0 + y1) / 2 + (hash2(row + v, col) - 0.5) * tile * 0.25;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(cx, cy, x1, y1);
        ctx.stroke();
      }

      // Fine crystalline speckles
      for (let s = 0; s < 10; s++) {
        const sx = x + joint + hash2(row + s, col) * (tile - joint * 2);
        const sy = y + joint + hash2(col + s, row) * (tile - joint * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.02 + hash2(s, row) * 0.03})`;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // Soft bevel — polished edge catchlight, not harsh grout lines.
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        x + joint + 1,
        y + joint + 1,
        tile - joint * 2 - 2,
        tile - joint * 2 - 2,
      );
      ctx.strokeStyle = "rgba(40,36,32,0.1)";
      ctx.strokeRect(x + joint * 0.4, y + joint * 0.4, tile - joint * 0.8, tile - joint * 0.8);
    }
  }

  // Quiet joint wash so seams sit in the surface.
  ctx.fillStyle = "rgba(35,32,28,0.06)";
  for (let i = 1; i < tiles; i++) {
    const p = i * tile;
    ctx.fillRect(p - joint * 0.35, 0, joint * 0.7, size);
    ctx.fillRect(0, p - joint * 0.35, size, joint * 0.7);
  }
}

function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Bilinear-ish smooth value noise for soft plaster mottling. */
function smoothHash(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}
