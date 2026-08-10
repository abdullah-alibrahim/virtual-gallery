"use client";

import { Download, ImageIcon } from "lucide-react";
import Image from "next/image";

import {
  SAMPLE_PAINTINGS,
  sampleTextureUrl,
} from "@/core/samples/sample-paintings";

/**
 * Downloadable starter pack + how to hang paintings in a gallery.
 */
export function SamplePaintingsPack() {
  return (
    <section className="relative flex flex-col gap-5 overflow-hidden border border-border px-5 py-6 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 surface-grain opacity-60"
      />
      <div className="relative flex flex-col gap-1.5">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
          Starter pack
        </p>
        <h2 className="font-serif text-2xl tracking-tight">
          Nine sample paintings
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
          Download JPGs for your library, or open any gallery editor and click{" "}
          <span className="text-foreground">Fill with sample paintings</span>{" "}
          to hang them on empty walls — no upload required.
        </p>
      </div>

      <ol className="relative list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
        <li>
          Download JPGs below (or right-click → Save). Files live at{" "}
          <code className="text-xs">/demo/artworks/01.jpg</code> …{" "}
          <code className="text-xs">09.jpg</code>.
        </li>
        <li>
          Upload your own files here, then open a gallery → Editor → Assets
          strip → click a thumbnail to hang.
        </li>
        <li>
          Or in an empty editor:{" "}
          <span className="text-foreground">Fill with sample paintings</span>.
        </li>
      </ol>

      <ul className="relative grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SAMPLE_PAINTINGS.map((painting) => {
          const href = sampleTextureUrl(painting.file);
          return (
            <li
              key={painting.id}
              className="overflow-hidden border border-border bg-background"
            >
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={href}
                  alt={painting.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col gap-2 p-2">
                <p className="truncate text-xs font-medium">{painting.title}</p>
                <a
                  href={href}
                  download={painting.file}
                  className="inline-flex h-7 items-center justify-center gap-1.5 border border-border px-2 text-xs font-medium hover:bg-accent"
                >
                  <Download className="size-3.5" />
                  Download
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="relative flex items-start gap-2 text-xs text-muted-foreground">
        <ImageIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Preview a filled room anytime at{" "}
          <a
            href="/demo/walk"
            className="text-foreground underline underline-offset-2"
          >
            /demo/walk
          </a>
          .
        </span>
      </p>
    </section>
  );
}
