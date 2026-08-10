#!/usr/bin/env node
/**
 * Bundle regression gate.
 *
 * Phase 0 measures total JS under `.next/static`. That number includes the
 * Next.js framework runtime shared across every route — it is a ceiling, not
 * a first-load budget. The real first-load budget (landing < 200 KB gzipped,
 * viewer shell < 350 KB before the dynamically imported Canvas) is enforced
 * in Phase 6 with Lighthouse CI once we have something to measure.
 *
 * This gate exists so a dependency that quietly adds several megabytes cannot
 * land unnoticed during Phases 0–5.
 */

import { readdir, stat } from "node:fs/promises";
import path from "node:path";

/** Soft ceiling for total emitted client JS across the whole app. */
const MAX_STATIC_JS_BYTES = 2 * 1024 * 1024; // 2 MB
const NEXT_STATIC = path.join(process.cwd(), ".next", "static");

async function totalBytes(dir) {
  let total = 0;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    console.error(`No build output at ${dir}. Run \`npm run build\` first.`);
    process.exit(1);
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await totalBytes(full);
    } else if (entry.name.endsWith(".js")) {
      total += (await stat(full)).size;
    }
  }
  return total;
}

const bytes = await totalBytes(NEXT_STATIC);
const kb = (bytes / 1024).toFixed(1);
const maxKb = (MAX_STATIC_JS_BYTES / 1024).toFixed(0);

console.log(`Static JS total: ${kb} KB (Phase 0 ceiling ${maxKb} KB)`);

if (bytes > MAX_STATIC_JS_BYTES) {
  console.error(
    `Bundle gate failed: ${kb} KB exceeds the ${maxKb} KB ceiling.`,
  );
  process.exit(1);
}

console.log("Bundle gate passed.");
