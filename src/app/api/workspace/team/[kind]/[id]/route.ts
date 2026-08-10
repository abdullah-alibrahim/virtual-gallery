import { NextResponse } from "next/server";

import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import {
  removeWorkspaceMember,
  revokeWorkspaceInvite,
} from "@/infrastructure/workspaces/team";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  const ctx = await getAuthContext();
  if (!ctx?.account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { kind, id } = await context.params;
  const workspaceId = ctx.account.defaultWorkspaceId;

  try {
    if (kind === "invite") {
      await revokeWorkspaceInvite({
        workspaceId,
        uid: ctx.session.uid,
        inviteId: id,
      });
      return NextResponse.json({ ok: true });
    }
    if (kind === "member") {
      await removeWorkspaceMember({
        workspaceId,
        actorUid: ctx.session.uid,
        memberUid: id,
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[api/workspace/team] delete failed", error);
    return NextResponse.json({ error: "Could not update team" }, { status: 500 });
  }
}
