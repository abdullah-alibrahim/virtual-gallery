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

export const ISMAIL_EMAIL = "ismail@virtualgallery.dev";
export const ISMAIL_PASSWORD = "Ismail1234!";

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

export async function seedIsmailRifaiArtist(
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
  const { saveGalleryArtworks } = await import(
    "../../src/infrastructure/galleries/save-artworks"
  );
  const { setPlatformAdminClaim } = await import(
    "../../src/infrastructure/firebase/platform-admin"
  );
  const { PLAN_LIMITS } = await import("../../src/core/services/plan-limits");
  const { getTemplateById } = await import("../../src/core/templates");
  const { hangAssetAsArtwork } = await import(
    "../../src/features/editor/lib/hang-artwork"
  );
  const {
    buildIsmailAssetListItems,
    buildIsmailBoatAssetListItems,
    buildIsmailTreeAssetListItems,
  } = await import("../../src/features/editor/lib/sample-assets");
  const {
    ISMAIL_BOATS_TITLE,
    ISMAIL_BOAT_WORKS,
    ISMAIL_DISPLAY_NAME,
    ISMAIL_FACEBOOK_URL,
    ISMAIL_GALLERY_TITLE,
    ISMAIL_HALL_WORKS,
    ISMAIL_SLUG,
    getIsmailRifaiStaticProfile,
    ismailTextureUrl,
  } = await import("../../src/core/samples/ismail-rifai");

  const uid = await upsertAuthUser(auth, {
    email: ISMAIL_EMAIL,
    password: ISMAIL_PASSWORD,
    displayName: ISMAIL_DISPLAY_NAME,
  });

  const bootstrap = await bootstrapUserAccount(db, auth, {
    uid,
    email: ISMAIL_EMAIL,
    displayName: ISMAIL_DISPLAY_NAME,
    photoURL: ismailTextureUrl("avatar.jpg"),
  });

  await setPlatformAdminClaim(auth, uid, false);

  const workspaceId = bootstrap.workspaceId;
  const now = FieldValue.serverTimestamp();
  const pro = PLAN_LIMITS.pro;
  const staticProfile = getIsmailRifaiStaticProfile();

  await ensureArtistSlug(
    db,
    workspaceId,
    ISMAIL_SLUG,
    ISMAIL_DISPLAY_NAME,
    bootstrap.slug,
  );

  await db
    .collection("artistProfiles")
    .doc(workspaceId)
    .set(
      {
        displayName: ISMAIL_DISPLAY_NAME,
        bio: staticProfile.bio,
        statement: staticProfile.statement,
        avatarUrl: staticProfile.avatarUrl,
        coverUrl: staticProfile.coverUrl,
        location: staticProfile.location,
        socials: { facebook: ISMAIL_FACEBOOK_URL },
        contact: { allowInquiries: true, showEmail: false },
        updatedAt: now,
      },
      { merge: true },
    );

  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        displayName: ISMAIL_DISPLAY_NAME,
        photoURL: ismailTextureUrl("avatar.jpg"),
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
        name: ISMAIL_DISPLAY_NAME,
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

  const byTitle = new Map(
    existing.docs.map((doc) => [String(doc.data().title ?? ""), doc.id]),
  );

  let galleryId = byTitle.get(ISMAIL_GALLERY_TITLE) ?? null;

  if (!galleryId) {
    if (existing.size >= pro.galleries) {
      galleryId = existing.docs[0]?.id ?? null;
    } else {
      const created = await createGalleryDocument({
        uid,
        workspaceId,
        title: ISMAIL_GALLERY_TITLE,
        templateId: "mega-wing",
      });
      galleryId = created.galleryId;
      console.log(
        `Created Ismail gallery ${created.galleryId} (${ISMAIL_GALLERY_TITLE} / mega-wing)`,
      );
    }
  }

  if (galleryId) {
    const template = getTemplateById("mega-wing");
    if (template) {
      const assets = [
        ...buildIsmailAssetListItems(workspaceId),
        ...buildIsmailTreeAssetListItems(workspaceId),
      ];
      let hung: import("../../src/core/entities").Artwork[] = [];
      for (const asset of assets) {
        const work = ISMAIL_HALL_WORKS.find(
          (item) => item.file === asset.fileName,
        );
        const artwork = hangAssetAsArtwork({
          asset,
          galleryId,
          workspaceId,
          template,
          existing: hung,
        });
        if (!artwork) break;
        hung = [
          ...hung,
          {
            ...artwork,
            title: work?.title ?? artwork.title,
            description: work?.description ?? "",
            year: work?.year ?? artwork.year,
            medium: work?.medium ?? artwork.medium,
          },
        ];
      }

      if (hung.length > 0) {
        await saveGalleryArtworks({ uid, galleryId, artworks: hung });
      }

      await db.collection("galleries").doc(galleryId).set(
        {
          templateId: "mega-wing",
          description:
            "The Hall — Roads, Figures, and Bait Al Shamsi Tree in Mega Wing. Marakeb has its own salon.",
          cover: {
            assetId: assets[0]?.id ?? "ismail:01",
            thumbUrl: ismailTextureUrl("cover.jpg"),
            blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
          },
          seo: {
            title: `${ISMAIL_DISPLAY_NAME} — ${ISMAIL_GALLERY_TITLE}`,
            description:
              "Walk The Hall — Roads, Figures, and Bait Al Shamsi Tree in the Pro Mega Wing.",
            ogPath: null,
            website: ISMAIL_FACEBOOK_URL,
          },
          updatedAt: now,
        },
        { merge: true },
      );
    }
  }

  let boatsId = byTitle.get(ISMAIL_BOATS_TITLE) ?? null;
  if (!boatsId) {
    const live = await db
      .collection("galleries")
      .where("workspaceId", "==", workspaceId)
      .where("deletedAt", "==", null)
      .get();
    if (live.size < pro.galleries) {
      const created = await createGalleryDocument({
        uid,
        workspaceId,
        title: ISMAIL_BOATS_TITLE,
        templateId: "noir-salon",
      });
      boatsId = created.galleryId;
      console.log(
        `Created Ismail gallery ${created.galleryId} (${ISMAIL_BOATS_TITLE} / noir-salon)`,
      );
    }
  }

  if (boatsId) {
    const template = getTemplateById("noir-salon");
    if (template) {
      const assets = buildIsmailBoatAssetListItems(workspaceId);
      let hung: import("../../src/core/entities").Artwork[] = [];
      for (const asset of assets) {
        const work = ISMAIL_BOAT_WORKS.find(
          (item) => item.file === asset.fileName,
        );
        const artwork = hangAssetAsArtwork({
          asset,
          galleryId: boatsId,
          workspaceId,
          template,
          existing: hung,
        });
        if (!artwork) break;
        hung = [
          ...hung,
          {
            ...artwork,
            title: work?.title ?? artwork.title,
            description: work?.description ?? "",
            year: work?.year ?? artwork.year,
            medium: work?.medium ?? artwork.medium,
            category: work?.category ?? artwork.category,
          },
        ];
      }

      if (hung.length > 0) {
        await saveGalleryArtworks({ uid, galleryId: boatsId, artworks: hung });
      }

      await db.collection("galleries").doc(boatsId).set(
        {
          templateId: "noir-salon",
          description:
            "Marakeb — boats as memory and hull, hung in Noir Salon.",
          cover: {
            assetId: assets[0]?.id ?? "ismail:boat-01",
            thumbUrl: ismailTextureUrl("boats/01.jpg"),
            blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
          },
          seo: {
            title: `${ISMAIL_DISPLAY_NAME} — ${ISMAIL_BOATS_TITLE}`,
            description: "Walk the Marakeb boat series in the Pro Noir Salon.",
            ogPath: null,
            website: ISMAIL_FACEBOOK_URL,
          },
          updatedAt: now,
        },
        { merge: true },
      );
    }
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
