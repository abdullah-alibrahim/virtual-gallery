/**
 * Image processing pipeline.
 *
 * Architecture target is Cloud Run (sharp + Basis/KTX2). For Phase 2 we run the
 * same logic inside the Next.js server (and a mirrored Cloud Function trigger)
 * so local emulators can complete the loop without deploying Run.
 *
 * LOD outputs:
 *   - WebP thumbnail at 512 (always)
 *   - WebP stand-ins at 512 / 1024 / 2048 written into the `ktx2_*` variant
 *     slots when a Basis encoder is not available
 *   - Real `.ktx2` when `BASISU_BIN` points at a basisu binary (Cloud Run image)
 *
 * The viewer (Phase 3) will prefer `.ktx2` and fall back to WebP by extension.
 */

import { encode as encodeBlurhash } from "blurhash";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp, { type Metadata, type Sharp } from "sharp";

import { toAspectRatio } from "@/core/value-objects/aspect-ratio";
import { LOD_SIZES, type LodSize } from "@/core/services/asset-upload";

export interface ProcessImageResult {
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: number;
  readonly dominantColor: string | null;
  readonly blurhash: string;
  readonly exif: Readonly<Record<string, string | number>> | null;
  readonly thumb512: Buffer;
  readonly lods: ReadonlyArray<{
    readonly size: LodSize;
    readonly buffer: Buffer;
    readonly extension: "ktx2" | "webp";
    readonly contentType: string;
  }>;
  readonly textureFormat: "ktx2" | "webp";
  /** Derived LODs received a mild sharpen; original buffer was not modified. */
  readonly hangClarityEnhanced: boolean;
}

export async function processImage(input: Buffer): Promise<ProcessImageResult> {
  const image = sharp(input, { failOn: "none", unlimited: true });
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width < 1 || height < 1) {
    throw new Error("Could not read image dimensions");
  }

  const stats = await image.clone().stats();
  const dominant = stats.dominant;
  const dominantColor = dominant
    ? rgbToHex(dominant.r, dominant.g, dominant.b)
    : null;

  const blurhash = await buildBlurhash(image.clone());
  const exif = extractExif(metadata);

  const thumb512 = await image
    .clone()
    .rotate()
    .resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const basisu = process.env.BASISU_BIN?.trim() || null;
  const lods = [];

  for (const size of LOD_SIZES) {
    const sharpened = await image
      .clone()
      .rotate()
      .resize(size, size, { fit: "inside", withoutEnlargement: true })
      .sharpen({ sigma: size >= 1024 ? 0.7 : 0.45, m1: 0.55, m2: 0.35 })
      .ensureAlpha()
      .png()
      .toBuffer();

    if (basisu) {
      try {
        const ktx2 = await encodeKtx2WithBasisu(sharpened, basisu);
        lods.push({
          size,
          buffer: ktx2,
          extension: "ktx2" as const,
          contentType: "image/ktx2",
        });
        continue;
      } catch (error) {
        console.warn(
          `[image-pipeline] basisu failed for ${size}px, falling back to WebP`,
          error,
        );
      }
    }

    // Mild sharpen on derived hang LODs only — original file stays untouched.
    const webp = await sharp(sharpened)
      .webp({ quality: size >= 1024 ? 88 : 86 })
      .toBuffer();
    lods.push({
      size,
      buffer: webp,
      extension: "webp" as const,
      contentType: "image/webp",
    });
  }

  const textureFormat = lods.every((l) => l.extension === "ktx2")
    ? "ktx2"
    : "webp";

  return {
    width,
    height,
    aspectRatio: toAspectRatio(width, height),
    dominantColor,
    blurhash,
    exif,
    thumb512,
    lods,
    textureFormat,
    hangClarityEnhanced: true,
  };
}

async function buildBlurhash(pipeline: Sharp): Promise<string> {
  const { data, info } = await pipeline
    .rotate()
    .resize(32, 32, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return encodeBlurhash(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4,
    3,
  );
}

function extractExif(
  metadata: Metadata,
): Readonly<Record<string, string | number>> | null {
  const out: Record<string, string | number> = {};
  if (metadata.space) out.colorSpace = metadata.space;
  if (metadata.density) out.density = metadata.density;
  if (metadata.hasProfile) out.hasProfile = 1;
  if (metadata.orientation) out.orientation = metadata.orientation;
  if (metadata.format) out.format = metadata.format;
  return Object.keys(out).length > 0 ? out : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Encodes a PNG buffer to KTX2/Basis via the `basisu` CLI. Cloud Run images
 * ship this binary; local/dev falls back to WebP when it is absent.
 */
async function encodeKtx2WithBasisu(
  png: Buffer,
  basisuBin: string,
): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "vg-ktx2-"));
  const inputPath = join(dir, "in.png");
  const outputPath = join(dir, "out.ktx2");

  try {
    await writeFile(inputPath, png);
    await run(basisuBin, [
      "-ktx2",
      "-uastc",
      "-uastc_level",
      "2",
      "-output_file",
      outputPath,
      inputPath,
    ]);
    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `basisu exited ${code}`));
    });
  });
}
