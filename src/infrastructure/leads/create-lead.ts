/**
 * Creates a collector enquiry (lead) against a published gallery.
 */

import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";

import { NotFoundError, ValidationError } from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { assertRateLimit } from "@/infrastructure/security/rate-limit";
import { hourBucket } from "@/lib/rate-limit";

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

  return { id: leadId };
}
