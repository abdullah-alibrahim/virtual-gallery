/**
 * Workspace team: list members, invite by email, revoke pending invites.
 */

import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";

import type { MemberRole, WorkspaceInvite, WorkspaceMember } from "@/core/entities";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PlanLimitError,
  ValidationError,
} from "@/core/errors";
import {
  assertCanInviteMember,
  limitsForPlan,
} from "@/core/services/enforce-plan-limits";
import { PLAN_LIMITS } from "@/core/services/plan-limits";
import { getAdminAuth, getAdminDb } from "@/infrastructure/firebase/admin";

const INVITE_ROLES: readonly Exclude<MemberRole, "owner">[] = [
  "admin",
  "editor",
  "viewer",
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function requireOwnerOrAdmin(
  workspaceId: string,
  uid: string,
): Promise<{ role: MemberRole }> {
  const member = await getAdminDb()
    .collection("workspaces")
    .doc(workspaceId)
    .collection("members")
    .doc(uid)
    .get();
  if (!member.exists) {
    throw new ForbiddenError("not a workspace member");
  }
  const role = String(member.data()?.role ?? "viewer") as MemberRole;
  if (role !== "owner" && role !== "admin") {
    throw new ForbiddenError("Only owners and admins can manage the team");
  }
  return { role };
}

export async function listWorkspaceMembers(
  workspaceId: string,
  uid: string,
): Promise<readonly WorkspaceMember[]> {
  const member = await getAdminDb()
    .collection("workspaces")
    .doc(workspaceId)
    .collection("members")
    .doc(uid)
    .get();
  if (!member.exists) {
    throw new ForbiddenError("not a workspace member");
  }

  const snap = await getAdminDb()
    .collection("workspaces")
    .doc(workspaceId)
    .collection("members")
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    const joined = data.joinedAt?.toDate?.() ?? new Date(0);
    return {
      uid: String(data.uid ?? doc.id),
      role: String(data.role ?? "viewer") as MemberRole,
      displayName: String(data.displayName ?? ""),
      email: String(data.email ?? ""),
      joinedAt: joined,
    };
  });
}

export async function listWorkspaceInvites(
  workspaceId: string,
  uid: string,
): Promise<readonly WorkspaceInvite[]> {
  await requireOwnerOrAdmin(workspaceId, uid);

  const snap = await getAdminDb()
    .collection("workspaces")
    .doc(workspaceId)
    .collection("invites")
    .where("status", "==", "pending")
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      workspaceId,
      email: String(data.email ?? ""),
      role: String(data.role ?? "editor") as Exclude<MemberRole, "owner">,
      invitedBy: String(data.invitedBy ?? ""),
      status: "pending" as const,
      createdAt: data.createdAt?.toDate?.() ?? new Date(0),
      acceptedAt: null,
    };
  });
}

export async function inviteWorkspaceMember(input: {
  workspaceId: string;
  uid: string;
  email: string;
  role: Exclude<MemberRole, "owner">;
}): Promise<{ inviteId: string | null; joined: boolean; uid?: string }> {
  await requireOwnerOrAdmin(input.workspaceId, input.uid);

  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    throw new ValidationError("A valid email is required");
  }
  if (!INVITE_ROLES.includes(input.role)) {
    throw new ValidationError("Role must be admin, editor, or viewer");
  }

  const db = getAdminDb();
  const workspaceRef = db.collection("workspaces").doc(input.workspaceId);
  const workspaceSnap = await workspaceRef.get();
  if (!workspaceSnap.exists) {
    throw new NotFoundError("Workspace", input.workspaceId);
  }

  const data = workspaceSnap.data()!;
  const plan = (data.plan ?? "free") as keyof typeof PLAN_LIMITS;
  const fallback = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const limits = {
    ...limitsForPlan(plan),
    seats: Number(data.limits?.seats ?? fallback.seats),
  };

  const [membersSnap, invitesSnap] = await Promise.all([
    workspaceRef.collection("members").get(),
    workspaceRef.collection("invites").where("status", "==", "pending").get(),
  ]);

  const alreadyMember = membersSnap.docs.some(
    (doc) => normalizeEmail(String(doc.data().email ?? "")) === email,
  );
  if (alreadyMember) {
    throw new ConflictError("That person is already a member");
  }

  const pendingSame = invitesSnap.docs.some(
    (doc) => normalizeEmail(String(doc.data().email ?? "")) === email,
  );
  if (pendingSame) {
    throw new ConflictError("An invite is already pending for that email");
  }

  const occupied = membersSnap.size + invitesSnap.size;
  try {
    assertCanInviteMember(occupied, limits);
  } catch (error) {
    if (error instanceof PlanLimitError) throw error;
    throw error;
  }

  // If the invitee already has an account, add them immediately.
  try {
    const authUser = await getAdminAuth().getUserByEmail(email);
    await addMemberWithClaims({
      workspaceId: input.workspaceId,
      uid: authUser.uid,
      email,
      displayName: authUser.displayName ?? email.split("@")[0] ?? "Member",
      role: input.role,
    });
    return { inviteId: null, joined: true, uid: authUser.uid };
  } catch {
    // No Auth user yet — create a pending invite.
  }

  const inviteId = randomUUID();
  const now = FieldValue.serverTimestamp();
  await workspaceRef.collection("invites").doc(inviteId).set({
    email,
    role: input.role,
    invitedBy: input.uid,
    status: "pending",
    createdAt: now,
    acceptedAt: null,
  });

  return { inviteId, joined: false };
}

export async function revokeWorkspaceInvite(input: {
  workspaceId: string;
  uid: string;
  inviteId: string;
}): Promise<void> {
  await requireOwnerOrAdmin(input.workspaceId, input.uid);

  const ref = getAdminDb()
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("invites")
    .doc(input.inviteId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new NotFoundError("Invite", input.inviteId);
  }
  await ref.update({
    status: "revoked",
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function removeWorkspaceMember(input: {
  workspaceId: string;
  actorUid: string;
  memberUid: string;
}): Promise<void> {
  const { role: actorRole } = await requireOwnerOrAdmin(
    input.workspaceId,
    input.actorUid,
  );

  if (input.memberUid === input.actorUid) {
    throw new ValidationError("You cannot remove yourself");
  }

  const db = getAdminDb();
  const memberRef = db
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("members")
    .doc(input.memberUid);
  const snap = await memberRef.get();
  if (!snap.exists) {
    throw new NotFoundError("Member", input.memberUid);
  }

  const targetRole = String(snap.data()?.role ?? "viewer") as MemberRole;
  if (targetRole === "owner") {
    throw new ForbiddenError("Cannot remove the workspace owner");
  }
  if (actorRole === "admin" && targetRole === "admin") {
    throw new ForbiddenError("Admins cannot remove other admins");
  }

  await memberRef.delete();

  const auth = getAdminAuth();
  try {
    const user = await auth.getUser(input.memberUid);
    const claims = { ...(user.customClaims ?? {}) } as {
      workspaces?: Record<string, string>;
    };
    const workspaces = { ...(claims.workspaces ?? {}) };
    delete workspaces[input.workspaceId];
    await auth.setCustomUserClaims(input.memberUid, {
      ...claims,
      workspaces,
    });
  } catch {
    // Auth user may already be gone.
  }
}

async function addMemberWithClaims(input: {
  workspaceId: string;
  uid: string;
  email: string;
  displayName: string;
  role: Exclude<MemberRole, "owner">;
}): Promise<void> {
  const db = getAdminDb();
  const auth = getAdminAuth();
  const now = FieldValue.serverTimestamp();

  await db
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("members")
    .doc(input.uid)
    .set({
      uid: input.uid,
      role: input.role,
      displayName: input.displayName,
      email: input.email,
      joinedAt: now,
    });

  const user = await auth.getUser(input.uid);
  const existing = (user.customClaims ?? {}) as {
    workspaces?: Record<string, string>;
  };
  await auth.setCustomUserClaims(input.uid, {
    ...existing,
    workspaces: {
      ...(existing.workspaces ?? {}),
      [input.workspaceId]: input.role,
    },
  });
}

/**
 * Accept any pending invites matching this email (called after sign-in / bootstrap).
 */
export async function acceptPendingInvitesForEmail(input: {
  uid: string;
  email: string;
  displayName: string;
}): Promise<number> {
  const email = normalizeEmail(input.email);
  if (!email) return 0;

  const db = getAdminDb();
  // Collection-group query requires an index; scan workspaces with invites is heavy.
  // Emulator / small datasets: query invites by email via collectionGroup.
  let snap;
  try {
    snap = await db
      .collectionGroup("invites")
      .where("email", "==", email)
      .where("status", "==", "pending")
      .get();
  } catch {
    return 0;
  }

  let accepted = 0;
  for (const doc of snap.docs) {
    const workspaceId = doc.ref.parent.parent?.id;
    if (!workspaceId) continue;
    const role = String(doc.data().role ?? "editor") as Exclude<
      MemberRole,
      "owner"
    >;
    const memberRef = db
      .collection("workspaces")
      .doc(workspaceId)
      .collection("members")
      .doc(input.uid);
    const existing = await memberRef.get();
    if (existing.exists) {
      await doc.ref.update({
        status: "accepted",
        acceptedAt: FieldValue.serverTimestamp(),
      });
      continue;
    }

    await addMemberWithClaims({
      workspaceId,
      uid: input.uid,
      email,
      displayName: input.displayName,
      role: INVITE_ROLES.includes(role) ? role : "editor",
    });
    await doc.ref.update({
      status: "accepted",
      acceptedAt: FieldValue.serverTimestamp(),
    });
    accepted += 1;
  }
  return accepted;
}
