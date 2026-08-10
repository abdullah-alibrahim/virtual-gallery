import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/errors";
import { requirePlatformAdmin } from "@/infrastructure/admin/require-platform-admin";
import {
  isPlanId,
  setWorkspacePlan,
} from "@/infrastructure/admin/set-workspace-plan";

export const runtime = "nodejs";

const bodySchema = z.object({
  plan: z.enum(["free", "pro", "studio"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    await requirePlatformAdmin();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success || !isPlanId(parsed.data.plan)) {
    return NextResponse.json(
      { error: "plan must be free, pro, or studio" },
      { status: 400 },
    );
  }

  try {
    const result = await setWorkspacePlan(workspaceId, parsed.data.plan);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[api/admin/workspaces] failed", error);
    return NextResponse.json(
      { error: "Could not update workspace" },
      { status: 500 },
    );
  }
}
