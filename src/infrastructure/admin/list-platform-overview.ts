/**
 * Platform overview for the admin panel (Admin SDK).
 */

import { getAdminAuth, getAdminDb } from "@/infrastructure/firebase/admin";
import {
  isEmailPlatformAdmin,
  parseAdminEmails,
} from "@/infrastructure/firebase/platform-admin";

export interface AdminUserRow {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string;
  readonly workspaceId: string;
  readonly onboardingComplete: boolean;
  readonly platformAdmin: boolean;
  readonly disabled: boolean;
  readonly plan: string | null;
  readonly createdAt: string | null;
}

export interface AdminWorkspaceRow {
  readonly id: string;
  readonly name: string;
  readonly plan: string;
  readonly ownerId: string;
  readonly galleries: number;
  readonly galleryLimit: number;
  readonly storageBytes: number;
  readonly storageLimit: number;
  readonly seats: number;
  readonly createdAt: string | null;
}

export interface AdminGalleryRow {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly workspaceId: string;
  readonly slug: string;
  readonly deleted: boolean;
  readonly createdAt: string | null;
}

export interface AdminTemplateRow {
  readonly id: string;
  readonly name: string;
  readonly tier: string;
  readonly status: string;
  readonly category: string;
}

export interface PlatformOverview {
  readonly stats: {
    readonly users: number;
    readonly workspaces: number;
    readonly galleries: number;
    readonly publishedGalleries: number;
  };
  readonly users: readonly AdminUserRow[];
  readonly workspaces: readonly AdminWorkspaceRow[];
  readonly galleries: readonly AdminGalleryRow[];
  readonly templates: readonly AdminTemplateRow[];
  readonly adminEmails: readonly string[];
}

function isoFrom(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

export async function listPlatformOverview(
  limit = 80,
): Promise<PlatformOverview> {
  const db = getAdminDb();
  const auth = getAdminAuth();
  const adminEmails = parseAdminEmails();

  const [usersSnap, workspacesSnap, galleriesSnap, templatesSnap] =
    await Promise.all([
      db.collection("users").orderBy("createdAt", "desc").limit(limit).get(),
      db
        .collection("workspaces")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get(),
      db.collection("galleries").orderBy("createdAt", "desc").limit(limit).get(),
      db.collection("templates").limit(limit).get().catch(() => null),
    ]);

  const [usersCount, workspacesCount, galleriesCount, publishedCount] =
    await Promise.all([
      db.collection("users").count().get(),
      db.collection("workspaces").count().get(),
      db.collection("galleries").count().get(),
      db
        .collection("galleries")
        .where("status", "==", "published")
        .count()
        .get()
        .catch(() => null),
    ]);

  const workspacePlanById = new Map<string, string>();
  for (const doc of workspacesSnap.docs) {
    workspacePlanById.set(doc.id, String(doc.data().plan ?? "free"));
  }

  const claimCache = new Map<string, { admin: boolean; disabled: boolean }>();
  async function authFlags(uid: string): Promise<{
    admin: boolean;
    disabled: boolean;
  }> {
    if (claimCache.has(uid)) return claimCache.get(uid)!;
    try {
      const user = await auth.getUser(uid);
      const flags = {
        admin: Boolean(
          (user.customClaims as { platformAdmin?: boolean } | undefined)
            ?.platformAdmin,
        ),
        disabled: Boolean(user.disabled),
      };
      claimCache.set(uid, flags);
      return flags;
    } catch {
      const flags = { admin: false, disabled: false };
      claimCache.set(uid, flags);
      return flags;
    }
  }

  const users: AdminUserRow[] = [];
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const email = String(data.email ?? "");
    const flags = await authFlags(doc.id);
    const fromDoc = Boolean(data.platformAdmin);
    const workspaceId = String(data.defaultWorkspaceId ?? "");
    users.push({
      uid: doc.id,
      email,
      displayName: String(data.displayName ?? ""),
      workspaceId,
      onboardingComplete: Boolean(data.onboarding?.completed),
      platformAdmin:
        flags.admin || fromDoc || isEmailPlatformAdmin(email),
      disabled: flags.disabled || Boolean(data.disabled),
      plan: workspacePlanById.get(workspaceId) ?? null,
      createdAt: isoFrom(data.createdAt),
    });
  }

  const workspaces: AdminWorkspaceRow[] = workspacesSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: String(data.name ?? ""),
      plan: String(data.plan ?? "free"),
      ownerId: String(data.ownerId ?? ""),
      galleries: Number(data.usage?.galleries ?? 0),
      galleryLimit: Number(data.limits?.galleries ?? 0),
      storageBytes: Number(data.usage?.storageBytes ?? 0),
      storageLimit: Number(data.limits?.storageBytes ?? 0),
      seats: Number(data.limits?.seats ?? 1),
      createdAt: isoFrom(data.createdAt),
    };
  });

  const galleries: AdminGalleryRow[] = galleriesSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: String(data.title ?? ""),
      status: String(data.status ?? "draft"),
      workspaceId: String(data.workspaceId ?? ""),
      slug: String(data.slug ?? ""),
      deleted: Boolean(data.deletedAt),
      createdAt: isoFrom(data.createdAt),
    };
  });

  const templates: AdminTemplateRow[] = templatesSnap
    ? templatesSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: String(data.name ?? doc.id),
          tier: String(data.tier ?? "free"),
          status: String(data.status ?? "active"),
          category: String(data.category ?? ""),
        };
      })
    : [];

  return {
    stats: {
      users: usersCount.data().count,
      workspaces: workspacesCount.data().count,
      galleries: galleriesCount.data().count,
      publishedGalleries: publishedCount?.data().count ?? 0,
    },
    users,
    workspaces,
    galleries,
    templates,
    adminEmails,
  };
}
