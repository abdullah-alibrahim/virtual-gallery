import { NextResponse } from "next/server";
import { z } from "zod";

import { ForbiddenError, ValidationError } from "@/core/errors";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import {
  clearCustomHostname,
  setCustomHostname,
  verifyCustomHostname,
} from "@/infrastructure/domains/custom-hostname";

export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum(["save", "verify", "remove"]),
  host: z.string().trim().max(253).optional(),
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

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid domain request" }, { status: 400 });
  }

  const workspaceId = ctx.account.defaultWorkspaceId;
  const uid = ctx.session.uid;

  try {
    if (parsed.data.action === "save") {
      if (!parsed.data.host) {
        return NextResponse.json({ error: "Enter a domain" }, { status: 400 });
      }
      const result = await setCustomHostname({
        uid,
        workspaceId,
        host: parsed.data.host,
      });
      return NextResponse.json(result);
    }
    if (parsed.data.action === "verify") {
      const result = await verifyCustomHostname({ uid, workspaceId });
      return NextResponse.json(result);
    }
    await clearCustomHostname({ uid, workspaceId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[api/settings/domain] failed", error);
    return NextResponse.json({ error: "Could not update domain" }, { status: 500 });
  }
}
