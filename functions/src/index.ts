/**
 * Cloud Functions entrypoint.
 *
 * Phase 1 — bootstrapUser (user + workspace + profile + slug + claims)
 * Phase 2 — Storage finalize triggers the image pipeline (production). Locally,
 *           Next.js `/api/assets/:id/process` runs the same sharp algorithm so
 *           emulators do not need Cloud Run.
 */

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";

initializeApp();

const PLAN_LIMITS_FREE = {
  galleries: 3,
  artworksPerGallery: 15,
  storageBytes: 500 * 1024 * 1024,
  customDomain: false,
  seats: 1,
} as const;

const RESERVED = new Set([
  "dashboard",
  "sign-in",
  "sign-up",
  "settings",
  "admin",
  "api",
  "a",
  "g",
  "explore",
  "onboarding",
]);

function slugify(input: string): string | null {
  const normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return normalized.length >= 3 ? normalized : null;
}

async function reserveUniqueSlug(
  displayName: string,
  workspaceId: string,
): Promise<string> {
  const db = getFirestore();
  const base =
    slugify(displayName) ??
    `artist-${workspaceId.slice(0, 8).toLowerCase()}`;

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    if (RESERVED.has(candidate)) continue;
    const snap = await db.collection("slugs").doc(candidate).get();
    if (!snap.exists) return candidate;
  }

  return `artist${Date.now()}`;
}

export const bootstrapUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required");
  }

  const uid = request.auth.uid;
  const email = request.auth.token.email ?? "";
  const displayName =
    (request.auth.token.name as string | undefined)?.trim() ||
    email.split("@")[0] ||
    "Artist";
  const photoURL = (request.auth.token.picture as string | undefined) ?? null;

  const db = getFirestore();
  const auth = getAuth();
  const existing = await db.collection("users").doc(uid).get();

  if (existing.exists) {
    const data = existing.data()!;
    return {
      workspaceId: data.defaultWorkspaceId,
      created: false,
      onboardingComplete: Boolean(data.onboarding?.completed),
    };
  }

  const workspaceId = db.collection("workspaces").doc().id;
  const slug = await reserveUniqueSlug(displayName, workspaceId);
  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const userRef = db.collection("users").doc(uid);
    if ((await tx.get(userRef)).exists) return;

    tx.set(userRef, {
      email,
      displayName,
      photoURL,
      defaultWorkspaceId: workspaceId,
      locale: "en",
      onboarding: { completed: false, step: "profile", completedAt: null },
      createdAt: now,
      updatedAt: now,
    });

    tx.set(db.collection("workspaces").doc(workspaceId), {
      type: "artist",
      name: displayName,
      plan: "free",
      ownerId: uid,
      limits: PLAN_LIMITS_FREE,
      usage: { galleries: 0, artworks: 0, storageBytes: 0 },
      billing: null,
      createdAt: now,
      updatedAt: now,
    });

    tx.set(
      db.collection("workspaces").doc(workspaceId).collection("members").doc(uid),
      {
        uid,
        role: "owner",
        displayName,
        email,
        joinedAt: now,
      },
    );

    tx.set(db.collection("artistProfiles").doc(workspaceId), {
      workspaceId,
      slug,
      displayName,
      bio: "",
      statement: "",
      avatarUrl: photoURL,
      coverUrl: null,
      location: null,
      socials: {},
      contact: { allowInquiries: true, showEmail: false },
      featuredGalleryIds: [],
      createdAt: now,
      updatedAt: now,
    });

    tx.set(db.collection("slugs").doc(slug), {
      type: "artist",
      targetId: workspaceId,
      workspaceId,
      createdAt: now,
    });
  });

  await auth.setCustomUserClaims(uid, {
    workspaces: { [workspaceId]: "owner" },
  });

  // Optional body reserved for future profile hints.
  z.object({}).passthrough().parse(request.data ?? {});

  return {
    workspaceId,
    slug,
    created: true,
    onboardingComplete: false,
  };
});
