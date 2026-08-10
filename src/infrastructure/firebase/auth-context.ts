/**
 * Loads the authenticated user's account document after session verify.
 */

import type { DocumentData } from "firebase-admin/firestore";

import type { UserAccount } from "@/core/entities";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import {
  getSession,
  type SessionUser,
} from "@/infrastructure/firebase/session";

export interface AuthContext {
  readonly session: SessionUser;
  readonly account: UserAccount | null;
}

function mapAccount(uid: string, data: DocumentData): UserAccount {
  const onboarding = (data.onboarding ?? {}) as {
    completed?: boolean;
    step?: UserAccount["onboarding"]["step"];
    completedAt?: { toDate?: () => Date };
  };

  return {
    id: uid,
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? ""),
    photoURL: (data.photoURL as string | null) ?? null,
    defaultWorkspaceId: String(data.defaultWorkspaceId ?? ""),
    locale: String(data.locale ?? "en"),
    onboarding: {
      completed: Boolean(onboarding.completed),
      step: onboarding.step ?? "profile",
      completedAt: onboarding.completedAt?.toDate?.() ?? null,
    },
    createdAt: (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date(0),
    updatedAt: (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date(0),
  };
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getSession();
  if (!session) return null;

  const snap = await getAdminDb().collection("users").doc(session.uid).get();
  if (!snap.exists) {
    return { session, account: null };
  }

  return {
    session,
    account: mapAccount(session.uid, snap.data()!),
  };
}
