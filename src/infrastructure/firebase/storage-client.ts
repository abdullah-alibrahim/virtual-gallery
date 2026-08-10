/**
 * Client Storage helpers for resumable original uploads.
 */

import {
  uploadBytesResumable,
  type UploadTask,
} from "firebase/storage";

import { getFirebaseStorage } from "./client";
import { ref } from "firebase/storage";

export interface ResumableUploadHandlers {
  readonly onProgress?: (ratio: number) => void;
}

export function startResumableUpload(
  path: string,
  file: File,
  contentType: string,
  handlers: ResumableUploadHandlers = {},
): UploadTask {
  const storageRef = ref(getFirebaseStorage(), path);
  const task = uploadBytesResumable(storageRef, file, {
    contentType,
    cacheControl: "private, max-age=0",
  });

  if (handlers.onProgress) {
    task.on("state_changed", (snapshot) => {
      if (snapshot.totalBytes <= 0) return;
      handlers.onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes);
    });
  }

  return task;
}

export function uploadTaskPromise(task: UploadTask): Promise<void> {
  return new Promise((resolve, reject) => {
    task.then(() => resolve()).catch(reject);
  });
}
