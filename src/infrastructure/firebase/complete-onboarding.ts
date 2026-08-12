/**
 * Completes artist onboarding (profile + slug rewrite).
 * Slug registry writes are Admin-only per security rules.
 */

import { FieldValue } from "firebase-admin/firestore";

import {
  isReservedSlug,
  isValidSlug,
  toSlug,
} from "@/core/value-objects/slug";
import { ValidationError, ConflictError } from "@/core/errors";
import { siteConfig } from "@/config/site";
import { sendWelcomeEmail } from "@/infrastructure/email/send";
import { createFirstExhibition } from "@/infrastructure/galleries/create-first-exhibition";
import { loadWorkspaceUsage } from "@/infrastructure/workspaces/load-workspace-usage";

import { getAdminDb } from "./admin";

export interface CompleteOnboardingInput {
  readonly uid: string;
  readonly displayName: string;
  readonly slug: string;
  readonly bio: string;
}

export interface CompleteOnboardingResult {
  readonly slug: string;
  readonly workspaceId: string;
  readonly galleryId: string | null;
}

export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<CompleteOnboardingResult> {
  const nextSlugRaw = input.slug.trim().toLowerCase();

  if (!isValidSlug(nextSlugRaw) || isReservedSlug(nextSlugRaw)) {
    throw new ValidationError("That profile URL isn’t available.");
  }

  const nextSlug = toSlug(nextSlugRaw);
  const db = getAdminDb();
  const userRef = db.collection("users").doc(input.uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new ConflictError("Account not bootstrapped");
  }

  const userData = userSnap.data()!;
  const workspaceId = String(userData.defaultWorkspaceId);
  const email = String(userData.email ?? "");
  const profileRef = db.collection("artistProfiles").doc(workspaceId);
  const profileSnap = await profileRef.get();
  const currentSlug = String(profileSnap.data()?.slug ?? "");

  if (nextSlug !== currentSlug) {
    const taken = await db.collection("slugs").doc(nextSlug).get();
    if (taken.exists) {
      throw new ConflictError("That URL is already taken. Try another.");
    }
  }

  const now = FieldValue.serverTimestamp();
  const displayName = input.displayName.trim();
  const bio = input.bio.trim();

  await db.runTransaction(async (tx) => {
    tx.update(userRef, {
      displayName,
      onboarding: {
        completed: true,
        step: "done",
        completedAt: now,
      },
      updatedAt: now,
    });

    tx.update(db.collection("workspaces").doc(workspaceId), {
      name: displayName,
      updatedAt: now,
    });

    tx.update(
      db
        .collection("workspaces")
        .doc(workspaceId)
        .collection("members")
        .doc(input.uid),
      { displayName },
    );

    tx.update(profileRef, {
      displayName,
      bio,
      slug: nextSlug,
      updatedAt: now,
    });

    if (nextSlug !== currentSlug) {
      if (currentSlug) {
        tx.delete(db.collection("slugs").doc(currentSlug));
      }
      tx.set(db.collection("slugs").doc(nextSlug), {
        type: "artist",
        targetId: workspaceId,
        workspaceId,
        createdAt: now,
      });
    }
  });

  if (email) {
    void sendWelcomeEmail({
      to: email,
      displayName,
      profileUrl: `${siteConfig.url}/a/${nextSlug}`,
    }).catch((error) => {
      console.error("[welcome-email] failed", error);
    });
  }

  let galleryId: string | null = null;
  try {
    const usage = await loadWorkspaceUsage(workspaceId);
    if (usage && usage.usage.galleries === 0) {
      const first = await createFirstExhibition({
        uid: input.uid,
        workspaceId,
        displayName,
      });
      galleryId = first?.galleryId ?? null;
    }
  } catch (error) {
    console.error("[first-exhibition] failed", error);
  }

  return { slug: nextSlug, workspaceId, galleryId };
}
