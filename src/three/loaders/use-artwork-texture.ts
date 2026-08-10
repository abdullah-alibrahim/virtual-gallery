"use client";

import { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { KTX2Loader } from "three-stdlib";
import {
  CanvasTexture,
  DataTexture,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
  type Texture,
  type WebGLRenderer,
} from "three";

const BASIS_PATH =
  "https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/";

let sharedKtx2: KTX2Loader | null = null;

function getKtx2Loader(gl: WebGLRenderer): KTX2Loader {
  if (!sharedKtx2) {
    sharedKtx2 = new KTX2Loader().setTranscoderPath(BASIS_PATH);
  }
  sharedKtx2.detectSupport(gl);
  return sharedKtx2;
}

/**
 * Loads artwork images for WebGL without Suspense.
 *
 * Three.js TextureLoader is unreliable for SVG (especially with filters) and
 * a failed/pending `useTexture` previously hid entire frames via
 * `<Suspense fallback={null}>`. This hook always returns a usable texture:
 * a procedural DataTexture first, then the decoded image / KTX2 when ready.
 */
export function useArtworkTexture(
  url: string,
  options: { seed: string; anisotropy?: number },
): Texture {
  const gl = useThree((s) => s.gl);
  const fallback = useMemo(
    () => createFallbackDataTexture(options.seed),
    [options.seed],
  );
  const [texture, setTexture] = useState<Texture>(fallback);

  useEffect(() => {
    return () => {
      fallback.dispose();
    };
  }, [fallback]);

  useEffect(() => {
    setTexture(fallback);
    if (!url) return;

    let cancelled = false;
    let uploaded: Texture | null = null;
    const anisotropy = options.anisotropy ?? 4;

    const apply = (next: Texture) => {
      if (cancelled) {
        next.dispose();
        return;
      }
      configureTexture(next, anisotropy);
      uploaded = next;
      setTexture(next);
    };

    if (isKtx2Url(url)) {
      const loader = getKtx2Loader(gl);
      loader.load(
        url,
        (tex) => apply(tex),
        undefined,
        () => {
          if (!cancelled) setTexture(fallback);
        },
      );
      return () => {
        cancelled = true;
        if (uploaded) uploaded.dispose();
      };
    }

    const img = new Image();
    if (/^https?:\/\//i.test(url)) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => {
      if (cancelled) return;
      try {
        apply(new CanvasTexture(rasterizeImage(img)));
      } catch {
        if (!cancelled) setTexture(fallback);
      }
    };

    img.onerror = () => {
      if (!cancelled) setTexture(fallback);
    };

    img.src = url;

    return () => {
      cancelled = true;
      if (uploaded) uploaded.dispose();
    };
  }, [url, fallback, options.anisotropy, gl]);

  useEffect(() => {
    texture.anisotropy = options.anisotropy ?? 4;
    texture.needsUpdate = true;
  }, [texture, options.anisotropy]);

  return texture;
}

/** Procedural stand-in so frames never render blank while an image loads. */
export function createFallbackDataTexture(seed: string): DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const [hex0, hex1, hex2, hex3] = paletteFromSeed(seed);
  const c0 = hexToRgb(hex0);
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const c3 = hexToRgb(hex3);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (size * 2 - 2);
      const base = lerpRgb(c0, c2, t);
      const mid = lerpRgb(base, c1, Math.abs(0.5 - y / size) * 1.4);
      let rgb = mid;

      const dx = x - size * 0.35;
      const dy = y - size * 0.4;
      if (dx * dx + dy * dy < (size * 0.22) ** 2) {
        rgb = lerpRgb(rgb, c3, 0.45);
      }
      if (y > size * 0.62) {
        rgb = lerpRgb(rgb, c2, 0.35);
      }

      const n = hash01(seed, x * 31 + y) * 28 - 14;
      const i = (y * size + x) * 4;
      data[i] = clampByte(rgb[0] + n);
      data[i + 1] = clampByte(rgb[1] + n * 0.8);
      data[i + 2] = clampByte(rgb[2] + n * 0.6);
      data[i + 3] = 255;
    }
  }

  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  configureTexture(texture, 2);
  return texture;
}

function isKtx2Url(url: string): boolean {
  return /\.ktx2(\?|#|$)/i.test(url);
}

function rasterizeImage(img: HTMLImageElement): HTMLCanvasElement {
  const maxEdge = 1024;
  const srcW = Math.max(1, img.naturalWidth || img.width || 512);
  const srcH = Math.max(1, img.naturalHeight || img.height || 512);
  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(srcW * scale));
  canvas.height = Math.max(1, Math.round(srcH * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2d context unavailable");
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function configureTexture(texture: Texture, anisotropy: number) {
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
}

type Rgb = readonly [number, number, number];

function paletteFromSeed(seed: string): [string, string, string, string] {
  const palettes: Array<[string, string, string, string]> = [
    ["#e8c99a", "#c4784a", "#3a2a28", "#f2d6a8"],
    ["#1a2a38", "#3d5a6e", "#0e161c", "#c8d8e4"],
    ["#6b1c1c", "#a83228", "#2a0e0c", "#e8b89a"],
    ["#2c2418", "#c9a227", "#1a1510", "#f0e0a8"],
    ["#1e3a2f", "#3d6b52", "#0f1f18", "#a8c9b0"],
    ["#3a2f28", "#8a6238", "#1a1410", "#d4b896"],
    ["#1a1a1e", "#4a4a55", "#0c0c10", "#c8c8d0"],
    ["#2a3040", "#5a6a7a", "#12161c", "#b8c4d0"],
    ["#3a2820", "#8a5040", "#18100c", "#e0c0a0"],
  ];
  const idx = Math.abs(hashInt(seed)) % palettes.length;
  return palettes[idx]!;
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const u = Math.min(1, Math.max(0, t));
  return [
    a[0] + (b[0] - a[0]) * u,
    a[1] + (b[1] - a[1]) * u,
    a[2] + (b[2] - a[2]) * u,
  ];
}

function clampByte(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function hashInt(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

function hash01(seed: string, salt: number): number {
  const h = hashInt(`${seed}:${salt}`);
  return ((h >>> 0) % 10_000) / 10_000;
}
