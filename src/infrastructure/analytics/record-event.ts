/**
 * Analytics ingest — sharded daily docs under galleries/{id}/analytics/{day}.
 */

import { FieldValue } from "firebase-admin/firestore";

import { NotFoundError, ValidationError } from "@/core/errors";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export type AnalyticsEvent =
  | { type: "view"; galleryId: string; visitorId: string }
  | {
      type: "artwork_click";
      galleryId: string;
      artworkId: string;
      visitorId: string;
    }
  | { type: "heart"; galleryId: string; visitorId: string }
  | { type: "visit"; galleryId: string; visitorId: string };

function dayId(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function recordAnalyticsEvent(
  event: AnalyticsEvent,
): Promise<void> {
  if (!event.galleryId || !event.visitorId) {
    throw new ValidationError("Missing gallery or visitor");
  }
  if (event.visitorId.length > 80) {
    throw new ValidationError("Invalid visitor id");
  }

  const db = getAdminDb();
  const galleryRef = db.collection("galleries").doc(event.galleryId);
  const snap = await galleryRef.get();
  if (!snap.exists || snap.data()?.deletedAt) {
    throw new NotFoundError("Gallery", event.galleryId);
  }
  if (snap.data()?.status !== "published") {
    // Silent no-op for draft previews — don't inflate counters.
    return;
  }

  const day = dayId();
  const analyticsRef = galleryRef.collection("analytics").doc(day);
  const visitorRef = analyticsRef.collection("visitors").doc(event.visitorId);
  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const visitorSnap = await tx.get(visitorRef);
    const isNewVisitor = !visitorSnap.exists;

    if (event.type === "view") {
      tx.set(
        analyticsRef,
        {
          galleryId: event.galleryId,
          date: day,
          views: FieldValue.increment(1),
          uniqueVisitors: FieldValue.increment(isNewVisitor ? 1 : 0),
          artworkClicks: FieldValue.increment(0),
          hearts: FieldValue.increment(0),
          guestbookVisits: FieldValue.increment(0),
          updatedAt: now,
        },
        { merge: true },
      );
      tx.set(
        visitorRef,
        { lastSeenAt: now, views: FieldValue.increment(1) },
        { merge: true },
      );
      tx.update(galleryRef, {
        "counters.views": FieldValue.increment(1),
        "counters.uniqueVisitors": FieldValue.increment(isNewVisitor ? 1 : 0),
        updatedAt: now,
      });
      return;
    }

    if (event.type === "heart" || event.type === "visit") {
      const visitorData = visitorSnap.data() ?? {};
      const already =
        event.type === "heart"
          ? Boolean(visitorData.hearted)
          : Boolean(visitorData.guestbookVisit);
      if (already) return;

      const heartInc = event.type === "heart" ? 1 : 0;
      const visitInc = event.type === "visit" ? 1 : 0;
      tx.set(
        analyticsRef,
        {
          galleryId: event.galleryId,
          date: day,
          views: FieldValue.increment(0),
          uniqueVisitors: FieldValue.increment(0),
          artworkClicks: FieldValue.increment(0),
          hearts: FieldValue.increment(heartInc),
          guestbookVisits: FieldValue.increment(visitInc),
          updatedAt: now,
        },
        { merge: true },
      );
      tx.set(
        visitorRef,
        {
          lastSeenAt: now,
          ...(event.type === "heart" ? { hearted: true } : { guestbookVisit: true }),
        },
        { merge: true },
      );
      if (event.type === "heart") {
        tx.update(galleryRef, {
          "counters.hearts": FieldValue.increment(1),
          updatedAt: now,
        });
      } else {
        tx.update(galleryRef, {
          "counters.guestbookVisits": FieldValue.increment(1),
          updatedAt: now,
        });
      }
      return;
    }

    tx.set(
      analyticsRef,
      {
        galleryId: event.galleryId,
        date: day,
        views: FieldValue.increment(0),
        uniqueVisitors: FieldValue.increment(0),
        artworkClicks: FieldValue.increment(1),
        updatedAt: now,
      },
      { merge: true },
    );
    tx.set(
      visitorRef,
      { lastSeenAt: now, clicks: FieldValue.increment(1) },
      { merge: true },
    );
    tx.update(galleryRef, {
      "counters.artworkClicks": FieldValue.increment(1),
      updatedAt: now,
    });
  });
}

export interface GalleryAnalyticsSummary {
  readonly galleryId: string;
  readonly title: string;
  readonly views: number;
  readonly uniqueVisitors: number;
  readonly artworkClicks: number;
  readonly leads: number;
  readonly days: readonly {
    readonly date: string;
    readonly views: number;
    readonly uniqueVisitors: number;
    readonly artworkClicks: number;
  }[];
}

export async function loadWorkspaceAnalytics(input: {
  workspaceId: string;
  uid: string;
}): Promise<GalleryAnalyticsSummary[]> {
  const db = getAdminDb();
  const member = await db
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("members")
    .doc(input.uid)
    .get();
  if (!member.exists) return [];

  const galleries = await db
    .collection("galleries")
    .where("workspaceId", "==", input.workspaceId)
    .where("deletedAt", "==", null)
    .get();

  const summaries: GalleryAnalyticsSummary[] = [];

  for (const doc of galleries.docs) {
    const data = doc.data();
    const daysSnap = await doc.ref
      .collection("analytics")
      .orderBy("date", "desc")
      .limit(30)
      .get();

    summaries.push({
      galleryId: doc.id,
      title: String(data.title ?? "Untitled"),
      views: Number(data.counters?.views ?? 0),
      uniqueVisitors: Number(data.counters?.uniqueVisitors ?? 0),
      artworkClicks: Number(data.counters?.artworkClicks ?? 0),
      leads: Number(data.counters?.leads ?? 0),
      days: daysSnap.docs.map((d) => {
        const row = d.data();
        return {
          date: String(row.date ?? d.id),
          views: Number(row.views ?? 0),
          uniqueVisitors: Number(row.uniqueVisitors ?? 0),
          artworkClicks: Number(row.artworkClicks ?? 0),
        };
      }),
    });
  }

  return summaries.sort((a, b) => b.views - a.views);
}
