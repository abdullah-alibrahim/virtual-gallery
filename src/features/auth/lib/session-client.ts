/**
 * Client-side session exchange and sign-out.
 */

import { clientSignOut } from "@/infrastructure/firebase/auth-client";

export type { SessionExchangeResult } from "./exchange-session";
export { exchangeSession } from "./exchange-session";

export async function signOut(): Promise<void> {
  try {
    await clientSignOut();
  } catch {
    // Client auth may already be cleared — still drop the cookie.
  }

  await fetch("/api/session", { method: "DELETE" });
}
