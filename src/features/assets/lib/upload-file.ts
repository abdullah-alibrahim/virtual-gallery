/**
 * Orchestrates reserve → resumable upload → process for one file.
 */

import {
  isAcceptedImageType,
  MAX_UPLOAD_BYTES,
} from "@/core/services/asset-upload";
import {
  startResumableUpload,
  uploadTaskPromise,
} from "@/infrastructure/firebase/storage-client";

export async function uploadAndProcessFile(
  file: File,
  handlers: {
    onStatus: (
      status:
        | "reserving"
        | "uploading"
        | "processing"
        | "ready"
        | "failed",
    ) => void;
    onProgress: (ratio: number) => void;
    onAssetId?: (assetId: string) => void;
  },
): Promise<{ assetId: string }> {
  if (!isAcceptedImageType(file.type)) {
    throw new Error("Use JPEG, PNG, WebP, TIFF, or GIF.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File must be under 80 MB.");
  }

  handlers.onStatus("reserving");

  const reserve = await fetch("/api/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      bytes: file.size,
    }),
  });

  const reserveBody = (await reserve.json().catch(() => null)) as {
    error?: string;
    assetId?: string;
    path?: string;
    contentType?: string;
  } | null;

  if (!reserve.ok || !reserveBody?.assetId || !reserveBody.path) {
    throw new Error(reserveBody?.error ?? "Could not start upload");
  }

  handlers.onAssetId?.(reserveBody.assetId);
  handlers.onStatus("uploading");

  const task = startResumableUpload(
    reserveBody.path,
    file,
    reserveBody.contentType ?? file.type,
    { onProgress: handlers.onProgress },
  );
  await uploadTaskPromise(task);

  handlers.onStatus("processing");
  handlers.onProgress(1);

  const process = await fetch(`/api/assets/${reserveBody.assetId}/process`, {
    method: "POST",
  });
  const processBody = (await process.json().catch(() => null)) as {
    error?: string;
    status?: string;
  } | null;

  if (!process.ok) {
    throw new Error(processBody?.error ?? "Processing failed");
  }

  handlers.onStatus("ready");
  return { assetId: reserveBody.assetId };
}
