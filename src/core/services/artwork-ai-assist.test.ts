import { describe, expect, it } from "vitest";

import { DEFAULT_FRAME } from "@/core/value-objects/frame-spec";

import {
  dimensionsRoughlyMatch,
  estimateExhibitionDimensions,
  fitSizeToAspect,
  pickBestCover,
  scoreCoverCandidate,
  suggestFrameFromArtwork,
} from "./artwork-ai-assist";

describe("artwork-ai-assist", () => {
  it("estimates exhibition size from pixel aspect", () => {
    const landscape = estimateExhibitionDimensions(1600, 900, 120);
    expect(landscape.width).toBeGreaterThan(landscape.height);
    expect(landscape.height).toBeGreaterThanOrEqual(40);
    expect(landscape.unit).toBe("cm");

    const portrait = estimateExhibitionDimensions(900, 1600, 120);
    expect(portrait.height).toBeGreaterThan(portrait.width);
  });

  it("reshapes a forced square to the picture aspect", () => {
    const landscape = fitSizeToAspect(1.2, 1.2, 1600 / 1014);
    expect(landscape.width).toBeGreaterThan(landscape.height);
    const portrait = fitSizeToAspect(1.2, 1.2, 759 / 1600);
    expect(portrait.height).toBeGreaterThan(portrait.width);
    const already = fitSizeToAspect(1.8, 1.4, 1.8 / 1.4);
    expect(already.width).toBeCloseTo(1.8);
    expect(already.height).toBeCloseTo(1.4);
  });

  it("detects when current dims already match the suggestion", () => {
    const suggested = estimateExhibitionDimensions(1200, 900);
    expect(dimensionsRoughlyMatch(suggested, suggested)).toBe(true);
    expect(
      dimensionsRoughlyMatch(
        { ...suggested, width: suggested.width + 10 },
        suggested,
      ),
    ).toBe(false);
  });

  it("suggests a breathing matte for dark works in white halls", () => {
    const suggestion = suggestFrameFromArtwork({
      dominantColor: "#1a1410",
      category: "white",
      defaults: DEFAULT_FRAME,
    });
    expect(suggestion.frame.style).toBe("gallery");
    expect(suggestion.frame.matteCm).toBeGreaterThanOrEqual(6);
    expect(suggestion.reasonKey).toBe("darkWork");
  });

  it("picks a wide cover over a tall one", () => {
    const tall = {
      id: "t",
      url: "/t.jpg",
      width: 800,
      height: 1400,
    };
    const wide = {
      id: "w",
      url: "/w.jpg",
      width: 2000,
      height: 1200,
    };
    expect(scoreCoverCandidate(wide)).toBeGreaterThan(scoreCoverCandidate(tall));
    expect(pickBestCover([tall, wide])?.id).toBe("w");
  });
});
