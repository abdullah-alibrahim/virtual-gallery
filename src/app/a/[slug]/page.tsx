import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EnquiryForm } from "@/components/shared/enquiry-form";
import { SocialLinks } from "@/components/shared/social-links";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  ISMAIL_BOAT_WORKS,
  ISMAIL_EMAIL,
  ISMAIL_HALL_WORKS,
  ISMAIL_SLUG,
  getIsmailRifaiStaticProfile,
  ismailMediumLocalized,
  ismailTextureUrl,
  type IsmailWork,
} from "@/core/samples/ismail-rifai";
import type { ArtistProfile, UserAccount } from "@/core/entities";
import { NotFoundError } from "@/core/errors";
import { getIsmailRifaiPublicGalleries } from "@/features/viewer/lib/ismail-rifai-manifest";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { loadArtistProfileBySlug } from "@/infrastructure/profiles/load-profile";
import {
  listPublishedGalleriesForWorkspace,
  type PublicGalleryCard,
} from "@/infrastructure/profiles/list-public-galleries";
import { getRequestLocale } from "@/i18n/server";
import { resolveArtistSocialLinks } from "@/lib/social-urls";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Featured catalogue entries — quiet selection, not a thumbnail grid. */
const ISMAIL_CATALOGUE_PICKS = [
  "01",
  "04",
  "07",
  "10",
  "12",
  "boat-01",
  "boat-03",
  "13",
] as const;

async function resolveProfile(slug: string): Promise<{
  profile: ArtistProfile;
  galleries: PublicGalleryCard[];
}> {
  try {
    const profile = await loadArtistProfileBySlug(slug);
    let galleries = await listPublishedGalleriesForWorkspace(
      profile.workspaceId,
    );
    if (slug === ISMAIL_SLUG && galleries.length === 0) {
      galleries = getIsmailRifaiPublicGalleries();
    }
    return { profile, galleries };
  } catch (error) {
    if (slug === ISMAIL_SLUG) {
      return {
        profile: getIsmailRifaiStaticProfile(),
        galleries: getIsmailRifaiPublicGalleries(),
      };
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { profile } = await resolveProfile(slug);
    return {
      title: profile.displayName,
      description:
        profile.bio ||
        `${profile.displayName} — walkable exhibitions on ${siteConfig.name}`,
      openGraph: {
        title: profile.displayName,
        description: profile.bio || undefined,
        type: "profile",
        ...(profile.avatarUrl ? { images: [{ url: profile.avatarUrl }] } : {}),
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
  const locale = await getRequestLocale();

  let resolved;
  try {
    resolved = await resolveProfile(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const { profile, galleries } = resolved;
  const socialLinks = resolveArtistSocialLinks(profile.socials);
  const isIsmail = slug === ISMAIL_SLUG;
  const arabic = locale === "ar";
  const ctx = await getAuthContext();
  const canEditProfile = ownsPublicProfile(ctx?.account, profile);
  const displayName =
    arabic && isIsmail ? "إسماعيل الرفاعي" : profile.displayName;
  const location =
    arabic && isIsmail && profile.location
      ? "الشارقة، الإمارات العربية المتحدة"
      : profile.location;
  const bio =
    arabic && isIsmail
      ? "رسّام في الشارقة. مناظر لطرق الليل، وشجرة بيت الشامسي، ومراكب، والشكل الإنساني القريب — تُعرض هنا كقاعة يمكن التجوّل فيها."
      : profile.bio;
  const statement =
    arabic && isIsmail
      ? "أرسم المسافة بين الإسفلت والتل، بين جسدين والعتمة التي تجمعهما. شجرة اللوز في ساحة بيت عبيد الشامسي شاهد أعود إليه. الغرفة هادئة كي يتكلم العمل بمقياسه."
      : profile.statement;
  const workCount = isIsmail
    ? ISMAIL_HALL_WORKS.length + ISMAIL_BOAT_WORKS.length
    : galleries.reduce((sum, gallery) => sum + gallery.artworkCount, 0);

  const heroSrc =
    profile.coverUrl ||
    galleries[0]?.coverThumbUrl ||
    (isIsmail ? ismailTextureUrl("01.jpg") : null);
  const primaryWalk =
    galleries[0]?.href ??
    (galleries[0]
      ? `/g/${galleries[0].slug}`
      : isIsmail
        ? "/demo/ismail"
        : null);
  const catalogueWorks = isIsmail ? pickIsmailCatalogue() : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.displayName,
    description: profile.bio || undefined,
    url: `${siteConfig.url}/a/${profile.slug}`,
    ...(profile.avatarUrl ? { image: profile.avatarUrl } : {}),
    ...(profile.location ? { homeLocation: profile.location } : {}),
    ...(socialLinks.length > 0
      ? { sameAs: socialLinks.map((link) => link.href) }
      : {}),
  };

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[oklch(0.11_0.01_70)] text-[oklch(0.96_0.01_95)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Full-bleed catalogue hero — one work dominates the first viewport */}
      <section className="relative isolate min-h-[100svh] w-full">
        {heroSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- local / Storage URLs
          <img
            src={heroSrc}
            alt=""
            className="absolute inset-0 size-full object-cover object-center"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_10%,oklch(0.26_0.03_55_/_0.5),transparent_50%),linear-gradient(165deg,oklch(0.17_0.02_70),oklch(0.1_0.015_240))]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.11_0.01_70)] via-[oklch(0.11_0.01_70_/_0.45)] to-black/35" />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="font-serif text-sm tracking-tight text-white/75 transition-colors hover:text-white"
          >
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="ghost" />
            {canEditProfile ? (
              <Link
                href="/settings/profile"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "border-white/20 bg-black/30 text-white backdrop-blur-sm hover:bg-black/45",
                )}
              >
                {arabic ? "تعديل الملف" : "Edit profile"}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-4 pb-14 pt-28 sm:px-6 sm:pb-20 lg:px-10">
          <div className="mx-auto w-full max-w-5xl">
            <p className="text-[11px] tracking-[0.22em] text-white/50 uppercase">
              {arabic ? "فنان" : "Artist"}
              {location ? ` · ${location}` : null}
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-5xl tracking-tight text-balance sm:text-6xl md:text-7xl lg:text-8xl">
              {displayName}
            </h1>
            {bio ? (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                {bio}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {primaryWalk ? (
                <Link
                  href={primaryWalk}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "border-white/15 bg-white text-[oklch(0.14_0.015_70)] hover:bg-white/90",
                  )}
                >
                  {arabic ? "ادخل القاعة" : "Enter the hall"}
                </Link>
              ) : null}
              {isIsmail ? (
                <Link
                  href="/demo/ismail/boats"
                  className="px-1 text-sm tracking-wide text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {arabic ? "مراكب" : "Marakeb"}
                </Link>
              ) : null}
            </div>
            <p className="mt-8 text-[11px] tracking-[0.16em] text-white/40 uppercase">
              {galleries.length}{" "}
              {arabic
                ? galleries.length === 1
                  ? "معرض"
                  : "معارض"
                : galleries.length === 1
                  ? "exhibition"
                  : "exhibitions"}
              <span className="mx-2 text-white/20">·</span>
              {workCount}{" "}
              {arabic
                ? workCount === 1
                  ? "عمل"
                  : "أعمال"
                : workCount === 1
                  ? "work"
                  : "works"}
            </p>
          </div>
        </div>
      </section>

      <div className="relative mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 md:py-24 lg:px-10">
        <header className="flex flex-col gap-8 border-b border-white/10 pb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local / Storage URLs
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="size-20 shrink-0 object-cover object-center sm:size-24"
              />
            ) : null}
            <div>
              <p className="text-[11px] tracking-[0.2em] text-white/40 uppercase">
                {arabic ? "ملف الفنان" : "Artist profile"}
              </p>
              <p className="mt-2 max-w-md font-serif text-2xl tracking-tight text-white/90 sm:text-3xl">
                {arabic
                  ? "معارض يمكن التجوّل فيها، بمقياس الكتالوج."
                  : "Walkable exhibitions, at catalogue scale."}
              </p>
            </div>
          </div>
          <SocialLinks
            links={socialLinks}
            tone="onDark"
            layout="pills"
            label={arabic ? "التواصل الاجتماعي" : "Social links"}
          />
        </header>

        {statement ? (
          <section className="mt-16 max-w-2xl">
            <h2 className="text-[11px] tracking-[0.2em] text-white/40 uppercase">
              {arabic ? "بيان" : "Statement"}
            </h2>
            <p className="mt-4 font-serif text-xl leading-relaxed text-white/85 sm:text-2xl">
              {statement}
            </p>
          </section>
        ) : null}

        <section className="mt-20">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {arabic ? "المعارض" : "Exhibitions"}
          </h2>
          {galleries.length === 0 ? (
            <p className="mt-8 font-serif text-xl text-white/70">
              {arabic ? "لا معارض منشورة بعد" : "No published galleries yet"}
            </p>
          ) : (
            <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {galleries.map((gallery) => {
                const href = gallery.href ?? `/g/${gallery.slug}`;
                const title =
                  arabic && isIsmail
                    ? gallery.id.includes("boats")
                      ? "مراكب"
                      : "القاعة"
                    : gallery.title;
                return (
                  <li key={gallery.id}>
                    <Link
                      href={href}
                      className="group grid gap-6 py-8 transition-colors sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-center"
                    >
                      <div className="relative aspect-[5/4] overflow-hidden bg-white/5 sm:aspect-[4/3]">
                        {gallery.coverThumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- dynamic Storage URLs
                          <img
                            src={gallery.coverThumbUrl}
                            alt=""
                            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div
                            aria-hidden
                            className="size-full bg-[linear-gradient(160deg,oklch(0.22_0.02_70),oklch(0.16_0.02_240))]"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-serif text-2xl tracking-tight text-white sm:text-3xl">
                          {title}
                        </p>
                        <p className="mt-2 text-sm text-white/50">
                          {gallery.artworkCount === 1
                            ? arabic
                              ? "عمل واحد"
                              : "1 work"
                            : arabic
                              ? `${gallery.artworkCount} أعمال`
                              : `${gallery.artworkCount} works`}
                          <span className="mx-2 text-white/25">·</span>
                          <span className="tracking-wide text-white/60 group-hover:text-white">
                            {arabic ? "ادخل الغرفة" : "Enter the room"}
                          </span>
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {catalogueWorks.length > 0 ? (
          <section className="mt-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
                  {arabic ? "مختارات" : "Selected works"}
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/50">
                  {arabic
                    ? "قائمة كتالوج — العنوان والسنة والوسيط. القاعة الكاملة في التجوّل."
                    : "A catalogue list — title, year, medium. The full hang is in the walk."}
                </p>
              </div>
              {primaryWalk ? (
                <Link
                  href={`${primaryWalk}?view=list`}
                  className="text-[11px] tracking-[0.16em] text-white/45 uppercase transition-colors hover:text-white"
                >
                  {arabic ? "كل الأعمال" : "All works"}
                </Link>
              ) : null}
            </div>
            <ol className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {catalogueWorks.map((work, index) => {
                const href =
                  work.id.startsWith("boat-")
                    ? "/demo/ismail/boats?view=list"
                    : "/demo/ismail?view=list";
                const title = arabic ? work.titleAr : work.title;
                return (
                  <li key={work.id}>
                    <Link
                      href={href}
                      className="group grid grid-cols-[2.5rem_minmax(0,5.5rem)_1fr] items-center gap-4 py-5 sm:grid-cols-[3rem_minmax(0,7rem)_1fr_auto] sm:gap-6"
                    >
                      <span className="text-[11px] tracking-[0.14em] text-white/35 tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="relative aspect-[4/5] overflow-hidden bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element -- local JPEGs */}
                        <img
                          src={ismailTextureUrl(work.file)}
                          alt=""
                          className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif text-lg tracking-tight text-white/90 sm:text-xl">
                          {title}
                        </p>
                        <p className="mt-1 text-[12px] text-white/45">
                          {work.year} ·{" "}
                          {ismailMediumLocalized(work.medium, arabic)}
                        </p>
                      </div>
                      <span className="hidden text-[11px] tracking-[0.14em] text-white/35 uppercase transition-colors group-hover:text-white/70 sm:block">
                        {arabic ? "عرض" : "View"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {isIsmail ? (
          <section className="mt-20 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element -- local JPEG */}
              <img
                src={ismailTextureUrl("studio.jpg")}
                alt={
                  arabic
                    ? "إسماعيل الرفاعي في الاستوديو"
                    : "Ismail Rifai in the studio"
                }
                className="size-full object-cover object-[30%_40%]"
              />
            </div>
            <div>
              <p className="text-[11px] tracking-[0.2em] text-white/40 uppercase">
                {arabic ? "في الاستوديو" : "In the studio"}
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
                {arabic ? "الشارقة" : "Sharjah"}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
                {arabic
                  ? "أكثر من ثلاثة عشر عاماً في بيت عبيد الشامسي. الشجرة في الساحة، والمراكب، والطرق الليلية — كلها تُعلَّق هنا بمقياس المعرض."
                  : "More than thirteen years in Bait Obaid Al-Shamsi. The courtyard tree, the boats, the night roads — hung here at exhibition scale."}
              </p>
            </div>
          </section>
        ) : null}

        {profile.contact.allowInquiries ? (
          <section className="mt-20 max-w-xl border-t border-white/10 pt-12">
            <h2 className="font-serif text-3xl tracking-tight">
              {arabic ? "تواصل" : "Contact"}
            </h2>
            <p className="mt-2 text-sm text-white/55">
              {arabic
                ? "أرسل ملاحظة عن عمل أو معرض. تصل إلى صندوق الفنان."
                : "Send a note about a work or a show. It lands in the artist’s inbox."}
            </p>
            <div className="mt-6">
              <EnquiryForm
                galleryId={galleries[0]?.id ?? null}
                disabled={
                  !galleries[0] ||
                  galleries[0].id.startsWith("demo-ismail-rifai")
                }
              />
              {!galleries[0] ||
              galleries[0].id.startsWith("demo-ismail-rifai") ? (
                <p className="mt-3 text-xs text-white/40">
                  {arabic
                    ? "الاستفسارات تُفعَّل بعد نشر المعرض من الاستوديو."
                    : "Publish a gallery from the studio to enable enquiries."}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function pickIsmailCatalogue(): IsmailWork[] {
  const all = [...ISMAIL_HALL_WORKS, ...ISMAIL_BOAT_WORKS];
  const byId = new Map(all.map((work) => [work.id, work]));
  return ISMAIL_CATALOGUE_PICKS.map((id) => byId.get(id)).filter(
    (work): work is IsmailWork => Boolean(work),
  );
}

/** Any signed-in studio owner can edit their own public page — not Ismail-only. */
function ownsPublicProfile(
  account: UserAccount | null | undefined,
  profile: ArtistProfile,
): boolean {
  if (!account) return false;
  if (account.defaultWorkspaceId === profile.workspaceId) return true;
  return (
    profile.slug === ISMAIL_SLUG &&
    account.email.toLowerCase() === ISMAIL_EMAIL
  );
}
