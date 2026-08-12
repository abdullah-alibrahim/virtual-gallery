/**
 * Seeds demo artist (free) + pro demo + platform admin for local emulators.
 *
 * Usage:
 *   npm run seed:demo
 *
 * Demo (regular artist, free plan):
 *   demo@virtualgallery.dev / Demo1234!
 *
 * Pro demo (regular artist, pro plan — huge halls unlocked):
 *   pro@virtualgallery.dev / ProDemo1234!
 *
 * Ismail Rifai (Pro — uncle’s studio):
 *   ismail@virtualgallery.dev / Ismail1234!
 *   public: /a/ismail-rifai  and  /demo/ismail
 *
 * Public Pro walk (no login, no seed required):
 *   /demo/pro — Mega Wing with hung sample works
 * Free walk:
 *   /demo/walk — Quiet Rooms / Modern White
 * Ismail walk:
 *   /demo/ismail — Mega Wing hung with his paintings
 *
 * Admin (platform ops — also seeded here for convenience):
 *   admin@virtualgallery.dev / Admin1234!
 *   Or run: npm run seed:admin
 *
 * Refuses to run without Auth + Firestore emulator hosts (production guard).
 */

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  ISMAIL_EMAIL,
  ISMAIL_PASSWORD,
  PRO_DEMO_EMAIL,
  PRO_DEMO_PASSWORD,
  seedDemoArtist,
  seedIsmailRifaiArtist,
  seedPlatformAdmin,
  seedProDemoArtist,
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

  const db = getFirestore();
  const auth = getAuth();

  const demo = await seedDemoArtist(db, auth);

  console.log("");
  console.log("Demo user ready (emulators only)");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log(`  uid:      ${demo.uid}`);
  console.log(`  workspace:${demo.workspaceId}`);
  console.log(`  plan:     free (${demo.galleryLimit} galleries max)`);
  console.log(`  admin:    false (regular artist)`);
  console.log(
    `  gallery:  ${demo.galleryId} (can create ${Math.max(0, demo.galleryLimit - 1)} more)`,
  );
  console.log("");

  const pro = await seedProDemoArtist(db, auth);

  console.log("Pro demo user ready (emulators only)");
  console.log(`  email:    ${PRO_DEMO_EMAIL}`);
  console.log(`  password: ${PRO_DEMO_PASSWORD}`);
  console.log(`  uid:      ${pro.uid}`);
  console.log(`  workspace:${pro.workspaceId}`);
  console.log(`  plan:     pro (${pro.galleryLimit} galleries max)`);
  console.log(`  admin:    false (regular artist)`);
  console.log(
    `  gallery:  ${pro.galleryId} (Grand Nave + Mega Wing drafts for editor)`,
  );
  console.log(
    "  public:   /demo/pro — Mega Wing walk, no login (static manifest)",
  );
  console.log("  free walk:/demo/walk — Quiet Rooms / Modern White");
  console.log("");

  const ismail = await seedIsmailRifaiArtist(db, auth);

  console.log("Ismail Rifai ready (emulators only, Pro)");
  console.log(`  email:    ${ISMAIL_EMAIL}`);
  console.log(`  password: ${ISMAIL_PASSWORD}`);
  console.log(`  uid:      ${ismail.uid}`);
  console.log(`  workspace:${ismail.workspaceId}`);
  console.log(`  plan:     pro (${ismail.galleryLimit} galleries max)`);
  console.log(`  gallery:  ${ismail.galleryId}`);
  console.log("  profile:  /a/ismail-rifai");
  console.log("  public:   /demo/ismail — Selected Works, Mega Wing");
  console.log("  boats:    /demo/ismail/boats — Marakeb, Noir Salon");
  console.log("");

  const admin = await seedPlatformAdmin(db, auth);

  console.log("Admin user ready (emulators only)");
  console.log(`  email:    ${ADMIN_EMAIL}`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
  console.log(`  uid:      ${admin.uid}`);
  console.log(`  workspace:${admin.workspaceId}`);
  console.log(`  admin:    true (claim + users.platformAdmin)`);
  console.log(`  allowlist: set ADMIN_EMAILS=${ADMIN_EMAIL}`);
  console.log("");
  console.log(
    "Sign in at /sign-in — free/pro demos use studio; admin opens /admin",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
