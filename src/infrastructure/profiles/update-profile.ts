/**
 * Updates the signed-in artist's public profile fields.
 */

import { FieldValue } from "firebase-admin/firestore";

import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export interface UpdateProfileInput {
  readonly uid: string;
  readonly workspaceId: string;
  readonly displayName: string;
  readonly bio: string;
  readonly statement: string;
  readonly location: string | null;
  readonly socials: {
    readonly website?: string;
    readonly instagram?: string;
    readonly twitter?: string;
    readonly linkedin?: string;
    readonly behance?: string;
  };
  readonly contact: {
    readonly allowInquiries: boolean;
    readonly showEmail: boolean;
  };
}

export async function updateArtistProfile(
  input: UpdateProfileInput,
): Promise<void> {
  const displayName = input.displayName.trim();
  if (displayName.length < 2 || displayName.length > 80) {
    throw new ValidationError("Display name must be 2–80 characters");
  }
  if (input.bio.length > 500) {
    throw new ValidationError("Bio is too long");
  }
  if (input.statement.length > 4000) {
    throw new ValidationError("Statement is too long");
  }

  const db = getAdminDb();
  const member = await db
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();
  if (!member.exists) {
    throw new ForbiddenError("not a workspace member");
  }

  const profileRef = db.collection("artistProfiles").doc(input.workspaceId);
  const snap = await profileRef.get();
  if (!snap.exists) {
    throw new NotFoundError("ArtistProfile", input.workspaceId);
  }

  const now = FieldValue.serverTimestamp();
  await db.runTransaction(async (tx) => {
    tx.update(profileRef, {
      displayName,
      bio: input.bio.trim(),
      statement: input.statement.trim(),
      location: input.location?.trim() || null,
      socials: {
        ...(input.socials.website
          ? { website: input.socials.website.trim() }
          : {}),
        ...(input.socials.instagram
          ? { instagram: input.socials.instagram.trim() }
          : {}),
        ...(input.socials.twitter
          ? { twitter: input.socials.twitter.trim() }
          : {}),
        ...(input.socials.linkedin
          ? { linkedin: input.socials.linkedin.trim() }
          : {}),
        ...(input.socials.behance
          ? { behance: input.socials.behance.trim() }
          : {}),
      },
      contact: {
        allowInquiries: input.contact.allowInquiries,
        showEmail: input.contact.showEmail,
      },
      updatedAt: now,
    });
    tx.update(db.collection("users").doc(input.uid), {
      displayName,
      updatedAt: now,
    });
    tx.update(db.collection("workspaces").doc(input.workspaceId), {
      name: displayName,
      updatedAt: now,
    });
  });
}
