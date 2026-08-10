/**
 * Maps Firestore asset documents into domain `Asset` entities for publish.
 */

import type { DocumentData } from "firebase-admin/firestore";

import type { Asset } from "@/core/entities";

export function mapAssetDocument(id: string, data: DocumentData): Asset {
  const variants = data.variants ?? {};
  const original = data.original ?? {};
  const meta = data.meta ?? {};

  return {
    id,
    workspaceId: String(data.workspaceId),
    kind: data.kind ?? "image",
    status: data.status ?? "uploading",
    original: {
      path: String(original.path ?? ""),
      bytes: Number(original.bytes ?? 0),
      mime: String(original.mime ?? ""),
      width: original.width ?? null,
      height: original.height ?? null,
    },
    variants: {
      ktx2_512: variants.ktx2_512 ?? null,
      ktx2_1024: variants.ktx2_1024 ?? null,
      ktx2_2048: variants.ktx2_2048 ?? null,
      thumb_512: variants.thumb_512 ?? null,
      audio_m4a: variants.audio_m4a ?? null,
    },
    meta: {
      aspectRatio: meta.aspectRatio ?? null,
      dominantColor: meta.dominantColor ?? null,
      blurhash: meta.blurhash ?? null,
      exif: meta.exif ?? null,
    },
    error: data.error ?? null,
    createdAt: data.createdAt?.toDate?.() ?? new Date(0),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(0),
  };
}
