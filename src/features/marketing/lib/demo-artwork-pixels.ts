/** Native pixel size of `/public/demo/artworks/*.jpg` — hang follows these. */
export const DEMO_ARTWORK_PIXELS = [
  { file: "01.jpg", widthPx: 1280, heightPx: 1014 },
  { file: "02.jpg", widthPx: 1319, heightPx: 1600 },
  { file: "03.jpg", widthPx: 1280, heightPx: 883 },
  { file: "04.jpg", widthPx: 1280, heightPx: 1230 },
  { file: "05.jpg", widthPx: 1600, heightPx: 1338 },
  { file: "06.jpg", widthPx: 1280, heightPx: 951 },
  { file: "07.jpg", widthPx: 759, heightPx: 1600 },
  { file: "08.jpg", widthPx: 1600, heightPx: 1202 },
  { file: "09.jpg", widthPx: 1600, heightPx: 1130 },
] as const;

export function demoArtworkUrl(file: string): string {
  return `/demo/artworks/${file}`;
}

export function demoArtworkPixels(
  url: string,
): { widthPx: number; heightPx: number } {
  const file = url.split("/").pop() ?? "";
  const match = DEMO_ARTWORK_PIXELS.find((item) => item.file === file);
  return match ?? { widthPx: 1200, heightPx: 1200 };
}
