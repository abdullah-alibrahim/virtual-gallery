import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/errors";
import { requirePlatformAdmin } from "@/infrastructure/admin/require-platform-admin";
import { setUserDisabled } from "@/infrastructure/admin/set-user-disabled";
import { setUserPlatformAdmin } from "@/infrastructure/admin/set-user-platform-admin";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    platformAdmin: z.boolean().optional(),
    disabled: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.platformAdmin !== undefined || value.disabled !== undefined,
    { message: "platformAdmin or disabled required" },
  );

export async function PATCH(
  request: Request,
  context: { params: Promise<{ uid: string }> },
) {
  let actorUid: string;
  try {
    const ctx = await requirePlatformAdmin();
    actorUid = ctx.session.uid;
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uid } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "platformAdmin or disabled boolean required" },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.platformAdmin !== undefined) {
      if (uid === actorUid && parsed.data.platformAdmin === false) {
        return NextResponse.json(
          { error: "You cannot revoke your own admin access" },
          { status: 400 },
        );
      }
      await setUserPlatformAdmin(uid, parsed.data.platformAdmin);
    }
    if (parsed.data.disabled !== undefined) {
      if (uid === actorUid && parsed.data.disabled === true) {
        return NextResponse.json(
          { error: "You cannot suspend your own account" },
          { status: 400 },
        );
      }
      await setUserDisabled(uid, parsed.data.disabled);
    }
    return NextResponse.json({ ok: true, uid, ...parsed.data });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[api/admin/users] failed", error);
    return NextResponse.json(
      { error: "Could not update user" },
      { status: 500 },
    );
  }
}
