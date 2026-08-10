/**
 * Shared soft rate limiter backed by Firestore.
 * Admin SDK only — clients never write `rateLimits`.
 */

import { FieldValue } from "firebase-admin/firestore";

import { ValidationError } from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export async function assertRateLimit(input: {
  key: string;
  limit: number;
  /** Bucket window label, e.g. ISO hour `2026-08-01T12`. */
  windowId: string;
}): Promise<void> {
  const ref = getAdminDb()
    .collection("rateLimits")
    .doc(`${input.key}:${input.windowId}`);
  const snap = await ref.get();
  const count = Number(snap.data()?.count ?? 0);
  if (count >= input.limit) {
    throw new ValidationError("Too many requests — try again later");
  }
  await ref.set(
    { count: count + 1, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}
