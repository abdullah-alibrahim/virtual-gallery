/**
 * Studio custom domain: save hostname, verify CNAME, look up by host.
 */

import { promises as dns } from "node:dns";
import { FieldValue } from "firebase-admin/firestore";

import { siteConfig } from "@/config/site";
import { ForbiddenError, ValidationError } from "@/core/errors";
import {
  cnameTargetFromSiteUrl,
  isPrimarySiteHost,
  isValidCustomHostname,
  normalizeHostname,
} from "@/core/services/custom-hostname";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { reconcileWorkspacePlan } from "@/infrastructure/billing/pro-trial";

export type CustomHostnameStatus = "pending" | "verified";

export interface CustomHostnameRecord {
  readonly host: string;
  readonly status: CustomHostnameStatus;
  readonly cnameTarget: string;
}

export async function loadCustomHostname(
  workspaceId: string,
): Promise<CustomHostnameRecord | null> {
  const snap = await getAdminDb().collection("workspaces").doc(workspaceId).get();
  const row = snap.data()?.customHostname as
    | { host?: string; status?: string }
    | undefined;
  if (!row?.host) return null;
  return {
    host: String(row.host),
    status: row.status === "verified" ? "verified" : "pending",
    cnameTarget: cnameTargetFromSiteUrl(siteConfig.url),
  };
}

export async function lookupHostname(
  host: string,
): Promise<{ workspaceId: string; artistSlug: string } | null> {
  const normalized = normalizeHostname(host);
  if (!normalized) return null;
  const snap = await getAdminDb().collection("hostnames").doc(normalized).get();
  if (!snap.exists || snap.data()?.status !== "verified") return null;
  return {
    workspaceId: String(snap.data()?.workspaceId ?? ""),
    artistSlug: String(snap.data()?.artistSlug ?? ""),
  };
}

export async function setCustomHostname(input: {
  uid: string;
  workspaceId: string;
  host: string;
}): Promise<CustomHostnameRecord> {
  const host = normalizeHostname(input.host);
  if (!isValidCustomHostname(host)) {
    throw new ValidationError("Enter a domain like gallery.yourstudio.com");
  }
  if (isPrimarySiteHost(host, siteConfig.url)) {
    throw new ValidationError("That host is already this site");
  }

  const reconciled = await reconcileWorkspacePlan(input.workspaceId);
  if (!reconciled?.limits.customDomain) {
    throw new ForbiddenError("Custom domains are included on Studio");
  }

  const db = getAdminDb();
  const member = await db
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();
  if (!member.exists || member.data()?.role !== "owner") {
    throw new ForbiddenError("Only the workspace owner can set a domain");
  }

  const taken = await db.collection("hostnames").doc(host).get();
  if (taken.exists && taken.data()?.workspaceId !== input.workspaceId) {
    throw new ValidationError("That domain is already in use");
  }

  const profile = await db.collection("artistProfiles").doc(input.workspaceId).get();
  const artistSlug = String(profile.data()?.slug ?? "");
  const cnameTarget = cnameTargetFromSiteUrl(siteConfig.url);
  const now = FieldValue.serverTimestamp();

  const previous = await loadCustomHostname(input.workspaceId);
  if (previous && previous.host !== host) {
    await db.collection("hostnames").doc(previous.host).delete();
  }

  await db.collection("hostnames").doc(host).set({
    workspaceId: input.workspaceId,
    artistSlug,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  await db.collection("workspaces").doc(input.workspaceId).update({
    customHostname: { host, status: "pending" },
    updatedAt: now,
  });

  return { host, status: "pending", cnameTarget };
}

export async function verifyCustomHostname(input: {
  uid: string;
  workspaceId: string;
}): Promise<CustomHostnameRecord> {
  const current = await loadCustomHostname(input.workspaceId);
  if (!current) {
    throw new ValidationError("Add a domain first");
  }

  const db = getAdminDb();
  const member = await db
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();
  if (!member.exists || member.data()?.role !== "owner") {
    throw new ForbiddenError("Only the workspace owner can verify a domain");
  }

  const ok = await cnamePointsAt(current.host, current.cnameTarget);
  if (!ok) {
    throw new ValidationError(
      `DNS not ready. Add a CNAME from ${current.host} to ${current.cnameTarget}`,
    );
  }

  const now = FieldValue.serverTimestamp();
  await db.collection("hostnames").doc(current.host).update({
    status: "verified",
    updatedAt: now,
  });
  await db.collection("workspaces").doc(input.workspaceId).update({
    "customHostname.status": "verified",
    updatedAt: now,
  });

  return { ...current, status: "verified" };
}

export async function clearCustomHostname(input: {
  uid: string;
  workspaceId: string;
}): Promise<void> {
  const db = getAdminDb();
  const member = await db
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();
  if (!member.exists || member.data()?.role !== "owner") {
    throw new ForbiddenError("Only the workspace owner can remove a domain");
  }

  const current = await loadCustomHostname(input.workspaceId);
  const now = FieldValue.serverTimestamp();
  if (current) {
    await db.collection("hostnames").doc(current.host).delete();
  }
  await db.collection("workspaces").doc(input.workspaceId).update({
    customHostname: null,
    updatedAt: now,
  });
}

async function cnamePointsAt(host: string, target: string): Promise<boolean> {
  try {
    const records = await dns.resolveCname(host);
    const wanted = target.toLowerCase();
    return records.some((row) => {
      const value = row.replace(/\.$/, "").toLowerCase();
      return value === wanted || value === "cname.vercel-dns.com";
    });
  } catch {
    return false;
  }
}
