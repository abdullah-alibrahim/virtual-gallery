import { ForbiddenError } from "@/core/errors";
import {
  getAuthContext,
  type AuthContext,
} from "@/infrastructure/firebase/auth-context";
import { isPlatformAdmin } from "@/infrastructure/firebase/platform-admin";

/** Server-side gate for `/admin` pages and `/api/admin/*` routes. */
export async function requirePlatformAdmin(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new ForbiddenError("sign in required");
  if (!isPlatformAdmin(ctx.session)) {
    throw new ForbiddenError("platform admin access required");
  }
  return ctx;
}
