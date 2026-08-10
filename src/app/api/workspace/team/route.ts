import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PlanLimitError,
  ValidationError,
} from "@/core/errors";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import {
  inviteWorkspaceMember,
  listWorkspaceInvites,
  listWorkspaceMembers,
} from "@/infrastructure/workspaces/team";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx?.account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const workspaceId = ctx.account.defaultWorkspaceId;
  try {
    const [members, invites] = await Promise.all([
      listWorkspaceMembers(workspaceId, ctx.session.uid),
      listWorkspaceInvites(workspaceId, ctx.session.uid).catch(() => []),
    ]);
    return NextResponse.json({
      members: members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
      invites: invites.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        acceptedAt: i.acceptedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[api/workspace/team] list failed", error);
    return NextResponse.json({ error: "Could not load team" }, { status: 500 });
  }
}

const inviteSchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
});

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx?.account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  try {
    const result = await inviteWorkspaceMember({
      workspaceId: ctx.account.defaultWorkspaceId,
      uid: ctx.session.uid,
      email: parsed.data.email,
      role: parsed.data.role,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          upgrade: "Upgrade your plan for more team seats.",
        },
        { status: 402 },
      );
    }
    if (error instanceof ValidationError || error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[api/workspace/team] invite failed", error);
    return NextResponse.json({ error: "Could not send invite" }, { status: 500 });
  }
}
