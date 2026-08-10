/**
 * Seeds the Firestore `templates` catalogue from the in-repo definitions.
 *
 * Usage (emulators):
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=virtual-gallery-dev \
 *   npx tsx scripts/seed-templates.ts
 *
 * Firestore storage note:
 *   Domain `walkBounds` is `readonly [number, number][]` (x,z metres).
 *   Firestore forbids nested arrays, so the seed writes
 *   `walkBounds: Array<{ x: number; z: number }>`. Runtime catalogue /
 *   renderer keep the tuple form; convert back if reading from Firestore.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

import type { SceneTemplate } from "../src/core/entities";

// Load env lightly without Next.
try {
  const envPath = resolve(process.cwd(), ".env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1);
    process.env[key] ??= value;
  }
} catch {
  // .env.local optional when env is already exported.
}

initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "virtual-gallery-dev",
});

/** Firestore-safe walk polygon: array of {x,z} (not nested number arrays). */
function walkBoundsForFirestore(
  walkBounds: SceneTemplate["walkBounds"],
): readonly { x: number; z: number }[] {
  return walkBounds.map(([x, z]) => ({ x, z }));
}

/** Omit `preferred` unless true — Firestore must never store preferred: undefined. */
function wallsForFirestore(walls: SceneTemplate["walls"]) {
  return walls.map((wall) => ({
    ...wall,
    anchors: wall.anchors.map((anchor) => {
      const { preferred, ...rest } = anchor;
      return preferred === true ? { ...rest, preferred: true } : rest;
    }),
  }));
}

function templateForFirestore(
  template: SceneTemplate,
  now: Timestamp,
): Record<string, unknown> {
  const { id: _id, walkBounds, walls, ...rest } = template;
  return {
    ...rest,
    walls: wallsForFirestore(walls),
    walkBounds: walkBoundsForFirestore(walkBounds),
    createdAt: now,
    updatedAt: now,
  };
}

async function main() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.error(
      "Refusing to seed: FIRESTORE_EMULATOR_HOST is unset (production guard).",
    );
    process.exit(1);
  }

  const { TEMPLATE_CATALOGUE } = await import("../src/core/templates/index");
  const db = getFirestore();
  const now = Timestamp.now();

  for (const template of TEMPLATE_CATALOGUE) {
    await db
      .collection("templates")
      .doc(template.id)
      .set(templateForFirestore(template, now));
    console.log(`seeded templates/${template.id} v${template.version}`);
  }

  const snap = await db.collection("templates").get();
  console.log(`templates collection: ${snap.size} docs`);
  console.log(snap.docs.map((d) => d.id).sort().join(", "));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
