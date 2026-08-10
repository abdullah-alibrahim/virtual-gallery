import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Cross-feature UI state.
 *
 * Only genuinely global, non-server concerns belong here. Editor scene state
 * lives in the editor feature's own store; server data lives in React Query.
 *
 * Panel sizes persist to localStorage because an artist who widened the
 * inspector expects it to stay wide tomorrow.
 */
interface UiState {
  sidebarCollapsed: boolean;
  editorPanels: {
    hierarchyWidth: number;
    inspectorWidth: number;
    assetsHeight: number;
    assetsCollapsed: boolean;
  };
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setEditorPanel: <K extends keyof UiState["editorPanels"]>(
    key: K,
    value: UiState["editorPanels"][K],
  ) => void;
  resetEditorPanels: () => void;
}

const DEFAULT_PANELS: UiState["editorPanels"] = {
  hierarchyWidth: 180,
  inspectorWidth: 300,
  assetsHeight: 120,
  assetsCollapsed: false,
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      editorPanels: DEFAULT_PANELS,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      setEditorPanel: (key, value) =>
        set((state) => ({
          editorPanels: { ...state.editorPanels, [key]: value },
        })),

      resetEditorPanels: () => set({ editorPanels: DEFAULT_PANELS }),
    }),
    {
      name: "vg-ui",
      version: 1,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        editorPanels: state.editorPanels,
      }),
    },
  ),
);
