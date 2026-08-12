import { NextResponse } from "next/server";
import { z } from "zod";

import type {
  GalleryArchitectureOverrides,
  GalleryEnvironmentOverrides,
  GalleryLightingOverrides,
  GalleryMaterialOverrides,
} from "@/core/entities";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/core/errors";
import { getTemplateById } from "@/core/templates";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { getSession } from "@/infrastructure/firebase/session";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { loadGalleryForEditor } from "@/infrastructure/galleries/load-gallery";
import { softDeleteGallery } from "@/infrastructure/galleries/soft-delete-gallery";
import { updateGalleryRoomOverrides } from "@/infrastructure/galleries/update-gallery-room-overrides";
import { updateGallerySettings } from "@/infrastructure/galleries/update-gallery-settings";

export const runtime = "nodejs";

const FLOOR_STYLES = ["plank", "parquet", "concrete", "stone"] as const;
const FLOOR_TEXTURE_IDS = [
  "none",
  "wood_plank",
  "wood_parquet",
  "wood_planks",
  "wood_deck",
  "concrete",
  "stone_tile",
  "ceramic_tile",
  "tile_pattern",
  "cobblestone",
] as const;
const WALL_TEXTURE_IDS = [
  "none",
  "plaster",
  "plaster_paint",
  "plaster_smooth",
  "concrete",
] as const;
const CEILING_TEXTURE_IDS = ["none", "plaster"] as const;

const materialOverridesSchema = z
  .object({
    wall: z.string().min(1).max(32).optional(),
    floor: z.string().min(1).max(32).optional(),
    ceiling: z.string().min(1).max(32).optional(),
    trim: z.string().min(1).max(32).optional(),
    wallRoughness: z.number().min(0).max(1).optional(),
    floorRoughness: z.number().min(0).max(1).optional(),
    floorMetalness: z.number().min(0).max(1).optional(),
    ceilingRoughness: z.number().min(0).max(1).optional(),
    floorStyle: z.enum(FLOOR_STYLES).optional(),
    floorTextureId: z.enum(FLOOR_TEXTURE_IDS).optional(),
    wallTextureId: z.enum(WALL_TEXTURE_IDS).optional(),
    ceilingTextureId: z.enum(CEILING_TEXTURE_IDS).optional(),
    wallBand: z.string().min(1).max(32).optional(),
    wallBandBottomM: z.number().min(0).max(8).optional(),
    wallBandTopM: z.number().min(0).max(8).optional(),
    wallBandEnabled: z.boolean().optional(),
  })
  .strict();

const lightingOverridesSchema = z
  .object({
    ambientIntensity: z.number().min(0).max(4).optional(),
    keyIntensity: z.number().min(0).max(6).optional(),
    fillIntensity: z.number().min(0).max(4).optional(),
    rimIntensity: z.number().min(0).max(4).optional(),
    trackIntensity: z.number().min(0).max(8).optional(),
    spotIntensity: z.number().min(0).max(8).optional(),
    temperatureK: z.number().min(2000).max(8000).optional(),
    warmCool: z.number().min(-1).max(1).optional(),
  })
  .strict();

const environmentOverridesSchema = z
  .object({
    exposure: z.number().min(0.2).max(3).optional(),
    background: z.string().min(1).max(32).optional(),
    skylightEnabled: z.boolean().optional(),
    windowEnabled: z.boolean().optional(),
  })
  .strict();

const architectureOverridesSchema = z
  .object({
    showBenches: z.boolean().optional(),
    showPlants: z.boolean().optional(),
    showSigns: z.boolean().optional(),
    showTracks: z.boolean().optional(),
    showPlinths: z.boolean().optional(),
    showBeams: z.boolean().optional(),
  })
  .strict();

const settingsPatchSchema = z
  .object({
    lightingPreset: z.string().min(1).max(64).optional(),
    walkSpeed: z.number().min(0.2).max(4).optional(),
    showTitles: z.boolean().optional(),
    allowZoom: z.boolean().optional(),
    eveningTour: z
      .object({
        enabled: z.boolean(),
        startAt: z.string().min(1),
        endAt: z.string().min(1),
        inviteCode: z.string().max(64).nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .strict();

const patchBodySchema = z.object({
  materialOverrides: materialOverridesSchema.nullable().optional(),
  lightingOverrides: lightingOverridesSchema.nullable().optional(),
  environmentOverrides: environmentOverridesSchema.nullable().optional(),
  architectureOverrides: architectureOverridesSchema.nullable().optional(),
  settings: settingsPatchSchema.optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ galleryId: string }> },
) {
  const ctx = await getAuthContext();
  if (!ctx?.account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { galleryId } = await context.params;

  try {
    const { gallery, artworks } = await loadGalleryForEditor({
      galleryId,
      uid: ctx.session.uid,
    });
    const template = getTemplateById(gallery.templateId);
    if (!template) {
      return NextResponse.json({ error: "Template missing" }, { status: 409 });
    }

    const assetsSnap = await getAdminDb()
      .collection("assets")
      .where("workspaceId", "==", gallery.workspaceId)
      .where("kind", "==", "image")
      .get();

    const assets = assetsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        workspaceId: String(data.workspaceId),
        status: data.status,
        fileName: String(data.meta?.fileName ?? "Untitled"),
        bytes: Number(data.original?.bytes ?? 0),
        mime: String(data.original?.mime ?? ""),
        width: data.original?.width ?? null,
        height: data.original?.height ?? null,
        thumbUrl: data.variants?.thumb_512 ?? null,
        blurhash: data.meta?.blurhash ?? null,
        dominantColor: data.meta?.dominantColor ?? null,
        textureFormat: data.meta?.textureFormat ?? null,
        error: data.error ?? null,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
      };
    });

    return NextResponse.json({
      gallery: {
        ...gallery,
        createdAt: gallery.createdAt.toISOString(),
        updatedAt: gallery.updatedAt.toISOString(),
        publishedAt: gallery.publishedAt?.toISOString() ?? null,
        deletedAt: gallery.deletedAt?.toISOString() ?? null,
      },
      template,
      artworks: artworks.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      assets,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[api/galleries/id] load failed", error);
    return NextResponse.json({ error: "Could not load gallery" }, { status: 500 });
  }
}

export async function PATCH(
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

  const parsed = patchBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid patch payload" }, { status: 400 });
  }

  const {
    materialOverrides,
    lightingOverrides,
    environmentOverrides,
    architectureOverrides,
    settings,
  } = parsed.data;

  if (
    materialOverrides === undefined &&
    lightingOverrides === undefined &&
    environmentOverrides === undefined &&
    architectureOverrides === undefined &&
    settings === undefined
  ) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const hasRoomOverrides =
      materialOverrides !== undefined ||
      lightingOverrides !== undefined ||
      environmentOverrides !== undefined ||
      architectureOverrides !== undefined;

    if (hasRoomOverrides) {
      await updateGalleryRoomOverrides({
        galleryId,
        uid: session.uid,
        ...(materialOverrides !== undefined
          ? {
              materialOverrides:
                materialOverrides as GalleryMaterialOverrides | null,
            }
          : {}),
        ...(lightingOverrides !== undefined
          ? {
              lightingOverrides:
                lightingOverrides as GalleryLightingOverrides | null,
            }
          : {}),
        ...(environmentOverrides !== undefined
          ? {
              environmentOverrides:
                environmentOverrides as GalleryEnvironmentOverrides | null,
            }
          : {}),
        ...(architectureOverrides !== undefined
          ? {
              architectureOverrides:
                architectureOverrides as GalleryArchitectureOverrides | null,
            }
          : {}),
      });
    }
    if (settings !== undefined) {
      await updateGallerySettings({
        galleryId,
        uid: session.uid,
        settings,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[api/galleries/id] patch failed", error);
    return NextResponse.json({ error: "Could not update gallery" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ galleryId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { galleryId } = await context.params;

  try {
    await softDeleteGallery({ galleryId, uid: session.uid });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[api/galleries/id] delete failed", error);
    return NextResponse.json({ error: "Could not delete gallery" }, { status: 500 });
  }
}
