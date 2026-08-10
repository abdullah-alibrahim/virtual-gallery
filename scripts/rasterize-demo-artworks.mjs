#!/usr/bin/env node
/**
 * Rasterize public/demo/artworks/*.svg → *.jpg for WebGL TextureLoader.
 * Run after editing demo SVGs: node scripts/rasterize-demo-artworks.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const dir = path.resolve("public/demo/artworks");
const maxEdge = 1024;

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  const id = path.basename(file, ".svg");
  const svg = fs.readFileSync(path.join(dir, file));
  const img = sharp(svg, { density: 144 });
  const meta = await img.metadata();
  const w = meta.width ?? maxEdge;
  const h = meta.height ?? maxEdge;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const outW = Math.round(w * scale);
  const outH = Math.round(h * scale);
  await img
    .resize(outW, outH, { fit: "fill" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(dir, `${id}.jpg`));
  console.log(`${id}: ${w}x${h} → ${outW}x${outH} jpg`);
}
