"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  List,
  Maximize2,
  Minimize2,
  Share2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import type { SceneManifest } from "@/core/entities";
import { ErrorBoundary } from "@/components/shared/async-boundary";
import { useIsDesktop, usePrefersReducedMotion } from "@/hooks/use-media-query";
import {
  trackArtworkClick,
  trackGalleryView,
} from "@/lib/analytics/visitor-id";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { preloadGalleryProps } from "@/three/props/gallery-glb-prop";
import { FLAGSHIP_PROP_PRELOAD } from "@/three/props/gallery-prop-paths";

import { AccessibleListView } from "./accessible-list-view";
import {
  ArtworkDetailSheet,
  findArtwork,
} from "./artwork-detail-sheet";
import { BlurhashThumb } from "./blurhash-thumb";
import { EveningTourBanner } from "./evening-tour-banner";
import { ExhibitionAboutDrawer } from "./exhibition-about-drawer";
import { GuestbookBar } from "./guestbook-bar";
import { GuidedTourControls } from "./guided-tour-controls";
import { InnerWorldOverlay } from "./inner-world-overlay";
import { SharePanel } from "./share-panel";
import { TouchControls } from "./touch-controls";
import { WalkAtmosphereControls } from "./walk-atmosphere-controls";
import { WallLabel } from "./wall-label";
import { ZoomLightbox } from "./zoom-lightbox";
import {
  readEveningInviteFromSearch,
  resolveEveningTourAccess,
  type EveningTourAccess,
} from "@/features/viewer/lib/evening-tour";
import {
  readNightModePreference,
  readPlaceSoundPreference,
  writeNightModePreference,
  writePlaceSoundPreference,
} from "@/features/viewer/lib/visitor-preferences";
import { getGalleryAmbienceEngine } from "@/features/viewer/lib/webaudio-ambience";

const SceneRoot = dynamic(
  () =>
    import("@/three/scene/scene-root").then((m) => m.SceneRoot),
  { ssr: false, loading: () => null },
);

type ViewerMode = "walk" | "list";

const COLLECTOR_KEY = "vg.collectorMode";

/**
 * Public / demo viewer — cinematic shell around the shared SceneRoot.
 * Quiet luxury chrome; the 3D room stays the hero.
 */
export function GalleryViewer({
  manifest,
  walkEnabled = true,
  initialArtworkId = null,
  initialMode = "walk",
  listHref,
  walkHref,
  catalogueHref,
  mockupRouteKind,
}: {
  manifest: SceneManifest;
  walkEnabled?: boolean;
  initialArtworkId?: string | null;
  initialMode?: ViewerMode;
  /** Canonical list URL (e.g. `?view=list`) — used for deep-link share of list mode. */
  listHref?: string;
  walkHref?: string;
  catalogueHref?: string;
  /** When set, artwork sheet links to room mockups / personal space. */
  mockupRouteKind?: "published" | "demo" | "demo-pro";
}) {
  const isDesktop = useIsDesktop();
  const reduceMotion = usePrefersReducedMotion();
  const titleId = useId();
  const [ready, setReady] = useState(false);
  const [entered, setEntered] = useState(() => Boolean(initialArtworkId));
  const [mode, setMode] = useState<ViewerMode>(initialMode);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialArtworkId,
  );
  const [zoomOpen, setZoomOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [walkHintActive, setWalkHintActive] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [collectorMode, setCollectorMode] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [placeSoundOn, setPlaceSoundOn] = useState(true);
  const [innerWorldOpen, setInnerWorldOpen] = useState(false);
  const [eveningBannerDismissed, setEveningBannerDismissed] = useState(false);
  const [eveningSimulate, setEveningSimulate] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const t = useT();

  const selected = findArtwork(manifest, selectedId);
  const slugPath = `/g/${manifest.slug}`;
  const resolvedListHref = listHref ?? `${slugPath}?view=list`;
  const resolvedWalkHref = walkHref ?? slugPath;
  const resolvedCatalogueHref =
    catalogueHref ?? `${slugPath}/catalogue`;
  const shareBasePath = walkHref ?? slugPath;
  const isPrivateLink =
    manifest.visibility === "unlisted" || manifest.visibility === "password";
  const hasStatement = Boolean(manifest.description?.trim());
  const eveningTour = manifest.settings.eveningTour ?? null;
  const isDemoGallery = manifest.galleryId.startsWith("demo-");

  const eveningAccess: EveningTourAccess = useMemo(() => {
    if (eveningSimulate && eveningTour?.enabled) {
      return {
        status: "open",
        via: "invite",
        startAt: eveningTour.startAt,
        endAt: eveningTour.endAt,
      };
    }
    return resolveEveningTourAccess(eveningTour, new Date(), inviteCode);
  }, [eveningSimulate, eveningTour, inviteCode]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return shareBasePath;
    if (selectedId) {
      const deep =
        walkHref != null
          ? `${window.location.origin}${shareBasePath}?view=list#${selectedId}`
          : `${window.location.origin}/g/${manifest.slug}/a/${selectedId}`;
      return deep;
    }
    return `${window.location.origin}${shareBasePath}`;
  }, [manifest.slug, selectedId, shareBasePath, walkHref]);

  const mockupsHref = selected
    ? mockupHrefFor(mockupRouteKind, manifest.slug, selected.id, "mockups")
    : undefined;
  const spaceHref = selected
    ? mockupHrefFor(mockupRouteKind, manifest.slug, selected.id, "space")
    : undefined;
  const mobile = !isDesktop;
  const workCount = manifest.artworks.length;
  const showWalkHint =
    entered &&
    isDesktop &&
    !selected &&
    !reduceMotion &&
    walkHintActive &&
    !shareOpen &&
    !collectorMode;

  const tourOrdered = useMemo(() => [...manifest.artworks], [manifest.artworks]);
  const tourIndex = selectedId
    ? tourOrdered.findIndex((a) => a.id === selectedId)
    : -1;

  useEffect(() => {
    try {
      if (window.localStorage.getItem(COLLECTOR_KEY) === "1") {
        setCollectorMode(true);
      }
      const nightPref = readNightModePreference(manifest.galleryId);
      if (nightPref != null) setNightMode(nightPref);
      const soundPref = readPlaceSoundPreference(manifest.galleryId);
      if (soundPref === "muted") {
        setSoundMuted(true);
        setPlaceSoundOn(false);
      } else if (soundPref === "on") {
        setSoundMuted(false);
        setPlaceSoundOn(true);
      }
      setInviteCode(readEveningInviteFromSearch(window.location.search));
    } catch {
      /* ignore */
    }
  }, [manifest.galleryId]);

  useEffect(() => {
    if (!entered) return;
    const engine = getGalleryAmbienceEngine();
    void engine.setMuted(soundMuted || reduceMotion);
    void engine.setNightAmbience(nightMode && !soundMuted && !reduceMotion);
    void engine.setPlaceSound(placeSoundOn && !soundMuted && !reduceMotion);
  }, [entered, nightMode, placeSoundOn, reduceMotion, soundMuted]);

  useEffect(() => {
    if (!entered) return;
    if (eveningAccess.status !== "open") return;
    const pref = readNightModePreference(manifest.galleryId);
    if (pref == null) {
      setNightMode(true);
      writeNightModePreference(manifest.galleryId, true);
    }
  }, [entered, eveningAccess.status, manifest.galleryId]);

  useEffect(() => {
    setInnerWorldOpen(false);
  }, [selectedId]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!entered) return;
    trackGalleryView(manifest.galleryId);
  }, [entered, manifest.galleryId]);

  useEffect(() => {
    if (!entered || !isDesktop || reduceMotion || collectorMode) return;
    const timer = window.setTimeout(() => setWalkHintActive(false), 4500);
    const hide = () => setWalkHintActive(false);
    window.addEventListener("pointerlockchange", hide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerlockchange", hide);
    };
  }, [entered, isDesktop, reduceMotion, collectorMode]);

  const selectArtwork = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id) trackArtworkClick(manifest.galleryId, id);
    },
    [manifest.galleryId],
  );

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.message(t("walk.fullscreenUnavailable"));
    }
  }, [t]);

  const toggleCollector = useCallback(() => {
    setCollectorMode((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLECTOR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (next) {
        setTourActive(false);
        setShareOpen(false);
        setAboutOpen(false);
        toast.message(t("walk.collectorToast"));
      }
      return next;
    });
  }, [t]);

  const toggleNightMode = useCallback(() => {
    setNightMode((prev) => {
      const next = !prev;
      writeNightModePreference(manifest.galleryId, next);
      toast.message(next ? t("walk.nightModeOn") : t("walk.dayModeOn"));
      return next;
    });
  }, [manifest.galleryId, t]);

  const toggleSound = useCallback(() => {
    setSoundMuted((prev) => {
      const nextMuted = !prev;
      const placeOn = !nextMuted;
      setPlaceSoundOn(placeOn);
      writePlaceSoundPreference(
        manifest.galleryId,
        nextMuted ? "muted" : "on",
      );
      toast.message(nextMuted ? t("walk.soundMuted") : t("walk.soundOn"));
      return nextMuted;
    });
  }, [manifest.galleryId, t]);

  const enterEvening = useCallback(() => {
    setNightMode(true);
    writeNightModePreference(manifest.galleryId, true);
    setEveningBannerDismissed(true);
    toast.message(t("walk.nightModeOn"));
  }, [manifest.galleryId, t]);

  const enterRoom = useCallback(() => {
    const arch = manifest.template.architecture;
    if (arch?.glbProps?.length || arch?.benches?.some((b) => b.glb)) {
      preloadGalleryProps(FLAGSHIP_PROP_PRELOAD);
    }
    setEntered(true);
  }, [manifest.template.architecture]);

  const startTour = useCallback(() => {
    setTourActive(true);
    if (!entered) enterRoom();
    const first = tourOrdered[0];
    if (first) selectArtwork(first.id);
  }, [enterRoom, entered, selectArtwork, tourOrdered]);

  const goList = useCallback(() => {
    startTransition(() => setMode("list"));
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", resolvedListHref);
    }
  }, [resolvedListHref]);

  if (mode === "list") {
    return (
      <>
        <AccessibleListView
          manifest={manifest}
          walkHref={resolvedWalkHref}
          catalogueHref={resolvedCatalogueHref}
          artworkHrefBase={walkHref ? shareBasePath : undefined}
          onEnterWalk={() => {
            startTransition(() => setMode("walk"));
            if (typeof window !== "undefined") {
              window.history.replaceState(null, "", resolvedWalkHref);
            }
          }}
          onShare={() => setShareOpen(true)}
        />
        {shareOpen ? (
          <div className="fixed inset-0 z-50">
            <SharePanel
              title={manifest.title}
              artistName={manifest.artist.displayName}
              url={
                typeof window !== "undefined"
                  ? `${window.location.origin}${shareBasePath}`
                  : shareBasePath
              }
              privateLink={isPrivateLink}
              onClose={() => setShareOpen(false)}
            />
          </div>
        ) : null}
      </>
    );
  }

  const showDetailSheet = selected && entered && !collectorMode;
  const showWallLabel = Boolean(selected && entered && collectorMode);
  return (
    <div
      className="viewer-root relative isolate min-h-dvh w-full overflow-hidden bg-[#0a0908] text-[color:var(--viewer-foreground)]"
      data-collector={collectorMode ? "true" : undefined}
      role="application"
      aria-labelledby={titleId}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_28%_18%,oklch(0.26_0.035_75_/0.4),transparent_55%),radial-gradient(ellipse_at_82%_88%,oklch(0.2_0.02_55_/0.3),transparent_50%)]"
      />

      {!entered || !ready ? (
        <LoadingShell manifest={manifest} reduceMotion={reduceMotion} />
      ) : null}

      {entered ? (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-out",
            ready ? "opacity-100" : "opacity-0",
          )}
          style={{
            backgroundColor: manifest.template.environment.background,
          }}
        >
          <ErrorBoundary
            fallback={() => (
              <div
                className="flex size-full min-h-dvh items-end p-6 sm:p-10"
                style={{
                  backgroundColor: manifest.template.environment.background,
                }}
              >
                <p className="max-w-sm text-sm text-muted-foreground">
                  {t("walk.walkFailed")}
                </p>
              </div>
            )}
          >
            <SceneRoot
              manifest={manifest}
              walkEnabled={walkEnabled}
              mobile={mobile}
              reducedMotion={reduceMotion}
              eveningMode={nightMode}
              placeSoundEnabled={placeSoundOn && entered}
              soundMuted={soundMuted || reduceMotion}
              visitorShadow={entered && !collectorMode}
              selectedArtworkId={selectedId}
              onSelectArtwork={selectArtwork}
              className="size-full min-h-dvh"
              onReady={() => setReady(true)}
            />
          </ErrorBoundary>
        </div>
      ) : null}

      <header
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:gap-4 sm:p-4 md:p-6",
          "pt-[max(0.75rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]",
        )}
      >
        <div
          className={cn(
            "viewer-title-plaque pointer-events-auto min-w-0 max-w-[min(100%,18rem)] border border-white/[0.09] sm:max-w-md",
            "bg-[color:var(--viewer-scrim)] px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3",
            collectorMode && "viewer-chrome-dim",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              {t("walk.exhibition")}
            </p>
            {isPrivateLink ? (
              <span className="border border-[color:var(--viewer-brass)]/40 px-1.5 py-0.5 text-[9px] tracking-[0.14em] text-[color:var(--viewer-brass)] uppercase">
                {t("walk.privateLink")}
              </span>
            ) : null}
          </div>
          <p
            id={titleId}
            className="viewer-title-text mt-0.5 truncate font-serif text-base leading-tight tracking-tight sm:text-xl md:text-2xl"
          >
            {manifest.title}
          </p>
          <p className="mt-0.5 truncate text-xs tracking-wide text-white/65 sm:mt-1 sm:text-sm">
            <Link
              href={`/a/${manifest.artist.slug}`}
              className="hover:underline"
            >
              {manifest.artist.displayName}
            </Link>
            <span className="mx-1.5 text-white/30 sm:mx-2">·</span>
            <span className="text-white/50">
              {workCount === 0
                ? t("walk.emptyRoom")
                : `${workCount} ${workCount === 1 ? t("walk.work") : t("walk.works")}`}
            </span>
          </p>
        </div>

        <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-2">
          <div
            className={cn(
              "flex items-center gap-0.5 border border-white/[0.09] bg-[color:var(--viewer-scrim)] p-0.5 backdrop-blur-md sm:gap-1 sm:p-1",
              collectorMode ? "viewer-chrome-dim" : "",
            )}
          >
            <LanguageSwitcher
              size="xs"
              variant="ghost"
              className="me-0.5 hidden sm:inline-flex"
            />
            <ChromeButton
              label={t("walk.listView")}
              onClick={goList}
            >
              <List className="size-4" />
            </ChromeButton>
            {hasStatement ? (
              <ChromeButton
                label={t("walk.exhibitionStatement")}
                onClick={() => setAboutOpen(true)}
              >
                <BookOpen className="size-4" />
              </ChromeButton>
            ) : null}
            <ChromeButton label={t("walk.share")} onClick={() => setShareOpen(true)}>
              <Share2 className="size-4" />
            </ChromeButton>
            <ChromeButton
              label={
                collectorMode ? t("walk.exitCollector") : t("walk.collectorMode")
              }
              onClick={toggleCollector}
              active={collectorMode}
            >
              {collectorMode ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </ChromeButton>
            <ChromeButton
              label={fullscreen ? t("walk.exitFullscreen") : t("walk.fullscreen")}
              onClick={() => void toggleFullscreen()}
            >
              {fullscreen ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </ChromeButton>
          </div>
          {entered ? (
            <div
              className={cn(
                "flex flex-col items-end gap-2",
                collectorMode && "viewer-chrome-dim",
              )}
            >
              <WalkAtmosphereControls
                nightMode={nightMode}
                soundMuted={soundMuted}
                onToggleNight={toggleNightMode}
                onToggleSound={toggleSound}
              />
              {isDemoGallery && eveningTour?.enabled ? (
                <button
                  type="button"
                  onClick={() => {
                    setEveningSimulate((v) => !v);
                    setEveningBannerDismissed(false);
                    if (!eveningSimulate) {
                      setNightMode(true);
                      writeNightModePreference(manifest.galleryId, true);
                    }
                  }}
                  className="text-[10px] tracking-wide text-white/40 underline-offset-4 hover:text-white/70 hover:underline"
                >
                  {eveningSimulate
                    ? t("walk.dayMode")
                    : t("walk.simulateEvening")}
                </button>
              ) : null}
              <div className={cn(collectorMode && "viewer-chrome-hide")}>
                <GuestbookBar galleryId={manifest.galleryId} />
                {!shareOpen ? (
                  <div className="mt-2">
                    <GuidedTourControls
                      artworks={manifest.artworks}
                      currentId={selectedId}
                      active={tourActive}
                      onToggle={() => {
                        if (!tourActive) startTour();
                        else setTourActive(false);
                      }}
                      onSelect={(id) => {
                        setTourActive(true);
                        selectArtwork(id);
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {!entered ? (
        <div className="absolute inset-0 z-[25] flex items-end justify-center pb-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] md:items-center md:pb-0">
          <div
            className={cn(
              "mx-4 w-full max-w-md border border-white/[0.11] bg-black/65 px-7 py-7 text-center backdrop-blur-xl",
              !reduceMotion && "viewer-enter-panel",
            )}
          >
            <div
              aria-hidden
              className="mx-auto mb-4 h-px w-10 bg-[color:var(--viewer-brass)]/50"
            />
            <p className="text-[10px] tracking-[0.22em] text-white/40 uppercase">
              {t("walk.pleaseEnter")}
            </p>
            <p className="mt-2.5 font-serif text-3xl tracking-tight text-balance">
              {manifest.title}
            </p>
            {hasStatement ? (
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/60 text-pretty">
                {manifest.description}
              </p>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-white/60 text-pretty">
                {workCount === 0
                  ? t("walk.emptyForNow")
                  : t("walk.atScale", {
                      count: workCount,
                      unit: workCount === 1 ? t("walk.work") : t("walk.works"),
                    })}
              </p>
            )}
            <p className="mt-3 text-[11px] tracking-wide text-white/40">
              {mobile
                ? t("walk.mobileHint")
                : t("walk.desktopHint")}
            </p>
            <button
              type="button"
              onClick={enterRoom}
              className="mt-6 w-full border border-white/20 bg-white/95 py-3 text-sm font-medium tracking-wide text-neutral-900 transition-colors hover:bg-white"
            >
              {t("walk.enter")}
            </button>
            {workCount >= 2 ? (
              <button
                type="button"
                onClick={startTour}
                className="mt-2 w-full border border-white/12 bg-white/[0.04] py-2.5 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                {t("walk.beginTour")}
              </button>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-white/45">
              <button
                type="button"
                className="underline-offset-4 hover:text-white/75 hover:underline"
                onClick={goList}
              >
                {t("walk.catalogueList")}
              </button>
              <Link
                href={resolvedCatalogueHref}
                className="underline-offset-4 hover:text-white/75 hover:underline"
              >
                {t("walk.printCatalogue")}
              </Link>
              {hasStatement ? (
                <button
                  type="button"
                  className="underline-offset-4 hover:text-white/75 hover:underline"
                  onClick={() => setAboutOpen(true)}
                >
                  {t("walk.statement")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {entered && mobile && !selected && !shareOpen ? (
        <div className={cn(collectorMode && "viewer-chrome-dim")}>
          <TouchControls />
        </div>
      ) : null}

      {entered && isDesktop && !selected && showWalkHint ? (
        <p className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 border border-white/[0.07] bg-black/40 px-3.5 py-2 text-[11px] tracking-wide text-white/55 backdrop-blur-sm">
          {t("walk.walkHint")}
        </p>
      ) : null}

      {showWallLabel && selected ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 z-[25] flex justify-center px-4",
            collectorMode
              ? "bottom-[max(2.5rem,env(safe-area-inset-bottom)+1.5rem)]"
              : "bottom-[calc(62dvh+0.75rem)] md:bottom-8 md:right-[calc(23rem+2rem)] md:left-auto md:justify-end",
          )}
        >
          <WallLabel
            artwork={selected}
            artistName={manifest.artist.displayName}
            enlarged={collectorMode}
            className="max-w-sm"
          />
        </div>
      ) : null}

      {showDetailSheet && selected ? (
        <ArtworkDetailSheet
          artwork={selected}
          artistName={manifest.artist.displayName}
          galleryId={manifest.galleryId}
          allowInquiries={manifest.artist.allowInquiries}
          artistSocials={manifest.artist.socials}
          galleryWebsite={manifest.galleryWebsite}
          mockupsHref={mockupsHref}
          spaceHref={spaceHref}
          soundMuted={soundMuted}
          tourIndex={tourActive && tourIndex >= 0 ? tourIndex : null}
          tourTotal={tourActive ? tourOrdered.length : null}
          onTourPrev={
            tourActive && tourIndex > 0
              ? () => selectArtwork(tourOrdered[tourIndex - 1]!.id)
              : undefined
          }
          onTourNext={
            tourActive && tourIndex >= 0 && tourIndex < tourOrdered.length - 1
              ? () => selectArtwork(tourOrdered[tourIndex + 1]!.id)
              : undefined
          }
          onClose={() => setSelectedId(null)}
          onZoom={() => setZoomOpen(true)}
          onShare={() => setShareOpen(true)}
          onEnterInnerWorld={
            selected.innerWorld ? () => setInnerWorldOpen(true) : undefined
          }
        />
      ) : null}

      {innerWorldOpen && selected?.innerWorld ? (
        <InnerWorldOverlay
          world={selected.innerWorld}
          artworkTitle={selected.title}
          onClose={() => setInnerWorldOpen(false)}
        />
      ) : null}

      {entered &&
      eveningTour?.enabled &&
      !eveningBannerDismissed &&
      !collectorMode &&
      !shareOpen ? (
        <div className="pointer-events-none absolute bottom-[max(4.5rem,env(safe-area-inset-bottom)+3.5rem)] left-3 z-30 md:bottom-8 md:left-6">
          <EveningTourBanner
            access={eveningAccess}
            tour={eveningTour}
            sharePath={shareBasePath}
            nightMode={nightMode}
            onEnterEvening={enterEvening}
            onDismiss={() => setEveningBannerDismissed(true)}
            showSimulate={isDemoGallery}
            onSimulate={() => {
              setEveningSimulate(true);
              setEveningBannerDismissed(false);
            }}
          />
        </div>
      ) : null}

      {collectorMode && selected && entered ? (
        <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom)+0.5rem)] left-1/2 z-30 flex -translate-x-1/2 gap-2">
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="border border-white/15 bg-black/50 px-3 py-1.5 text-[11px] tracking-wide text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
          >
            {t("walk.zoom")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="border border-white/15 bg-black/50 px-3 py-1.5 text-[11px] tracking-wide text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
          >
            {t("walk.release")}
          </button>
        </div>
      ) : null}

      {zoomOpen && selected ? (
        <ZoomLightbox
          artwork={selected}
          onClose={() => setZoomOpen(false)}
        />
      ) : null}

      {shareOpen ? (
        <SharePanel
          title={selected?.title ?? manifest.title}
          artistName={manifest.artist.displayName}
          url={shareUrl}
          privateLink={isPrivateLink}
          onClose={() => setShareOpen(false)}
        />
      ) : null}

      {aboutOpen && hasStatement ? (
        <ExhibitionAboutDrawer
          title={manifest.title}
          artistName={manifest.artist.displayName}
          description={manifest.description}
          workCount={workCount}
          artistSocials={manifest.artist.socials}
          galleryWebsite={manifest.galleryWebsite}
          onClose={() => setAboutOpen(false)}
        />
      ) : null}

      <nav className="sr-only" aria-label={t("walk.artworksNav")}>
        <ul>
          {manifest.artworks.map((artwork) => (
            <li key={artwork.id}>
              <button
                type="button"
                onClick={() => {
                  enterRoom();
                  selectArtwork(artwork.id);
                }}
              >
                {artwork.title}
                {artwork.year ? `, ${artwork.year}` : ""}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {entered && !collectorMode ? (
        <Link
          href={resolvedCatalogueHref}
          className="viewer-chrome-dim pointer-events-auto absolute bottom-3 left-3 z-20 hidden items-center gap-1.5 border border-white/[0.08] bg-black/35 px-2.5 py-1.5 text-[10px] tracking-[0.12em] text-white/45 uppercase backdrop-blur-sm transition-colors hover:text-white/75 md:inline-flex"
        >
          <FileText className="size-3" aria-hidden />
          Catalogue
        </Link>
      ) : null}
    </div>
  );
}

function LoadingShell({
  manifest,
  reduceMotion,
}: {
  manifest: SceneManifest;
  reduceMotion: boolean;
}) {
  const t = useT();
  const samples = manifest.artworks.slice(0, 5);
  const roomColor = manifest.template.environment.background;
  return (
    <div className="absolute inset-0 z-10 flex flex-col">
      <div className="absolute inset-0" style={{ backgroundColor: roomColor }} />
      <div className="absolute inset-0 bg-[#0e0c0a]/60" />
      <div
        aria-hidden
        className="absolute inset-0 grid grid-cols-3 gap-1 opacity-35 md:grid-cols-5"
      >
        {samples.map((artwork, i) => (
          <div
            key={artwork.id}
            className={cn(
              "relative overflow-hidden",
              i === 0 && "col-span-2 row-span-2",
              !reduceMotion && "animate-pulse",
            )}
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <BlurhashThumb
              hash={artwork.meta.blurhash}
              alt=""
              className="size-full scale-110"
            />
          </div>
        ))}
      </div>
      <div className="relative z-10 mt-auto flex flex-col items-center gap-3 px-6 pb-20 text-center">
        <p className="text-[10px] tracking-[0.22em] text-white/40 uppercase">
          {t("walk.preparing")}
        </p>
        <p className="font-serif text-3xl tracking-tight text-white/95 md:text-4xl">
          {manifest.title}
        </p>
        <p className="text-sm text-white/50">
          {manifest.artworks.length > 12
            ? t("walk.preparingBody")
            : t("walk.preparingHint")}
        </p>
        <div
          className={cn(
            "h-px w-20 origin-center bg-[color:var(--viewer-brass)]/45",
            !reduceMotion && "viewer-load-line",
          )}
        />
      </div>
    </div>
  );
}

function ChromeButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center text-white/65 transition-colors hover:bg-white/10 hover:text-white",
        active && "bg-white/12 text-[color:var(--viewer-brass)]",
      )}
    >
      {children}
    </button>
  );
}

function mockupHrefFor(
  kind: "published" | "demo" | "demo-pro" | undefined,
  slug: string,
  artworkId: string,
  surface: "mockups" | "space",
): string | undefined {
  const routeKind = kind ?? "published";
  if (routeKind === "demo") {
    return `/demo/${surface}?artwork=${encodeURIComponent(artworkId)}`;
  }
  if (routeKind === "demo-pro") {
    return `/demo/pro/${surface}?artwork=${encodeURIComponent(artworkId)}`;
  }
  return `/g/${slug}/a/${artworkId}/${surface}`;
}
