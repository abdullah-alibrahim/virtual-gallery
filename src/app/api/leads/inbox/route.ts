import { NextResponse } from "next/server";
import { z } from "zod";

import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import {
  listWorkspaceLeads,
  updateLeadStatus,
} from "@/infrastructure/leads/list-leads";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx?.account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const leads = await listWorkspaceLeads({
      workspaceId: ctx.account.defaultWorkspaceId,
      uid: ctx.session.uid,
    });

    const galleryIds = [...new Set(leads.map((l) => l.galleryId))];
    const titles = new Map<string, string>();
    if (galleryIds.length > 0) {
      const { getAdminDb } = await import("@/infrastructure/firebase/admin");
      await Promise.all(
        galleryIds.map(async (id) => {
          const snap = await getAdminDb().collection("galleries").doc(id).get();
          const title = snap.data()?.title;
          if (typeof title === "string" && title.trim()) {
            titles.set(id, title.trim());
          }
        }),
      );
    }

    return NextResponse.json({
      leads: leads.map((l) => ({
        ...l,
        galleryTitle: titles.get(l.galleryId) ?? null,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[api/leads] list failed", error);
    return NextResponse.json({ error: "Could not load inbox" }, { status: 500 });
  }
}

const patchSchema = z.object({
  galleryId: z.string().min(1),
  leadId: z.string().min(1),
  status: z.enum(["new", "read", "replied", "archived"]),
});

export async function PATCH(request: Request) {
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

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  try {
    await updateLeadStatus({
      ...parsed.data,
      uid: ctx.session.uid,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[api/leads] patch failed", error);
    return NextResponse.json({ error: "Could not update" }, { status: 500 });
  }
}
