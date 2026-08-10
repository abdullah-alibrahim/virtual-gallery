"use client";

import { create } from "zustand";

export type UploadItemStatus =
  | "queued"
  | "reserving"
  | "uploading"
  | "processing"
  | "ready"
  | "failed";

export interface UploadItem {
  readonly id: string;
  readonly fileName: string;
  readonly bytes: number;
  readonly contentType: string;
  status: UploadItemStatus;
  progress: number;
  assetId: string | null;
  error: string | null;
}

interface UploadQueueState {
  items: UploadItem[];
  addFiles: (files: File[]) => string[];
  patch: (id: string, patch: Partial<UploadItem>) => void;
  remove: (id: string) => void;
  clearFinished: () => void;
}

export const useUploadQueue = create<UploadQueueState>((set) => ({
  items: [],

  addFiles: (files) => {
    const ids: string[] = [];
    const next = files.map((file) => {
      const id = crypto.randomUUID();
      ids.push(id);
      return {
        id,
        fileName: file.name,
        bytes: file.size,
        contentType: file.type || "application/octet-stream",
        status: "queued" as const,
        progress: 0,
        assetId: null,
        error: null,
      };
    });
    set((state) => ({ items: [...next, ...state.items] }));
    return ids;
  },

  patch: (id, patch) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    })),

  remove: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  clearFinished: () =>
    set((state) => ({
      items: state.items.filter(
        (item) => item.status !== "ready" && item.status !== "failed",
      ),
    })),
}));
