"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Quiet artwork voice-note control for the detail sheet.
 */
export function VoiceNotePlayer({
  src,
  muted = false,
  className,
}: {
  src: string;
  muted?: boolean;
  className?: string;
}) {
  const t = useT();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
  }, [src]);

  useEffect(() => {
    if (muted && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  }, [muted]);

  const toggle = useCallback(async () => {
    const el = audioRef.current;
    if (!el || muted) return;
    try {
      if (el.paused) {
        await el.play();
        setPlaying(true);
      } else {
        el.pause();
        setPlaying(false);
      }
    } catch {
      setPlaying(false);
    }
  }, [muted]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={muted}
        className="inline-flex items-center gap-2 border border-white/12 bg-white/[0.04] px-3 py-2 text-[11px] tracking-[0.14em] text-white/75 uppercase transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
        aria-label={playing ? t("walk.pauseVoiceNote") : t("walk.listen")}
      >
        {playing ? (
          <Pause className="size-3.5" />
        ) : (
          <Play className="size-3.5" />
        )}
        {playing ? t("walk.pauseVoiceNote") : t("walk.listen")}
      </button>
    </div>
  );
}
