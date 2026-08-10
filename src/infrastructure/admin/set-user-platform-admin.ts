import { FieldValue } from "firebase-admin/firestore";

import { NotFoundError, ValidationError } from "@/core/errors";
import { getAdminAuth, getAdminDb } from "@/infrastructure/firebase/admin";
import { setPlatformAdminClaim } from "@/infrastructure/firebase/platform-admin";

export async function setUserPlatformAdmin(
  uid: string,
  platformAdmin: boolean,
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

  await setPlatformAdminClaim(auth, uid, platformAdmin);
  await db.collection("users").doc(uid).set(
    {
      platformAdmin,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
