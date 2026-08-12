/**
 * Lists ready image thumbs as cover candidates for the profile picker.
 */

import type { CoverCandidate } from "@/core/services/artwork-ai-assist";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export async function listWorkspaceCoverCandidates(
  workspaceId: string,
  limit = 24,
): Promise<CoverCandidate[]> {
  const snap = await getAdminDb()
    .collection("assets")
    .where("workspaceId", "==", workspaceId)
    .where("kind", "==", "image")
    .where("status", "==", "ready")
    .limit(limit)
    .get();

  const out: CoverCandidate[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const original = (data.original ?? {}) as Record<string, unknown>;
    const variants = (data.variants ?? {}) as Record<string, unknown>;
    const meta = (data.meta ?? {}) as Record<string, unknown>;
    const url =
      (variants.thumb_512 as string | null) ??
      (variants.ktx2_1024 as string | null) ??
      null;
    if (!url) continue;
    out.push({
      id: doc.id,
      url,
      width: (original.width as number | null) ?? null,
      height: (original.height as number | null) ?? null,
      label: String(meta.fileName ?? "Work"),
    });
  }
  return out;
}
