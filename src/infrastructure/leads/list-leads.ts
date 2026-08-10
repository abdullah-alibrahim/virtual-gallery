/**
 * Lists and updates leads for a workspace inbox.
 */

import { FieldValue } from "firebase-admin/firestore";

import type { Lead, LeadStatus } from "@/core/entities";
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export async function listWorkspaceLeads(input: {
  workspaceId: string;
  uid: string;
}): Promise<Lead[]> {
  await assertMember(input.workspaceId, input.uid);

  const snap = await getAdminDb()
    .collectionGroup("leads")
    .where("workspaceId", "==", input.workspaceId)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      galleryId: String(data.galleryId),
      workspaceId: String(data.workspaceId),
      artworkId: data.artworkId ?? null,
      name: String(data.name),
      email: String(data.email),
      message: String(data.message),
      status: data.status as LeadStatus,
      createdAt: data.createdAt?.toDate?.() ?? new Date(0),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(0),
    };
  });
}

export async function updateLeadStatus(input: {
  galleryId: string;
  leadId: string;
  uid: string;
  status: LeadStatus;
}): Promise<void> {
  const allowed: LeadStatus[] = ["new", "read", "replied", "archived"];
  if (!allowed.includes(input.status)) {
    throw new ValidationError("Invalid status");
  }

  const db = getAdminDb();
  const leadRef = db
    .collection("galleries")
    .doc(input.galleryId)
    .collection("leads")
    .doc(input.leadId);
  const snap = await leadRef.get();
  if (!snap.exists) throw new NotFoundError("Lead", input.leadId);

  await assertMember(String(snap.data()!.workspaceId), input.uid);

  await leadRef.update({
    status: input.status,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function assertMember(workspaceId: string, uid: string) {
  const member = await getAdminDb()
    .collection("workspaces")
    .doc(workspaceId)
    .collection("members")
    .doc(uid)
    .get();
  if (!member.exists) throw new ForbiddenError("not a workspace member");
}
