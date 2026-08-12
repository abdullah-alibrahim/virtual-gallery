/**
 * Creates a collector enquiry (lead) against a published gallery.
 */

import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";

import { NotFoundError, ValidationError } from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import {
  sendEnquiryConfirmation,
  sendEnquiryToArtist,
} from "@/infrastructure/email/send";
import { assertRateLimit } from "@/infrastructure/security/rate-limit";
import { hourBucket } from "@/lib/rate-limit";
import { siteConfig } from "@/config/site";

export interface CreateLeadInput {
  readonly galleryId: string;
  readonly artworkId: string | null;
  readonly name: string;
  readonly email: string;
  readonly message: string;
  /** Soft rate-limit key (IP hash or visitor id). */
  readonly rateKey: string;
}

export async function createLead(input: CreateLeadInput): Promise<{ id: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim();

  if (name.length < 1 || name.length > 120) {
    throw new ValidationError("Name is required");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new ValidationError("Enter a valid email");
  }
  if (message.length < 1 || message.length > 2000) {
    throw new ValidationError("Message must be 1–2000 characters");
  }

  await assertRateLimit({
    key: `lead:${input.rateKey}`,
    limit: 5,
    windowId: hourBucket(),
  });

  const db = getAdminDb();
  const galleryRef = db.collection("galleries").doc(input.galleryId);
  const gallerySnap = await galleryRef.get();
  if (!gallerySnap.exists || gallerySnap.data()?.deletedAt) {
    throw new NotFoundError("Gallery", input.galleryId);
  }

  const gallery = gallerySnap.data()!;
  if (gallery.status !== "published") {
    throw new ValidationError("This gallery is not accepting enquiries");
  }

  const workspaceId = String(gallery.workspaceId);
  const profileSnap = await db
    .collection("artistProfiles")
    .doc(workspaceId)
    .get();
  if (profileSnap.data()?.contact?.allowInquiries === false) {
    throw new ValidationError("This artist is not accepting enquiries");
  }

  const leadId = randomUUID();
  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    tx.set(galleryRef.collection("leads").doc(leadId), {
      galleryId: input.galleryId,
      workspaceId,
      artworkId: input.artworkId,
      name,
      email,
      message,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });
    tx.update(galleryRef, {
      "counters.leads": FieldValue.increment(1),
      updatedAt: now,
    });
  });

  void notifyEnquiry({
    workspaceId,
    galleryId: input.galleryId,
    galleryTitle: String(gallery.title ?? "Gallery"),
    artworkId: input.artworkId,
    collectorName: name,
    collectorEmail: email,
    message,
  }).catch((error) => {
    console.error("[enquiry-email] failed", error);
  });

  return { id: leadId };
}

async function notifyEnquiry(input: {
  workspaceId: string;
  galleryId: string;
  galleryTitle: string;
  artworkId: string | null;
  collectorName: string;
  collectorEmail: string;
  message: string;
}): Promise<void> {
  const db = getAdminDb();
  const workspaceSnap = await db
    .collection("workspaces")
    .doc(input.workspaceId)
    .get();
  const ownerId = String(workspaceSnap.data()?.ownerId ?? "");
  if (!ownerId) return;

  const [memberSnap, userSnap, artworkSnap] = await Promise.all([
    db
      .collection("workspaces")
      .doc(input.workspaceId)
      .collection("members")
      .doc(ownerId)
      .get(),
    db.collection("users").doc(ownerId).get(),
    input.artworkId
      ? db
          .collection("galleries")
          .doc(input.galleryId)
          .collection("artworks")
          .doc(input.artworkId)
          .get()
      : Promise.resolve(null),
  ]);

  const artworkTitle = artworkSnap?.exists
    ? String(artworkSnap.data()?.title ?? "") || null
    : null;
  const artistName =
    String(memberSnap.data()?.displayName ?? userSnap.data()?.displayName ?? "") ||
    "Artist";
  const artistEmail = String(
    memberSnap.data()?.email ?? userSnap.data()?.email ?? "",
  );

  if (artistEmail) {
    await sendEnquiryToArtist({
      to: artistEmail,
      artistName,
      collectorName: input.collectorName,
      collectorEmail: input.collectorEmail,
      message: input.message,
      galleryTitle: input.galleryTitle,
      artworkTitle,
      inboxUrl: `${siteConfig.url}/inbox`,
    });
  }

  await sendEnquiryConfirmation({
    to: input.collectorEmail,
    collectorName: input.collectorName,
    artistName,
    galleryTitle: input.galleryTitle,
  });
}
