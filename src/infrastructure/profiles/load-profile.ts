/**
 * Resolves a public artist profile by slug (via the global slug registry).
 */

import type { DocumentData } from "firebase-admin/firestore";

import type { ArtistProfile } from "@/core/entities";
import { NotFoundError } from "@/core/errors";
import { toSlug } from "@/core/value-objects/slug";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export async function loadArtistProfileBySlug(
  slug: string,
): Promise<ArtistProfile> {
  const db = getAdminDb();
  const slugSnap = await db.collection("slugs").doc(slug).get();
  if (!slugSnap.exists || slugSnap.data()?.type !== "artist") {
    throw new NotFoundError("ArtistProfile", slug);
  }

  const workspaceId = String(slugSnap.data()!.targetId);
  const profileSnap = await db
    .collection("artistProfiles")
    .doc(workspaceId)
    .get();
  if (!profileSnap.exists) {
    throw new NotFoundError("ArtistProfile", workspaceId);
  }

  return mapProfile(workspaceId, profileSnap.data()!);
}

export async function loadArtistProfileByWorkspace(
  workspaceId: string,
): Promise<ArtistProfile | null> {
  const snap = await getAdminDb()
    .collection("artistProfiles")
    .doc(workspaceId)
    .get();
  if (!snap.exists) return null;
  return mapProfile(workspaceId, snap.data()!);
}

export function mapProfile(
  workspaceId: string,
  data: DocumentData,
): ArtistProfile {
  const contact = data.contact ?? {};
  return {
    workspaceId,
    slug: toSlug(String(data.slug)),
    displayName: String(data.displayName ?? "Artist"),
    bio: String(data.bio ?? ""),
    statement: String(data.statement ?? ""),
    avatarUrl: data.avatarUrl ?? null,
    coverUrl: data.coverUrl ?? null,
    location: data.location ?? null,
    socials: data.socials ?? {},
    contact: {
      allowInquiries: Boolean(contact.allowInquiries ?? true),
      showEmail: Boolean(contact.showEmail ?? false),
      ...(contact.email ? { email: String(contact.email) } : {}),
    },
    featuredGalleryIds: Array.isArray(data.featuredGalleryIds)
      ? data.featuredGalleryIds.map(String)
      : [],
    createdAt: data.createdAt?.toDate?.() ?? new Date(0),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(0),
  };
}
