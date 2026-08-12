/**
 * Persists gallery-level settings patches (e.g. lightingPreset).
 */

import { FieldValue } from "firebase-admin/firestore";

import type { GallerySettings } from "@/core/entities";
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export async function updateGallerySettings(input: {
  galleryId: string;
  uid: string;
  settings: Partial<
    Pick<
      GallerySettings,
      | "lightingPreset"
      | "walkSpeed"
      | "showTitles"
      | "allowZoom"
      | "eveningTour"
    >
  >;
}): Promise<void> {
  const db = getAdminDb();
  const galleryRef = db.collection("galleries").doc(input.galleryId);
  const snap = await galleryRef.get();
  if (!snap.exists || snap.data()?.deletedAt) {
    throw new NotFoundError("Gallery", input.galleryId);
  }

  const workspaceId = String(snap.data()!.workspaceId);
  const member = await db
    .collection("workspaces")
    .doc(workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();
  if (!member.exists) {
    throw new ForbiddenError("not a workspace member");
  }

  const patch: Record<string, unknown> = {
    hasUnpublishedChanges: true,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.settings.lightingPreset !== undefined) {
    const id = input.settings.lightingPreset.trim();
    if (!id || id.length > 64) {
      throw new ValidationError("Invalid lighting preset");
    }
    patch["settings.lightingPreset"] = id;
  }
  if (input.settings.walkSpeed !== undefined) {
    const speed = input.settings.walkSpeed;
    if (!Number.isFinite(speed) || speed < 0.2 || speed > 4) {
      throw new ValidationError("Invalid walk speed");
    }
    patch["settings.walkSpeed"] = speed;
  }
  if (input.settings.showTitles !== undefined) {
    patch["settings.showTitles"] = Boolean(input.settings.showTitles);
  }
  if (input.settings.allowZoom !== undefined) {
    patch["settings.allowZoom"] = Boolean(input.settings.allowZoom);
  }
  if (input.settings.eveningTour !== undefined) {
    const tour = input.settings.eveningTour;
    if (tour === null) {
      patch["settings.eveningTour"] = null;
    } else {
      const startMs = Date.parse(tour.startAt);
      const endMs = Date.parse(tour.endAt);
      if (
        !tour.enabled &&
        (!Number.isFinite(startMs) || !Number.isFinite(endMs))
      ) {
        patch["settings.eveningTour"] = {
          enabled: false,
          startAt: tour.startAt || new Date().toISOString(),
          endAt: tour.endAt || new Date().toISOString(),
          inviteCode: tour.inviteCode ?? null,
        };
      } else if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        throw new ValidationError("Invalid evening tour window");
      } else {
        const code = tour.inviteCode?.trim() || null;
        if (code && code.length > 64) {
          throw new ValidationError("Invite code too long");
        }
        patch["settings.eveningTour"] = {
          enabled: Boolean(tour.enabled),
          startAt: new Date(startMs).toISOString(),
          endAt: new Date(endMs).toISOString(),
          inviteCode: code,
        };
      }
    }
  }

  if (Object.keys(patch).length <= 2) {
    throw new ValidationError("Nothing to update");
  }

  await galleryRef.update(patch);
}
