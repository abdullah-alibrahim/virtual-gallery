/**
 * Weekly visit digest for workspace owners with at least one published show.
 */

import { siteConfig } from "@/config/site";
import { sendWeeklyDigestEmail } from "@/infrastructure/email/send";
import { getAdminDb } from "@/infrastructure/firebase/admin";

function dayId(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function lastSevenDayIds(now = new Date()): string[] {
  const ids: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    ids.push(dayId(d));
  }
  return ids;
}

export async function sendWeeklyVisitDigests(): Promise<{ sent: number }> {
  const db = getAdminDb();
  const published = await db
    .collection("galleries")
    .where("status", "==", "published")
    .where("deletedAt", "==", null)
    .get();

  const byWorkspace = new Map<
    string,
    { galleryIds: string[]; leads: number }
  >();
  for (const doc of published.docs) {
    const workspaceId = String(doc.data().workspaceId ?? "");
    if (!workspaceId) continue;
    const row = byWorkspace.get(workspaceId) ?? { galleryIds: [], leads: 0 };
    row.galleryIds.push(doc.id);
    row.leads += Number(doc.data().counters?.leads ?? 0);
    byWorkspace.set(workspaceId, row);
  }

  const days = lastSevenDayIds();
  let sent = 0;

  for (const [workspaceId, row] of byWorkspace) {
    const workspace = await db.collection("workspaces").doc(workspaceId).get();
    const ownerId = String(workspace.data()?.ownerId ?? "");
    if (!ownerId) continue;

    const [memberSnap, userSnap] = await Promise.all([
      db
        .collection("workspaces")
        .doc(workspaceId)
        .collection("members")
        .doc(ownerId)
        .get(),
      db.collection("users").doc(ownerId).get(),
    ]);
    const to = String(memberSnap.data()?.email ?? userSnap.data()?.email ?? "");
    if (!to) continue;

    let views = 0;
    let uniqueVisitors = 0;
    for (const galleryId of row.galleryIds) {
      const snaps = await Promise.all(
        days.map((id) =>
          db
            .collection("galleries")
            .doc(galleryId)
            .collection("analytics")
            .doc(id)
            .get(),
        ),
      );
      for (const snap of snaps) {
        if (!snap.exists) continue;
        views += Number(snap.data()?.views ?? 0);
        uniqueVisitors += Number(snap.data()?.uniqueVisitors ?? 0);
      }
    }

    const artistName =
      String(
        memberSnap.data()?.displayName ?? userSnap.data()?.displayName ?? "",
      ) || "Artist";

    await sendWeeklyDigestEmail({
      to,
      artistName,
      analyticsUrl: `${siteConfig.url}/analytics`,
      views,
      uniqueVisitors,
      leads: row.leads,
      galleryCount: row.galleryIds.length,
    });
    sent += 1;
  }

  return { sent };
}
