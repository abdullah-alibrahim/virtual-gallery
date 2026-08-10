"use client";

import { useEffect, type ReactNode } from "react";

import {
  signInWithSessionToken,
  subscribeAuth,
} from "@/infrastructure/firebase/auth-client";

/**
 * Ensures the client Firebase Auth SDK is signed in whenever the httpOnly
 * session cookie is present. Storage uploads and Firestore subscriptions need
 * the client token to carry workspace claims.
 */
export function AuthHydrator({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    let hydrating = false;

    const unsub = subscribeAuth((user) => {
      if (cancelled || user || hydrating) return;

      hydrating = true;
      void (async () => {
        try {
          const response = await fetch("/api/session/token");
          if (!response.ok) return;
          const body = (await response.json()) as { token?: string };
          if (body.token) await signInWithSessionToken(body.token);
        } catch {
          // Marketing routes stay anonymous.
        } finally {
          hydrating = false;
        }
      })();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return children;
}
