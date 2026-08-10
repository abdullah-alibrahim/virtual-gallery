/**
 * Platform-ops admin gate.
 *
 * A user is a platform admin when either:
 * 1. Their email is listed in `ADMIN_EMAILS` (comma-separated), or
 * 2. Their Auth custom claim `platformAdmin` is true
 *    (set via /admin, seed:admin, or seed:demo).
 *
 * Workspace `admin` roles are unrelated — those are tenant roles.
 */

import type { Auth } from "firebase-admin/auth";

import type { SessionUser } from "./session";

export function parseAdminEmails(
  raw = process.env.ADMIN_EMAILS ?? "",
): readonly string[] {
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return parseAdminEmails().includes(normalized);
}

export function isPlatformAdmin(
  session: Pick<SessionUser, "email" | "platformAdmin">,
): boolean {
  if (session.platformAdmin) return true;
  return isEmailPlatformAdmin(session.email);
}

export async function setPlatformAdminClaim(
  auth: Auth,
  uid: string,
  platformAdmin: boolean,
): Promise<void> {
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;
  await auth.setCustomUserClaims(uid, {
    ...existing,
    platformAdmin,
  });
}
