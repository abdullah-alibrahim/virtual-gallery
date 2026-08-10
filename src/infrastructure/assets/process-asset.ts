/**
 * Runs the image pipeline for an uploaded original and stamps public variants.
 */

import { FieldValue } from "firebase-admin/firestore";
import { getDownloadURL, getStorage } from "firebase-admin/storage";

import { ForbiddenError, NotFoundError } from "@/core/errors";
import { variantStoragePath } from "@/core/services";
import { getAdminApp, getAdminDb } from "@/infrastructure/firebase/admin";

import { processImage } from "./process-image";

export async function processAsset(input: {
  readonly assetId: string;
  readonly uid: string;
}): Promise<{ readonly status: "ready" | "failed"; readonly error?: string }> {
  const db = getAdminDb();
  const assetRef = db.collection("assets").doc(input.assetId);
  const snap = await assetRef.get();
  if (!snap.exists) throw new NotFoundError("Asset", input.assetId);

  const asset = snap.data()!;
  const workspaceId = String(asset.workspaceId);
  const member = await db
    .collection("workspaces")
    .doc(workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();

  if (!member.exists) {
    throw new ForbiddenError("process: not a workspace member");
  }

  if (asset.status === "ready") {
    return { status: "ready" };
  }

  const jobRef = db.collection("jobs").doc();
  const now = FieldValue.serverTimestamp();

  await Promise.all([
    assetRef.update({
      status: "processing",
      error: null,
      updatedAt: now,
    }),
    jobRef.set({
      type: "asset-process",
      assetId: input.assetId,
      workspaceId,
      ownerId: input.uid,
      status: "running",
      progress: 0,
      createdAt: now,
      updatedAt: now,
    }),
  ]);

  try {
    const bucket = getStorage(getAdminApp()).bucket();
    const originalPath = String(asset.original.path);
    const [buffer] = await bucket.file(originalPath).download();

    await jobRef.update({
      progress: 20,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const result = await processImage(buffer);

    await jobRef.update({
      progress: 60,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const thumbPath = variantStoragePath(
      workspaceId,
      input.assetId,
      "thumb_512.webp",
    );
    await bucket.file(thumbPath).save(result.thumb512, {
      contentType: "image/webp",
      resumable: false,
      metadata: { cacheControl: "public, max-age=31536000, immutable" },
    });
    const thumbUrl = await getDownloadURL(bucket.file(thumbPath));

    const lodUrls: Record<string, string> = {};
    for (const lod of result.lods) {
      const fileName = `lod_${lod.size}.${lod.extension}`;
      const path = variantStoragePath(workspaceId, input.assetId, fileName);
      await bucket.file(path).save(lod.buffer, {
        contentType: lod.contentType,
        resumable: false,
        metadata: { cacheControl: "public, max-age=31536000, immutable" },
      });
      lodUrls[`ktx2_${lod.size}`] = await getDownloadURL(bucket.file(path));
    }

    await assetRef.update({
      status: "ready",
      error: null,
      "original.width": result.width,
      "original.height": result.height,
      variants: {
        ktx2_512: lodUrls.ktx2_512 ?? null,
        ktx2_1024: lodUrls.ktx2_1024 ?? null,
        ktx2_2048: lodUrls.ktx2_2048 ?? null,
        thumb_512: thumbUrl,
        audio_m4a: null,
      },
      meta: {
        aspectRatio: result.aspectRatio,
        dominantColor: result.dominantColor,
        blurhash: result.blurhash,
        exif: result.exif,
        fileName: asset.meta?.fileName ?? null,
        textureFormat: result.textureFormat,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    await jobRef.update({
      status: "succeeded",
      progress: 100,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { status: "ready" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image processing failed";

    const bytes = Number(asset.original?.bytes ?? 0);
    if (bytes > 0) {
      await db
        .collection("workspaces")
        .doc(workspaceId)
        .update({
          "usage.storageBytes": FieldValue.increment(-bytes),
          updatedAt: FieldValue.serverTimestamp(),
        });
    }

    await assetRef.update({
      status: "failed",
      error: message,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await jobRef.update({
      status: "failed",
      error: message,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { status: "failed", error: message };
  }
}
