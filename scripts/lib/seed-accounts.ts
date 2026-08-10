/**
 * Idempotent Auth + Firestore account seeders (emulator use only).
 */

import type { Auth } from "firebase-admin/auth";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

export const DEMO_EMAIL = "demo@virtualgallery.dev";
export const DEMO_PASSWORD = "Demo1234!";
export const DEMO_NAME = "Demo Artist";
export const DEMO_SLUG = "demo-artist";

export const PRO_DEMO_EMAIL = "pro@virtualgallery.dev";
export const PRO_DEMO_PASSWORD = "ProDemo1234!";
export const PRO_DEMO_NAME = "Pro Demo Studio";
export const PRO_DEMO_SLUG = "pro-demo-studio";

export const ADMIN_EMAIL = "admin@virtualgallery.dev";
export const ADMIN_PASSWORD = "Admin1234!";
export const ADMIN_NAME = "Platform Admin";
export const ADMIN_SLUG = "platform-admin";

async function upsertAuthUser(
  auth: Auth,
  input: {
    email: string;
    password: string;
    displayName: string;
  },
): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(input.email);
    await auth.updateUser(existing.uid, {
      password: input.password,
      displayName: input.displayName,
      emailVerified: true,
      disabled: false,
    });
    console.log(`Updated existing Auth user ${input.email} (${existing.uid})`);
    return existing.uid;
  } catch {
    const created = await auth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      emailVerified: true,
    });
    console.log(`Created Auth user ${input.email} (${created.uid})`);
    return created.uid;
  }
}

async function ensureArtistSlug(
  db: Firestore,
  workspaceId: string,
  desiredSlug: string,
  displayName: string,
  fallbackSlug: string,
): Promise<void> {
  const profileRef = db.collection("artistProfiles").doc(workspaceId);
  const profileSnap = await profileRef.get();
  const currentSlug = String(profileSnap.data()?.slug ?? fallbackSlug);
  const now = FieldValue.serverTimestamp();

  if (currentSlug === desiredSlug) {
    await profileRef.set(
      { displayName, updatedAt: now },
      { merge: true },
    );
    return;
  }

  const taken = await db.collection("slugs").doc(desiredSlug).get();
  if (taken.exists) {
    await profileRef.set({ displayName, updatedAt: now }, { merge: true });
    return;
  }

  if (currentSlug) {
    await db
      .collection("slugs")
      .doc(currentSlug)
      .delete()
      .catch(() => undefined);
  }
  await db.collection("slugs").doc(desiredSlug).set({
    type: "artist",
    targetId: workspaceId,
    workspaceId,
    createdAt: now,
  });
  await profileRef.set(
    { slug: desiredSlug, displayName, updatedAt: now },
    { merge: true },
  );
}

export async function seedDemoArtist(
  db: Firestore,
  auth: Auth,
): Promise<{
  uid: string;
  workspaceId: string;
  galleryId: string | null;
  galleryLimit: number;
}> {
  const { bootstrapUserAccount } = await import(
    "../../src/infrastructure/firebase/bootstrap-user"
  );
  const { createGalleryDocument } = await import(
    "../../src/infrastructure/galleries/create-gallery"
  );
  const { setPlatformAdminClaim } = await import(
    "../../src/infrastructure/firebase/platform-admin"
  );
  const { PLAN_LIMITS } = await import("../../src/core/services/plan-limits");

  const uid = await upsertAuthUser(auth, {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    displayName: DEMO_NAME,
  });

  const bootstrap = await bootstrapUserAccount(db, auth, {
    uid,
    email: DEMO_EMAIL,
    displayName: DEMO_NAME,
    photoURL: null,
  });

  await setPlatformAdminClaim(auth, uid, false);

  const workspaceId = bootstrap.workspaceId;
  const now = FieldValue.serverTimestamp();
  const free = PLAN_LIMITS.free;

  await ensureArtistSlug(db, workspaceId, DEMO_SLUG, DEMO_NAME, bootstrap.slug);

  await db
    .collection("artistProfiles")
    .doc(workspaceId)
    .set(
      {
        bio: "Demo studio for local Virtual Gallery testing.",
        updatedAt: now,
      },
      { merge: true },
    );

  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        displayName: DEMO_NAME,
        platformAdmin: false,
        disabled: false,
        onboarding: {
          completed: true,
          step: "done",
          completedAt: now,
        },
        updatedAt: now,
      },
      { merge: true },
    );

  await db
    .collection("workspaces")
    .doc(workspaceId)
    .set(
      {
        name: DEMO_NAME,
        plan: "free",
        limits: {
          galleries: free.galleries,
          artworksPerGallery: free.artworksPerGallery,
          storageBytes: free.storageBytes,
          customDomain: free.customDomain,
          seats: free.seats,
        },
        updatedAt: now,
      },
      { merge: true },
    );

  const existing = await db
    .collection("galleries")
    .where("workspaceId", "==", workspaceId)
    .where("deletedAt", "==", null)
    .get();

  const desiredShows: { title: string; templateId: string }[] = [
    { title: "Demo Show", templateId: "daylight-museum" },
    { title: "Coastal Light", templateId: "coastal-pavilion" },
    { title: "L-Wing Studio", templateId: "l-wing-atelier" },
  ];

  const byTitle = new Map(
    existing.docs.map((doc) => [String(doc.data().title ?? ""), doc.id]),
  );

  let galleryId: string | null = byTitle.get("Demo Show") ?? null;
  let liveCount = existing.size;

  for (const show of desiredShows) {
    if (byTitle.has(show.title)) {
      if (!galleryId) galleryId = byTitle.get(show.title) ?? null;
      continue;
    }
    if (liveCount >= free.galleries) {
      console.log(
        `Demo at gallery cap (${liveCount}/${free.galleries}) — skip “${show.title}”`,
      );
      break;
    }
    const created = await createGalleryDocument({
      uid,
      workspaceId,
      title: show.title,
      templateId: show.templateId,
    });
    liveCount += 1;
    byTitle.set(show.title, created.galleryId);
    console.log(
      `Created demo gallery ${created.galleryId} (${show.title} / ${show.templateId})`,
    );
    if (show.title === "Demo Show" || !galleryId) {
      galleryId = created.galleryId;
    }
  }

  if (!galleryId) {
    galleryId = existing.docs[0]?.id ?? null;
  }
  if (galleryId) {
    console.log(`Primary demo gallery: ${galleryId}`);
  }

  return {
    uid,
    workspaceId,
    galleryId,
    galleryLimit: free.galleries,
  };
}

export async function seedProDemoArtist(
  db: Firestore,
  auth: Auth,
): Promise<{
  uid: string;
  workspaceId: string;
  galleryId: string | null;
  galleryLimit: number;
}> {
  const { bootstrapUserAccount } = await import(
    "../../src/infrastructure/firebase/bootstrap-user"
  );
  const { createGalleryDocument } = await import(
    "../../src/infrastructure/galleries/create-gallery"
  );
  const { setPlatformAdminClaim } = await import(
    "../../src/infrastructure/firebase/platform-admin"
  );
  const { PLAN_LIMITS } = await import("../../src/core/services/plan-limits");

  const uid = await upsertAuthUser(auth, {
    email: PRO_DEMO_EMAIL,
    password: PRO_DEMO_PASSWORD,
    displayName: PRO_DEMO_NAME,
  });

  const bootstrap = await bootstrapUserAccount(db, auth, {
    uid,
    email: PRO_DEMO_EMAIL,
    displayName: PRO_DEMO_NAME,
    photoURL: null,
  });

  await setPlatformAdminClaim(auth, uid, false);

  const workspaceId = bootstrap.workspaceId;
  const now = FieldValue.serverTimestamp();
  const pro = PLAN_LIMITS.pro;

  await ensureArtistSlug(
    db,
    workspaceId,
    PRO_DEMO_SLUG,
    PRO_DEMO_NAME,
    bootstrap.slug,
  );

  await db
    .collection("artistProfiles")
    .doc(workspaceId)
    .set(
      {
        bio: "Pro plan demo studio — huge-hall templates unlocked.",
        updatedAt: now,
      },
      { merge: true },
    );

  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        displayName: PRO_DEMO_NAME,
        platformAdmin: false,
        disabled: false,
        onboarding: {
          completed: true,
          step: "done",
          completedAt: now,
        },
        updatedAt: now,
      },
      { merge: true },
    );

  await db
    .collection("workspaces")
    .doc(workspaceId)
    .set(
      {
        name: PRO_DEMO_NAME,
        plan: "pro",
        limits: {
          galleries: pro.galleries,
          artworksPerGallery: pro.artworksPerGallery,
          storageBytes: pro.storageBytes,
          customDomain: pro.customDomain,
          seats: pro.seats,
        },
        updatedAt: now,
      },
      { merge: true },
    );

  const existing = await db
    .collection("galleries")
    .where("workspaceId", "==", workspaceId)
    .where("deletedAt", "==", null)
    .get();

  const desiredShows: { title: string; templateId: string }[] = [
    { title: "Grand Nave", templateId: "grand-nave" },
    { title: "Mega Wing", templateId: "mega-wing" },
  ];

  const byTitle = new Map(
    existing.docs.map((doc) => [String(doc.data().title ?? ""), doc.id]),
  );

  let galleryId: string | null = byTitle.get("Grand Nave") ?? null;
  let liveCount = existing.size;

  for (const show of desiredShows) {
    if (byTitle.has(show.title)) {
      if (!galleryId) galleryId = byTitle.get(show.title) ?? null;
      continue;
    }
    if (liveCount >= pro.galleries) {
      console.log(
        `Pro demo at gallery cap (${liveCount}/${pro.galleries}) — skip “${show.title}”`,
      );
      break;
    }
    const created = await createGalleryDocument({
      uid,
      workspaceId,
      title: show.title,
      templateId: show.templateId,
    });
    liveCount += 1;
    byTitle.set(show.title, created.galleryId);
    console.log(
      `Created pro demo gallery ${created.galleryId} (${show.title} / ${show.templateId})`,
    );
    if (show.title === "Grand Nave" || !galleryId) {
      galleryId = created.galleryId;
    }
  }

  if (!galleryId) {
    galleryId = existing.docs[0]?.id ?? null;
  }
  if (galleryId) {
    console.log(`Primary pro demo gallery: ${galleryId}`);
  }

  return {
    uid,
    workspaceId,
    galleryId,
    galleryLimit: pro.galleries,
  };
}

export async function seedPlatformAdmin(
  db: Firestore,
  auth: Auth,
): Promise<{ uid: string; workspaceId: string }> {
  const { bootstrapUserAccount } = await import(
    "../../src/infrastructure/firebase/bootstrap-user"
  );
  const { setPlatformAdminClaim } = await import(
    "../../src/infrastructure/firebase/platform-admin"
  );
  const { PLAN_LIMITS } = await import("../../src/core/services/plan-limits");

  const uid = await upsertAuthUser(auth, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    displayName: ADMIN_NAME,
  });

  const bootstrap = await bootstrapUserAccount(db, auth, {
    uid,
    email: ADMIN_EMAIL,
    displayName: ADMIN_NAME,
    photoURL: null,
  });

  await setPlatformAdminClaim(auth, uid, true);

  const workspaceId = bootstrap.workspaceId;
  const now = FieldValue.serverTimestamp();
  const studio = PLAN_LIMITS.studio;

  await ensureArtistSlug(
    db,
    workspaceId,
    ADMIN_SLUG,
    ADMIN_NAME,
    bootstrap.slug,
  );

  await db
    .collection("artistProfiles")
    .doc(workspaceId)
    .set(
      {
        bio: "Platform operations account for Virtual Gallery.",
        updatedAt: now,
      },
      { merge: true },
    );

  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        displayName: ADMIN_NAME,
        platformAdmin: true,
        disabled: false,
        onboarding: {
          completed: true,
          step: "done",
          completedAt: now,
        },
        updatedAt: now,
      },
      { merge: true },
    );

  await db
    .collection("workspaces")
    .doc(workspaceId)
    .set(
      {
        name: ADMIN_NAME,
        plan: "studio",
        limits: {
          galleries: studio.galleries,
          artworksPerGallery: studio.artworksPerGallery,
          storageBytes: studio.storageBytes,
          customDomain: studio.customDomain,
          seats: studio.seats,
        },
        updatedAt: now,
      },
      { merge: true },
    );

  return { uid, workspaceId };
}
