"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True once the component has mounted on the client.
 *
 * Use only for values that genuinely differ between server and client (the
 * resolved theme, `matchMedia`, WebGL capability). Reaching for this to hide
 * hydration warnings usually means the data belongs on the server instead.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
