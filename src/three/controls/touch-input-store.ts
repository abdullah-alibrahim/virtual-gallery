"use client";

import { create } from "zustand";

/**
 * Bridges HTML twin-stick / touch UI into the R3F walk loop.
 * Lives under `three` so the renderer stays free of feature imports.
 */
interface TouchInputState {
  moveX: number;
  moveZ: number;
  lookX: number;
  lookY: number;
  setMove: (x: number, z: number) => void;
  addLook: (dx: number, dy: number) => void;
  consumeLook: () => { dx: number; dy: number };
  reset: () => void;
}

export const useTouchInputStore = create<TouchInputState>((set, get) => ({
  moveX: 0,
  moveZ: 0,
  lookX: 0,
  lookY: 0,
  setMove: (moveX, moveZ) => set({ moveX, moveZ }),
  addLook: (dx, dy) =>
    set((s) => ({ lookX: s.lookX + dx, lookY: s.lookY + dy })),
  consumeLook: () => {
    const { lookX, lookY } = get();
    set({ lookX: 0, lookY: 0 });
    return { dx: lookX, dy: lookY };
  },
  reset: () => set({ moveX: 0, moveZ: 0, lookX: 0, lookY: 0 }),
}));
