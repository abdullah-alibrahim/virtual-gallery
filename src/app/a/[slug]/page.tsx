import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EnquiryForm } from "@/components/shared/enquiry-form";
import { SocialLinks } from "@/components/shared/social-links";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { NotFoundError } from "@/core/errors";
import { loadArtistProfileBySlug } from "@/infrastructure/profiles/load-profile";
import { listPublishedGalleriesForWorkspace } from "@/infrastructure/profiles/list-public-galleries";
import { resolveArtistSocialLinks } from "@/lib/social-urls";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const profile = await loadArtistProfileBySlug(slug);
    return {
      title: profile.displayName,
      description:
        profile.bio ||
        `${profile.displayName} — walkable exhibitions on ${siteConfig.name}`,
      openGraph: {
        title: profile.displayName,
        description: profile.bio || undefined,
        type: "profile",
      },
    };
  } catch {
    return { title: "Artist not found", robots: { index: false } };
  }
}

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let profile;
  try {
    profile = await loadArtistProfileBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const galleries = await listPublishedGalleriesForWorkspace(
    profile.workspaceId,
  );
  const socialLinks = resolveArtistSocialLinks(profile.socials);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.displayName,
    description: profile.bio || undefined,
    url: `${siteConfig.url}/a/${profile.slug}`,
    ...(profile.avatarUrl ? { image: profile.avatarUrl } : {}),
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[oklch(0.14_0.01_70)] text-[oklch(0.95_0.01_95)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,oklch(0.28_0.04_55_/_0.55),transparent_55%),radial-gradient(ellipse_at_90%_20%,oklch(0.22_0.03_240_/_0.35),transparent_45%)]"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-14 px-6 py-14 md:py-20">
        <header className="page-enter flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.2em] text-white/45 uppercase">
              {siteConfig.name}
            </p>
            <h1 className="mt-3 font-serif text-5xl tracking-tight md:text-6xl">
              {profile.displayName}
            </h1>
            {profile.location ? (
              <p className="mt-3 text-sm text-white/55">{profile.location}</p>
            ) : null}
            {profile.bio ? (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75">
                {profile.bio}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 text-sm stagger-fade stagger-fade-1">
            <SocialLinks links={socialLinks} tone="onDark" />
          </div>
        </header>

        {profile.statement ? (
          <section className="max-w-2xl border-l border-white/15 pl-5 section-rise">
            <h2 className="text-xs tracking-[0.18em] text-white/45 uppercase">
              Statement
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
              {profile.statement}
            </p>
          </section>
        ) : null}

        <section className="flex flex-col gap-6">
          <h2 className="font-serif text-3xl tracking-tight page-enter">
            Exhibitions
          </h2>
          {galleries.length === 0 ? (
            <div className="relative flex flex-col items-center gap-4 overflow-hidden border border-dashed border-white/15 px-6 py-16 text-center page-enter">
              <div
                aria-hidden
                className="flex h-14 w-full max-w-[12rem] items-end justify-center gap-2 opacity-70"
              >
                <span className="h-9 w-7 border border-white/20 bg-[linear-gradient(145deg,#c4784a,#3a2a28)]" />
                <span className="h-12 w-9 border border-white/20 bg-[radial-gradient(circle_at_45%_40%,#e8f0f5,#1a2a38)]" />
                <span className="h-10 w-7 border border-white/20 bg-[linear-gradient(160deg,#a83228,#2a0e0c)]" />
              </div>
              <p className="font-serif text-xl tracking-tight text-white/85">
                No published galleries yet
              </p>
              <p className="max-w-sm text-sm text-white/45">
                When this artist publishes a show, you’ll enter the room from
                here. Meanwhile, walk a filled demo.
              </p>
              <Link
                href="/demo/pro"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "border-white/20 bg-white/10 text-white hover:bg-white/15",
                )}
              >
                Try the Pro hall
              </Link>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {galleries.map((gallery, index) => (
                <li
                  key={gallery.id}
                  className={cn(
                    "stagger-fade",
                    index === 1 && "stagger-fade-1",
                    index === 2 && "stagger-fade-2",
                    index >= 3 && "stagger-fade-3",
                  )}
                >
                  <Link
                    href={`/g/${gallery.slug}`}
                    className="group flex flex-col gap-3 border border-white/10 bg-white/[0.03] transition-colors hover:border-white/25 hover:bg-white/[0.06]"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.35_0.04_55_/0.5),transparent_60%),linear-gradient(160deg,oklch(0.22_0.02_70),oklch(0.16_0.02_240))]">
                      {gallery.coverThumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- dynamic Storage URLs
                        <img
                          src={gallery.coverThumbUrl}
                          alt=""
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div
                          className="absolute inset-x-[14%] top-[18%] bottom-[46%] flex items-stretch justify-center gap-2 opacity-70"
                          aria-hidden
                        >
                          <span className="w-[28%] border border-white/15 bg-[linear-gradient(145deg,#c4784a,#3a2a28)]" />
                          <span className="w-[32%] border border-white/15 bg-[radial-gradient(circle_at_45%_40%,#e8f0f5,#1a2a38)]" />
                          <span className="w-[26%] border border-white/15 bg-[linear-gradient(160deg,#a83228,#2a0e0c)]" />
                        </div>
                      )}
                    </div>
                    <div className="px-5 pb-5">
                      <p className="font-serif text-xl tracking-tight group-hover:underline">
                        {gallery.title}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        {gallery.artworkCount === 1
                          ? "1 work"
                          : `${gallery.artworkCount} works`}{" "}
                        · Enter the room
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {profile.contact.allowInquiries ? (
          <section className="max-w-lg">
            <h2 className="font-serif text-3xl tracking-tight">Contact</h2>
            <p className="mt-2 text-sm text-white/55">
              Send a note about a work or a show. It lands in the artist’s inbox.
            </p>
            <div className="mt-6">
              <EnquiryForm
                galleryId={galleries[0]?.id ?? null}
                disabled={!galleries[0]}
              />
              {!galleries[0] ? (
                <p className="mt-3 text-xs text-white/40">
                  Publish a gallery to enable enquiries.
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        <p className="pt-8">
          <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "text-white/60")}>
            {siteConfig.name}
          </Link>
        </p>
      </div>
    </main>
  );
}
