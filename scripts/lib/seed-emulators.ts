/**
 * Shared helpers for emulator-only seed scripts.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnvLocal(): void {
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
}

export function requireAuthAndFirestoreEmulators(): void {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.error(
      "Refusing to seed: FIRESTORE_EMULATOR_HOST is unset (production guard).",
    );
    process.exit(1);
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.error(
      "Refusing to seed: FIREBASE_AUTH_EMULATOR_HOST is unset (production guard).",
    );
    process.exit(1);
  }
}

export function seedProjectId(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "virtual-gallery-dev";
}
