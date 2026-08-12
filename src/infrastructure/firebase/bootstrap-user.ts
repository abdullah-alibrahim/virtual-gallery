/**
 * Atomic account bootstrap.
 *
 * Creates the four documents a new artist needs in one Firestore transaction,
 * then stamps workspace role into Auth custom claims so security rules stay
 * free of per-request membership reads.
 *
 * Idempotent: a second call for the same uid returns the existing workspace.
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";

import { limitsForPlan } from "@/core/services/enforce-plan-limits";
import {
  productTrialBilling,
  trialPeriodEnd,
} from "@/core/services/pro-trial";
import { isReservedSlug, isValidSlug, slugify } from "@/core/value-objects/slug";

export interface BootstrapInput {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly photoURL: string | null;
}

export interface BootstrapResult {
  readonly workspaceId: string;
  readonly slug: string;
  readonly created: boolean;
  readonly onboardingComplete: boolean;
}

export async function bootstrapUserAccount(
  db: Firestore,
  auth: Auth,
  input: BootstrapInput,
): Promise<BootstrapResult> {
  const existing = await db.collection("users").doc(input.uid).get();
  if (existing.exists) {
    const data = existing.data()!;
    return {
      workspaceId: data.defaultWorkspaceId as string,
      slug: await readProfileSlug(db, data.defaultWorkspaceId as string),
      created: false,
      onboardingComplete: Boolean(data.onboarding?.completed),
    };
  }

  const workspaceId = db.collection("workspaces").doc().id;
  const displayName =
    input.displayName?.trim() ||
    input.email.split("@")[0] ||
    "Artist";
  const slug = await reserveUniqueSlug(db, displayName, workspaceId);
  const now = FieldValue.serverTimestamp();
  const limits = limitsForPlan("pro");
  const trialBilling = productTrialBilling(trialPeriodEnd());

  await db.runTransaction(async (tx) => {
    const userRef = db.collection("users").doc(input.uid);
    const again = await tx.get(userRef);
    if (again.exists) return;

    const workspaceRef = db.collection("workspaces").doc(workspaceId);
    const memberRef = workspaceRef.collection("members").doc(input.uid);
    const profileRef = db.collection("artistProfiles").doc(workspaceId);
    const slugRef = db.collection("slugs").doc(slug);

    tx.set(userRef, {
      email: input.email,
      displayName,
      photoURL: input.photoURL,
      defaultWorkspaceId: workspaceId,
      locale: "en",
      onboarding: {
        completed: false,
        step: "profile",
        completedAt: null,
      },
      createdAt: now,
      updatedAt: now,
    });

    tx.set(workspaceRef, {
      type: "artist",
      name: displayName,
      plan: "pro",
      ownerId: input.uid,
      limits: {
        galleries: limits.galleries,
        artworksPerGallery: limits.artworksPerGallery,
        storageBytes: limits.storageBytes,
        customDomain: limits.customDomain,
        seats: limits.seats,
      },
      usage: { galleries: 0, artworks: 0, storageBytes: 0 },
      billing: trialBilling,
      createdAt: now,
      updatedAt: now,
    });

    tx.set(memberRef, {
      uid: input.uid,
      role: "owner",
      displayName,
      email: input.email,
      joinedAt: now,
    });

    tx.set(profileRef, {
      workspaceId,
      slug,
      displayName,
      bio: "",
      statement: "",
      avatarUrl: input.photoURL,
      coverUrl: null,
      location: null,
      socials: {},
      contact: {
        allowInquiries: true,
        showEmail: false,
      },
      featuredGalleryIds: [],
      createdAt: now,
      updatedAt: now,
    });

    tx.set(slugRef, {
      type: "artist",
      targetId: workspaceId,
      workspaceId,
      createdAt: now,
    });
  });

  const existingClaims =
    (await auth.getUser(input.uid)).customClaims ?? {};
  await auth.setCustomUserClaims(input.uid, {
    ...existingClaims,
    workspaces: { [workspaceId]: "owner" },
  });

  return {
    workspaceId,
    slug,
    created: true,
    onboardingComplete: false,
  };
}

async function readProfileSlug(
  db: Firestore,
  workspaceId: string,
): Promise<string> {
  const snap = await db.collection("artistProfiles").doc(workspaceId).get();
  return (snap.data()?.slug as string | undefined) ?? workspaceId;
}

/**
 * Derives a URL-safe slug from the display name and appends a numeric suffix
 * until the `slugs` registry has a free slot.
 */
async function reserveUniqueSlug(
  db: Firestore,
  displayName: string,
  workspaceId: string,
): Promise<string> {
  const base =
    slugify(displayName) ??
    `artist-${workspaceId.slice(0, 8).toLowerCase()}`;

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate =
      attempt === 0 ? base : `${base}-${attempt + 1}`;

    if (!isValidSlug(candidate) || isReservedSlug(candidate)) continue;

    const snap = await db.collection("slugs").doc(candidate).get();
    if (!snap.exists) return candidate;
  }

  // Extremely unlikely — fall back to the workspace id itself.
  const fallback = `a-${workspaceId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)}`;
  return isValidSlug(fallback) ? fallback : `artist${Date.now()}`;
}
