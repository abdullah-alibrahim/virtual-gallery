/**
 * Client Firestore helpers for the asset library.
 */

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import type { Asset, AssetStatus } from "@/core/entities";

import { getFirestoreDb } from "./client";

export interface AssetListItem {
  readonly id: string;
  readonly workspaceId: string;
  readonly status: AssetStatus;
  readonly fileName: string;
  readonly bytes: number;
  readonly mime: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly thumbUrl: string | null;
  readonly blurhash: string | null;
  readonly dominantColor: string | null;
  readonly textureFormat: string | null;
  readonly error: string | null;
  readonly createdAt: Date | null;
}

export function subscribeWorkspaceAssets(
  workspaceId: string,
  onChange: (assets: readonly AssetListItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirestoreDb(), "assets"),
    where("workspaceId", "==", workspaceId),
    where("kind", "==", "image"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((doc) => mapAsset(doc.id, doc.data()));
      onChange(items);
    },
    (error) => onError?.(error),
  );
}

function mapAsset(
  id: string,
  data: Record<string, unknown>,
): AssetListItem {
  const original = (data.original ?? {}) as Record<string, unknown>;
  const variants = (data.variants ?? {}) as Record<string, unknown>;
  const meta = (data.meta ?? {}) as Record<string, unknown>;
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;

  return {
    id,
    workspaceId: String(data.workspaceId ?? ""),
    status: (data.status as Asset["status"]) ?? "uploading",
    fileName: String(meta.fileName ?? "Untitled"),
    bytes: Number(original.bytes ?? 0),
    mime: String(original.mime ?? ""),
    width: (original.width as number | null) ?? null,
    height: (original.height as number | null) ?? null,
    thumbUrl: (variants.thumb_512 as string | null) ?? null,
    blurhash: (meta.blurhash as string | null) ?? null,
    dominantColor: (meta.dominantColor as string | null) ?? null,
    textureFormat: (meta.textureFormat as string | null) ?? null,
    error: (data.error as string | null) ?? null,
    createdAt: createdAt?.toDate?.() ?? null,
  };
}
