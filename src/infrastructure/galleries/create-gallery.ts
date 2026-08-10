/**
 * Creates a draft gallery for the signed-in artist's workspace.
 */

import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";

import {
  ConflictError,
  ForbiddenError,
  PlanLimitError,
  ValidationError,
} from "@/core/errors";
import { assertCanCreateGallery, canUseTemplateTier } from "@/core/services/enforce-plan-limits";
import { getTemplateById } from "@/core/templates";
import {
  isReservedSlug,
  isValidSlug,
  slugify,
  toSlug,
} from "@/core/value-objects/slug";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export interface CreateGalleryInput {
  readonly uid: string;
  readonly workspaceId: string;
  readonly title: string;
  readonly templateId: string;
}

export async function createGalleryDocument(input: CreateGalleryInput) {
  const template = getTemplateById(input.templateId);
  if (!template || template.status === "deprecated") {
    throw new ValidationError("Unknown or unavailable template");
  }

  const db = getAdminDb();
  const workspaceRef = db.collection("workspaces").doc(input.workspaceId);
  const workspaceSnap = await workspaceRef.get();
  if (!workspaceSnap.exists) {
    throw new ForbiddenError("workspace not found");
  }

  const member = await workspaceRef.collection("members").doc(input.uid).get();
  if (!member.exists) {
    throw new ForbiddenError("not a workspace member");
  }

  const data = workspaceSnap.data()!;
  const plan = (data.plan ?? "free") as "free" | "pro" | "studio";
  if (!canUseTemplateTier(plan, template.tier)) {
    throw new ForbiddenError("This template requires a Pro plan");
  }

  try {
    assertCanCreateGallery(data.usage, data.limits);
  } catch (error) {
    if (error instanceof PlanLimitError) throw error;
    throw error;
  }

  const galleryId = randomUUID();
  let base =
    slugify(input.title) ??
    `gallery-${galleryId.slice(0, 8).toLowerCase()}`;
  if (!isValidSlug(base) || isReservedSlug(base)) {
    base = `show-${galleryId.slice(0, 8).toLowerCase()}`;
  }

  let slug = base;
  for (let i = 0; i < 40; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    if (!isValidSlug(candidate) || isReservedSlug(candidate)) continue;
    const taken = await db.collection("slugs").doc(candidate).get();
    if (!taken.exists) {
      slug = candidate;
      break;
    }
  }

  if (!isValidSlug(slug)) {
    throw new ConflictError("Could not reserve a gallery URL");
  }

  const branded = toSlug(slug);
  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    tx.set(db.collection("galleries").doc(galleryId), {
      workspaceId: input.workspaceId,
      ownerId: input.uid,
      title: input.title.trim() || template.name,
      description: "",
      templateId: template.id,
      templateVersion: template.version,
      slug: branded,
      status: "draft",
      visibility: "public",
      publishedVersion: null,
      publishedAt: null,
      manifestPath: null,
      hasUnpublishedChanges: true,
      cover: null,
      seo: { title: null, description: null, ogPath: null },
      settings: {
        walkSpeed: 1.5,
        showTitles: true,
        allowZoom: true,
        allowDownload: false,
        ambientAudioAssetId: null,
        lightingPreset: template.lighting.presets[0]?.id ?? "soft",
      },
      materialOverrides: null,
      lightingOverrides: null,
      environmentOverrides: null,
      architectureOverrides: null,
      counters: {
        views: 0,
        uniqueVisitors: 0,
        artworkClicks: 0,
        leads: 0,
        hearts: 0,
        guestbookVisits: 0,
      },
      artworkCount: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    tx.set(db.collection("slugs").doc(branded), {
      type: "gallery",
      targetId: galleryId,
      workspaceId: input.workspaceId,
      createdAt: now,
    });

    tx.update(workspaceRef, {
      "usage.galleries": FieldValue.increment(1),
      updatedAt: now,
    });
  });

  return { galleryId, slug: branded, templateId: template.id };
}
