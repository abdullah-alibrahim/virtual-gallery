import type { GalleryStatus } from "@/core/entities";
import type { MessageKey } from "@/i18n/translate";

/**
 * Maps a gallery status to the badge variant and i18n key used everywhere a
 * gallery appears — dashboard cards, editor toolbar, publish dialog.
 *
 * Lives in `lib` (not components) so server components and hooks can import it
 * without pulling in the UI primitive layer. Variant names match `badgeVariants`.
 */
export function galleryStatusPresentation(status: GalleryStatus): {
  readonly variant: "neutral" | "success" | "warning" | "outline";
  readonly labelKey: MessageKey;
  /** English fallback for tests / non-UI callers. */
  readonly label: string;
} {
  switch (status) {
    case "draft":
      return {
        variant: "neutral",
        labelKey: "dashboard.draft",
        label: "Draft",
      };
    case "published":
      return {
        variant: "success",
        labelKey: "dashboard.published",
        label: "Published",
      };
    case "unpublished":
      return {
        variant: "warning",
        labelKey: "dashboard.unpublished",
        label: "Unpublished",
      };
    case "archived":
      return {
        variant: "outline",
        labelKey: "dashboard.archived",
        label: "Archived",
      };
  }
}
