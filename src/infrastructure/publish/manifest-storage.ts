/**
 * Writes published manifests and the live pointer to Firebase Storage.
 */

import { getDownloadURL, getStorage } from "firebase-admin/storage";

import type { SceneManifest } from "@/core/entities";
import {
  latestPointerPath,
  manifestPath,
  type LatestPointer,
} from "@/core/services/compile-scene-manifest";
import { getAdminApp } from "@/infrastructure/firebase/admin";

const MANIFEST_CACHE = "public, max-age=31536000, immutable";
const POINTER_CACHE = "public, max-age=60";

export async function writePublishedManifest(input: {
  slug: string;
  version: number;
  manifest: SceneManifest;
}): Promise<{ storagePath: string; publicUrl: string }> {
  const bucket = getStorage(getAdminApp()).bucket();
  const storagePath = manifestPath(input.slug, input.version);
  const body = Buffer.from(JSON.stringify(input.manifest), "utf8");

  await bucket.file(storagePath).save(body, {
    contentType: "application/json",
    resumable: false,
    metadata: { cacheControl: MANIFEST_CACHE },
  });

  const publicUrl = await getDownloadURL(bucket.file(storagePath));
  return { storagePath, publicUrl };
}

export async function writeLatestPointer(
  pointer: LatestPointer,
): Promise<{ storagePath: string; publicUrl: string }> {
  const bucket = getStorage(getAdminApp()).bucket();
  const storagePath = latestPointerPath(pointer.slug);
  const body = Buffer.from(JSON.stringify(pointer), "utf8");

  await bucket.file(storagePath).save(body, {
    contentType: "application/json",
    resumable: false,
    metadata: { cacheControl: POINTER_CACHE },
  });

  const publicUrl = await getDownloadURL(bucket.file(storagePath));
  return { storagePath, publicUrl };
}

export async function deleteLatestPointer(slug: string): Promise<void> {
  const bucket = getStorage(getAdminApp()).bucket();
  const file = bucket.file(latestPointerPath(slug));
  const [exists] = await file.exists();
  if (exists) await file.delete({ ignoreNotFound: true });
}

export async function readLatestPointer(
  slug: string,
): Promise<LatestPointer | null> {
  const bucket = getStorage(getAdminApp()).bucket();
  const file = bucket.file(latestPointerPath(slug));
  const [exists] = await file.exists();
  if (!exists) return null;
  const [buf] = await file.download();
  return JSON.parse(buf.toString("utf8")) as LatestPointer;
}

export async function readManifestAtPath(
  storagePath: string,
): Promise<SceneManifest | null> {
  const bucket = getStorage(getAdminApp()).bucket();
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();
  if (!exists) return null;
  const [buf] = await file.download();
  return JSON.parse(buf.toString("utf8")) as SceneManifest;
}
