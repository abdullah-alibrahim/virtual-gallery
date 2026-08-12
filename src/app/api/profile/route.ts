import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/errors";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { updateArtistProfile } from "@/infrastructure/profiles/update-profile";

export const runtime = "nodejs";

const optionalUrl = z
  .string()
  .trim()
  .max(200)
  .refine(
    (v) => v === "" || /^https?:\/\/.+/i.test(v),
    "Must be an http(s) URL",
  )
  .optional();

const optionalHandle = z
  .string()
  .trim()
  .max(80)
  .refine(
    (v) =>
      v === "" ||
      /^https?:\/\/.+/i.test(v) ||
      /^@?[A-Za-z0-9._-]{1,80}$/.test(v),
    "Must be a handle or URL",
  )
  .optional();

const bodySchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().max(500),
  statement: z.string().max(4000),
  location: z.string().max(120).nullable(),
  avatarUrl: z.string().trim().max(500).nullable().optional(),
  coverUrl: z.string().trim().max(500).nullable().optional(),
  socials: z.object({
    website: optionalUrl,
    facebook: optionalUrl,
    instagram: optionalHandle,
    twitter: optionalHandle,
    linkedin: optionalUrl,
    behance: optionalUrl,
  }),
  contact: z.object({
    allowInquiries: z.boolean(),
    showEmail: z.boolean(),
  }),
});

export async function PUT(request: Request) {
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
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  }

  const socials = parsed.data.socials;
  const cleaned = {
    ...(socials.website?.trim() ? { website: socials.website.trim() } : {}),
    ...(socials.facebook?.trim() ? { facebook: socials.facebook.trim() } : {}),
    ...(socials.instagram?.trim()
      ? { instagram: socials.instagram.trim().replace(/^@/, "") }
      : {}),
    ...(socials.twitter?.trim()
      ? { twitter: socials.twitter.trim().replace(/^@/, "") }
      : {}),
    ...(socials.linkedin?.trim() ? { linkedin: socials.linkedin.trim() } : {}),
    ...(socials.behance?.trim() ? { behance: socials.behance.trim() } : {}),
  };

  try {
    await updateArtistProfile({
      uid: ctx.session.uid,
      workspaceId: ctx.account.defaultWorkspaceId,
      displayName: parsed.data.displayName,
      bio: parsed.data.bio,
      statement: parsed.data.statement,
      location: parsed.data.location,
      avatarUrl: parsed.data.avatarUrl,
      coverUrl: parsed.data.coverUrl,
      socials: cleaned,
      contact: parsed.data.contact,
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
    console.error("[api/profile] update failed", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}
