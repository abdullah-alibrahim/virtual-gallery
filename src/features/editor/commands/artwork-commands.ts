import type {
  Artwork,
  ArtworkLighting,
  ArtworkPlacement,
  Availability,
} from "@/core/entities";
import type { Dimensions } from "@/core/value-objects/dimensions";
import type { FrameSpec } from "@/core/value-objects/frame-spec";
import type { Money } from "@/core/value-objects/money";

import type { EditorCommand } from "./stack";

export type ArtworkPatch = {
  title?: string;
  description?: string;
  year?: number | null;
  medium?: string | null;
  category?: string | null;
  dimensions?: Dimensions;
  price?: Money | null;
  availability?: Availability;
  frame?: FrameSpec;
  placement?: ArtworkPlacement;
  lighting?: ArtworkLighting;
  media?: Artwork["media"];
  commerce?: Artwork["commerce"];
  order?: number;
};

export function createUpdateArtworkCommand(input: {
  artworkId: string;
  before: ArtworkPatch;
  after: ArtworkPatch;
  apply: (artworkId: string, patch: ArtworkPatch) => void;
  label?: string;
}): EditorCommand {
  return {
    name: "UpdateArtwork",
    label: input.label ?? "Edit artwork",
    do: () => input.apply(input.artworkId, input.after),
    undo: () => input.apply(input.artworkId, input.before),
  };
}

export function createAddArtworkCommand(input: {
  artwork: Artwork;
  insert: (artwork: Artwork) => void;
  remove: (artworkId: string) => void;
}): EditorCommand {
  return {
    name: "AddArtwork",
    label: `Hang “${input.artwork.title}”`,
    do: () => input.insert(input.artwork),
    undo: () => input.remove(input.artwork.id),
  };
}

export function createRemoveArtworkCommand(input: {
  artwork: Artwork;
  insert: (artwork: Artwork) => void;
  remove: (artworkId: string) => void;
}): EditorCommand {
  return {
    name: "RemoveArtwork",
    label: `Remove “${input.artwork.title}”`,
    do: () => input.remove(input.artwork.id),
    undo: () => input.insert(input.artwork),
  };
}

export function createMoveArtworkCommand(input: {
  artworkId: string;
  before: ArtworkPlacement;
  after: ArtworkPlacement;
  applyPlacement: (artworkId: string, placement: ArtworkPlacement) => void;
  label?: string;
}): EditorCommand {
  return {
    name: "MoveArtwork",
    label: input.label ?? "Move artwork",
    do: () => input.applyPlacement(input.artworkId, input.after),
    undo: () => input.applyPlacement(input.artworkId, input.before),
  };
}

export function createBatchMoveArtworksCommand(input: {
  moves: readonly {
    artworkId: string;
    before: ArtworkPlacement;
    after: ArtworkPlacement;
  }[];
  applyPlacement: (artworkId: string, placement: ArtworkPlacement) => void;
  label?: string;
}): EditorCommand {
  return {
    name: "BatchMoveArtworks",
    label: input.label ?? "Distribute artworks",
    do: () => {
      for (const move of input.moves) {
        input.applyPlacement(move.artworkId, move.after);
      }
    },
    undo: () => {
      for (const move of input.moves) {
        input.applyPlacement(move.artworkId, move.before);
      }
    },
  };
}
