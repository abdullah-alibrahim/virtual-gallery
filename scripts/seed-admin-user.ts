/**
 * Seeds a platform admin account for local Firebase emulators.
 *
 * Usage:
 *   npm run seed:admin
 *
 * Credentials:
 *   admin@virtualgallery.dev / Admin1234!
 *
 * Refuses to run without Auth + Firestore emulator hosts (production guard).
 */

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  seedPlatformAdmin,
} from "./lib/seed-accounts";
import {
  loadEnvLocal,
  requireAuthAndFirestoreEmulators,
  seedProjectId,
} from "./lib/seed-emulators";

loadEnvLocal();

async function main() {
  requireAuthAndFirestoreEmulators();

  initializeApp({ projectId: seedProjectId() });

  const result = await seedPlatformAdmin(getFirestore(), getAuth());

  console.log("");
  console.log("Admin user ready (emulators only)");
  console.log(`  email:    ${ADMIN_EMAIL}`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
  console.log(`  uid:      ${result.uid}`);
  console.log(`  workspace:${result.workspaceId}`);
  console.log(`  admin:    true (claim + users.platformAdmin)`);
  console.log(`  allowlist: set ADMIN_EMAILS=${ADMIN_EMAIL}`);
  console.log("");
  console.log("Sign in at /sign-in, then open /admin");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
