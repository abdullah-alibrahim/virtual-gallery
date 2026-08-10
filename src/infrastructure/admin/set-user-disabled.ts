/**
 * Suspend / reinstate a user via Auth disabled flag + Firestore mirror.
 */

import { FieldValue } from "firebase-admin/firestore";

import { NotFoundError, ValidationError } from "@/core/errors";
import { getAdminAuth, getAdminDb } from "@/infrastructure/firebase/admin";
import { revokeUserSessions } from "@/infrastructure/firebase/session";

export async function setUserDisabled(
  uid: string,
  disabled: boolean,
): Promise<void> {
  if (!uid.trim()) {
    throw new ValidationError("uid is required");
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    await auth.getUser(uid);
  } catch {
    throw new NotFoundError("user", uid);
  }

  await auth.updateUser(uid, { disabled });
  if (disabled) {
    await revokeUserSessions(uid);
  }

  await db.collection("users").doc(uid).set(
    {
      disabled,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
