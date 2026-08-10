"use client";

import { toast } from "sonner";

import { isSampleAssetId } from "@/core/samples/sample-paintings";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

import { fillWithSamplePaintings } from "../lib/fill-sample-paintings";
import { hangAssetAsArtwork } from "../lib/hang-artwork";
import { useEditorStore } from "../store/editor-store";

export function AssetsPanel() {
  const t = useT();
  const assets = useEditorStore((s) => s.assets);
  const gallery = useEditorStore((s) => s.gallery);
  const template = useEditorStore((s) => s.template);
  const artworks = useEditorStore((s) => s.artworks);
  const addArtwork = useEditorStore((s) => s.addArtwork);
  const setAssets = useEditorStore((s) => s.setAssets);

  const ready = assets.filter((a) => a.status === "ready");
  const uploads = ready.filter((a) => !isSampleAssetId(a.id));
  const samples = ready.filter((a) => isSampleAssetId(a.id));
  const freeAnchors =
    (template?.walls.flatMap((w) => w.anchors).length ?? 0) -
    artworks.filter((a) => a.placement.anchorIndex !== null).length;
  const canFillSamples =
    Boolean(gallery && template) &&
    freeAnchors > 0 &&
    (samples.some((s) => !artworks.some((a) => a.assetId === s.id)) ||
      samples.length === 0);

  function hang(assetId: string) {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset || !gallery || !template) return;
    if (artworks.some((a) => a.assetId === asset.id)) {
      toast.message("That painting is already hanging");
      return;
    }
    const artwork = hangAssetAsArtwork({
      asset,
      galleryId: gallery.id,
      workspaceId: gallery.workspaceId,
      template,
      existing: artworks,
      lightingPresetId: gallery.settings.lightingPreset,
    });
    if (!artwork) {
      toast.error("No free wall space — remove a work or choose a larger template");
      return;
    }
    addArtwork(artwork);
    toast.success(`Hung “${artwork.title}”`);
  }

  function fillSamples() {
    if (!gallery || !template) return;
    const result = fillWithSamplePaintings({
      galleryId: gallery.id,
      workspaceId: gallery.workspaceId,
      template,
      existing: artworks,
      assets,
    });
    if (result.hung === 0) {
      toast.message(
        result.skipped > 0
          ? "Sample paintings are already hanging"
          : "No free wall space for samples",
      );
      return;
    }
    setAssets(result.assets);
    for (const artwork of result.artworks) {
      addArtwork(artwork);
    }
    toast.success(t("editor.samplesFilled"));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--editor-border)] px-3 py-1.5">
        <p className="text-xs font-medium tracking-wide text-[color:var(--editor-muted)] uppercase">
          {t("editor.assets")}
        </p>
        <div className="flex items-center gap-2">
          {canFillSamples ? (
            <button
              type="button"
              onClick={fillSamples}
              className="rounded border border-white/20 px-2 py-0.5 text-[11px] text-white/90 hover:border-white/40 hover:bg-white/5"
            >
              {t("editor.fillSamples")}
            </button>
          ) : null}
          <p className="text-[11px] text-[color:var(--editor-muted)]">
            {t("editor.clickToHang")}
          </p>
        </div>
      </div>
      <div className="flex flex-1 gap-2 overflow-x-auto p-2">
        {ready.length === 0 ? (
          <div className="flex flex-col justify-center gap-2 px-3 py-1">
            <p className="text-xs text-[color:var(--editor-muted)]">
              {t("assets.emptyBody")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {canFillSamples ? (
                <button
                  type="button"
                  onClick={fillSamples}
                  className="rounded border border-white/25 px-2.5 py-1 text-[11px] text-white/90 hover:border-white/45 hover:bg-white/5"
                >
                  {t("editor.fillSamples")}
                </button>
              ) : null}
              <a
                href="/assets"
                className="text-[11px] text-white/80 underline underline-offset-2 hover:text-white"
              >
                {t("assets.library")}
              </a>
            </div>
          </div>
        ) : (
          <>
            {uploads.length === 0 && artworks.length === 0 ? (
              <div className="flex shrink-0 flex-col justify-center gap-1 px-2">
                <p className="max-w-[11rem] text-[11px] text-[color:var(--editor-muted)]">
                  {t("assets.samplePack")}
                </p>
                {canFillSamples ? (
                  <button
                    type="button"
                    onClick={fillSamples}
                    className="text-left text-[11px] text-white/80 underline underline-offset-2 hover:text-white"
                  >
                    {t("editor.fillSamples")}
                  </button>
                ) : null}
              </div>
            ) : null}
            {ready.map((asset) => {
              const hanging = artworks.some((a) => a.assetId === asset.id);
              const sample = isSampleAssetId(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  disabled={hanging}
                  onClick={() => hang(asset.id)}
                  className={cn(
                    "relative h-full w-24 shrink-0 overflow-hidden rounded border border-[color:var(--editor-border)]",
                    hanging
                      ? "opacity-40"
                      : "hover:border-white/40 focus-visible:outline focus-visible:outline-offset-2",
                  )}
                  title={
                    hanging
                      ? "Already hanging"
                      : sample
                        ? `Hang sample · ${asset.fileName}`
                        : `Hang ${asset.fileName}`
                  }
                >
                  {asset.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.thumbUrl}
                      alt={asset.fileName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-[10px] text-[color:var(--editor-muted)]">
                      No thumb
                    </span>
                  )}
                  {sample ? (
                    <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[9px] text-white/90">
                      Sample
                    </span>
                  ) : null}
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
