/**
 * Creates an asset document in `uploading` state after plan-quota checks.
 */

import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";

import type { PlanId, WorkspaceUsage } from "@/core/entities";
import { ForbiddenError, PlanLimitError } from "@/core/errors";
import {
  assertCanUpload,
  extensionForMime,
  isAcceptedImageType,
  MAX_UPLOAD_BYTES,
  originalStoragePath,
} from "@/core/services";

import { getAdminDb } from "@/infrastructure/firebase/admin";
import { reconcileWorkspacePlan } from "@/infrastructure/billing/pro-trial";

export interface CreateAssetInput {
  readonly uid: string;
  readonly workspaceId: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly bytes: number;
}

export interface CreateAssetResult {
  readonly assetId: string;
  readonly path: string;
  readonly contentType: string;
}

export async function createAssetUpload(
  input: CreateAssetInput,
): Promise<CreateAssetResult> {
  if (!isAcceptedImageType(input.contentType)) {
    throw new ForbiddenError("upload: unsupported image type");
  }
  if (input.bytes <= 0 || input.bytes > MAX_UPLOAD_BYTES) {
    throw new ForbiddenError("upload: file exceeds size limit");
  }

  const db = getAdminDb();
  const workspaceRef = db.collection("workspaces").doc(input.workspaceId);
  const workspaceSnap = await workspaceRef.get();
  if (!workspaceSnap.exists) {
    throw new ForbiddenError("upload: workspace not found");
  }

  const data = workspaceSnap.data()!;
  const role =
    (
      await workspaceRef.collection("members").doc(input.uid).get()
    ).data()?.role ?? null;

  // Prefer custom claims in the session, but defend with membership doc.
  if (!role || !["owner", "admin", "editor"].includes(String(role))) {
    throw new ForbiddenError("upload: not an editor on this workspace");
  }

  const reconciled = await reconcileWorkspacePlan(input.workspaceId);
  const usage = (reconciled?.usage ?? data.usage) as WorkspaceUsage;
  const limits = reconciled?.limits ?? data.limits;
  try {
    assertCanUpload(usage, limits, input.bytes);
  } catch (error) {
    if (error instanceof PlanLimitError) throw error;
    throw error;
  }

  const assetId = randomUUID();
  const safeName = sanitizeFileName(input.fileName);
  const ext = extensionForMime(input.contentType);
  const fileName = safeName.endsWith(`.${ext}`)
    ? safeName
    : `${safeName}.${ext}`;
  const path = originalStoragePath(input.workspaceId, assetId, fileName);
  const now = FieldValue.serverTimestamp();

  const assetRef: DocumentReference = db.collection("assets").doc(assetId);
  await assetRef.set({
    workspaceId: input.workspaceId,
    kind: "image",
    status: "uploading",
    original: {
      path,
      bytes: input.bytes,
      mime: input.contentType,
      width: null,
      height: null,
    },
    variants: {
      ktx2_512: null,
      ktx2_1024: null,
      ktx2_2048: null,
      thumb_512: null,
      audio_m4a: null,
    },
    meta: {
      aspectRatio: null,
      dominantColor: null,
      blurhash: null,
      exif: null,
      fileName,
      textureFormat: null,
    },
    error: null,
    createdBy: input.uid,
    createdAt: now,
    updatedAt: now,
  });

  // Soft reservation of bytes so concurrent uploads cannot overshoot the plan.
  // Finalized on process; rolled back if the client abandons the upload.
  await workspaceRef.update({
    "usage.storageBytes": FieldValue.increment(input.bytes),
    updatedAt: now,
  });

  void (data.plan as PlanId);

  return { assetId, path, contentType: input.contentType };
}

function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "upload";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "upload";
}
