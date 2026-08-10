import { NextResponse } from "next/server";
import { z } from "zod";

import { ForbiddenError, NotFoundError, PlanLimitError } from "@/core/errors";
import { getSession } from "@/infrastructure/firebase/session";
import { saveGalleryArtworks } from "@/infrastructure/galleries/save-artworks";

export const runtime = "nodejs";

const artworkSchema = z.object({
  id: z.string(),
  galleryId: z.string(),
  workspaceId: z.string(),
  assetId: z.string(),
  order: z.number(),
  title: z.string(),
  description: z.string(),
  year: z.number().nullable(),
  medium: z.string().nullable(),
  category: z.string().nullable(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number().optional(),
    unit: z.enum(["cm", "in"]),
  }),
  price: z
    .object({ amount: z.string(), currency: z.string() })
    .nullable(),
  availability: z.string(),
  frame: z.object({
    style: z.string(),
    color: z.string(),
    widthCm: z.number(),
    matteCm: z.number(),
    matteColor: z.string(),
  }),
  placement: z.object({
    wallId: z.string(),
    anchorIndex: z.number().nullable(),
    position: z.tuple([z.number(), z.number(), z.number()]),
    rotation: z.tuple([z.number(), z.number(), z.number()]),
    scale: z.number(),
    autoPlaced: z.boolean(),
  }),
  lighting: z.object({
    enabled: z.boolean(),
    intensity: z.number(),
    angle: z.number(),
    temperatureK: z.number(),
  }),
  media: z.object({
    audioAssetId: z.string().nullable(),
    videoUrl: z.string().nullable(),
    hotspot: z.object({
      enabled: z.boolean(),
      offset: z.tuple([z.number(), z.number(), z.number()]),
    }),
  }),
  commerce: z.object({
    externalUrl: z.string().nullable(),
    allowInquiries: z.boolean(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const bodySchema = z.object({
  artworks: z.array(artworkSchema),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ galleryId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { galleryId } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid artworks payload" }, { status: 400 });
  }

  try {
    await saveGalleryArtworks({
      galleryId,
      uid: session.uid,
      artworks: parsed.data.artworks.map((a) => ({
        ...a,
        availability: a.availability as never,
        frame: a.frame as never,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      })),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof PlanLimitError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          limit: error.limit,
          current: error.current,
          max: error.max,
        },
        { status: 402 },
      );
    }
    console.error("[api/galleries/artworks] save failed", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}
