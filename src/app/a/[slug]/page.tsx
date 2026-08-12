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
  ISMAIL_SECTIONS,
  ISMAIL_SLUG,
  getIsmailRifaiStaticProfile,
  ismailSectionOf,
  ismailTextureUrl,
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
    <main className="relative min-h-dvh overflow-x-hidden bg-[oklch(0.13_0.012_70)] text-[oklch(0.96_0.01_95)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative">
        <div className="relative h-[38vh] min-h-[14rem] w-full overflow-hidden sm:h-[46vh] lg:h-[52vh]">
          {profile.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local / Storage URLs
            <img
              src={profile.coverUrl}
              alt=""
              className="size-full scale-[1.02] object-cover object-[center_62%]"
            />
          ) : (
            <div
              aria-hidden
              className="size-full bg-[radial-gradient(ellipse_at_20%_0%,oklch(0.28_0.04_55_/_0.55),transparent_55%),radial-gradient(ellipse_at_90%_20%,oklch(0.22_0.03_240_/_0.35),transparent_45%),linear-gradient(160deg,oklch(0.18_0.02_70),oklch(0.12_0.02_240))]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.13_0.012_70)] via-[oklch(0.13_0.012_70_/_0.55)] to-black/25" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="font-serif text-sm tracking-tight text-white/70 transition-colors hover:text-white"
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
        </div>

        <div className="relative mx-auto -mt-16 w-full max-w-6xl px-4 pb-16 sm:-mt-20 sm:px-6 md:pb-24 lg:px-8">
          <header className="page-enter flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local / Storage URLs
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="size-32 shrink-0 rounded-sm border border-white/25 object-cover object-center shadow-[0_24px_60px_-28px_black] sm:size-40"
                />
              ) : null}
              <div className="max-w-2xl pb-1">
                <p className="text-[11px] tracking-[0.22em] text-white/45 uppercase">
                  {arabic ? "فنان" : "Artist"}
                  {location ? ` · ${location}` : null}
                </p>
                <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl md:text-6xl">
                  {displayName}
                </h1>
                {bio ? (
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
                    {bio}
                  </p>
                ) : null}
                <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[11px] tracking-[0.14em] text-white/45 uppercase">
                  <div>
                    <dt className="sr-only">
                      {arabic ? "المعارض" : "Exhibitions"}
                    </dt>
                    <dd>
                      {galleries.length}{" "}
                      {arabic
                        ? galleries.length === 1
                          ? "معرض"
                          : "معارض"
                        : galleries.length === 1
                          ? "exhibition"
                          : "exhibitions"}
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">{arabic ? "الأعمال" : "Works"}</dt>
                    <dd>
                      {workCount}{" "}
                      {arabic
                        ? workCount === 1
                          ? "عمل"
                          : "أعمال"
                        : workCount === 1
                          ? "work"
                          : "works"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 stagger-fade stagger-fade-1 lg:items-end">
              <SocialLinks
                links={socialLinks}
                tone="onDark"
                layout="pills"
                label={arabic ? "التواصل الاجتماعي" : "Social links"}
              />
              {isIsmail ? (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/demo/ismail"
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "border-white/20 bg-white text-[oklch(0.16_0.02_70)] hover:bg-white/90",
                    )}
                  >
                    {arabic ? "ادخل القاعة" : "Enter the hall"}
                  </Link>
                  <Link
                    href="/demo/ismail/boats"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                      "border-white/20 bg-white/10 text-white hover:bg-white/15",
                    )}
                  >
                    {arabic ? "مراكب" : "Marakeb"}
                  </Link>
                </div>
              ) : null}
            </div>
          </header>

          {statement ? (
            <section className="mt-14 max-w-2xl border-s border-[oklch(0.72_0.05_78_/_0.45)] ps-5 section-rise">
              <h2 className="text-[11px] tracking-[0.2em] text-white/40 uppercase">
                {arabic ? "بيان" : "Statement"}
              </h2>
              <p className="mt-3 font-serif text-lg leading-relaxed text-white/82 sm:text-xl">
                {statement}
              </p>
            </section>
          ) : null}

          <section className="mt-16 flex flex-col gap-6">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-serif text-3xl tracking-tight">
                {arabic ? "المعارض" : "Exhibitions"}
              </h2>
            </div>
            {galleries.length === 0 ? (
              <div className="relative flex flex-col items-center gap-4 overflow-hidden border border-dashed border-white/15 px-6 py-16 text-center">
                <p className="font-serif text-xl tracking-tight text-white/85">
                  {arabic ? "لا معارض منشورة بعد" : "No published galleries yet"}
                </p>
                <Link
                  href="/demo/pro"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "border-white/20 bg-white/10 text-white hover:bg-white/15",
                  )}
                >
                  {arabic ? "جرّب قاعة البرو" : "Try the Pro hall"}
                </Link>
              </div>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2">
                {galleries.map((gallery, index) => (
                  <li
                    key={gallery.id}
                    className={cn(
                      "stagger-fade",
                      index === 1 && "stagger-fade-1",
                    )}
                  >
                    <Link
                      href={gallery.href ?? `/g/${gallery.slug}`}
                      className="group relative block overflow-hidden border border-white/10 bg-white/[0.03] transition-colors hover:border-white/30"
                    >
                      <div className="relative aspect-[16/9] w-full overflow-hidden">
                        {gallery.coverThumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- dynamic Storage URLs
                          <img
                            src={gallery.coverThumbUrl}
                            alt=""
                            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div
                            aria-hidden
                            className="size-full bg-[linear-gradient(160deg,oklch(0.22_0.02_70),oklch(0.16_0.02_240))]"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <p className="font-serif text-2xl tracking-tight text-white">
                            {arabic && isIsmail
                              ? gallery.id.includes("boats")
                                ? "مراكب"
                                : "القاعة"
                              : gallery.title}
                          </p>
                          <p className="mt-1 text-[11px] tracking-[0.14em] text-white/65 uppercase">
                            {gallery.artworkCount === 1
                              ? arabic
                                ? "عمل واحد"
                                : "1 work"
                              : arabic
                                ? `${gallery.artworkCount} أعمال`
                                : `${gallery.artworkCount} works`}
                            {" · "}
                            {arabic ? "ادخل الغرفة" : "Enter the room"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {isIsmail ? (
            <section className="mt-20 flex flex-col gap-12">
              <div>
                <p className="text-[11px] tracking-[0.2em] text-white/40 uppercase">
                  {arabic ? "قاعة واحدة · أربعة أقسام" : "One hall · four sections"}
                </p>
                <h2 className="mt-2 font-serif text-3xl tracking-tight">
                  {arabic ? "أقسام القاعة" : "Hall sections"}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
                  {arabic
                    ? "صحن للطرق والأشكال، جناح شرقي للمراكب، وجناح غربي لشجرة بيت الشامسي."
                    : "Nave for roads and figures, east wing for Marakeb, west wing for the Bait Al Shamsi tree."}
                </p>
              </div>
              {ISMAIL_SECTIONS.map((section, sectionIndex) => {
                const works = [
                  ...ISMAIL_HALL_WORKS,
                  ...ISMAIL_BOAT_WORKS,
                ].filter((work) => ismailSectionOf(work) === section.id);
                if (works.length === 0) return null;
                const href =
                  section.id === "marakeb"
                    ? "/demo/ismail/boats?view=list"
                    : "/demo/ismail?view=list";
                return (
                  <div key={section.id} className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] tracking-[0.2em] text-white/35 uppercase">
                          {String(sectionIndex + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-1 font-serif text-2xl tracking-tight">
                          {arabic ? section.titleAr : section.title}
                        </h3>
                        <p className="mt-1 max-w-md text-sm text-white/50">
                          {arabic ? section.blurbAr : section.blurb}
                        </p>
                      </div>
                      <Link
                        href={
                          section.id === "marakeb"
                            ? "/demo/ismail/boats"
                            : "/demo/ismail"
                        }
                        className="text-[11px] tracking-[0.16em] text-white/50 uppercase transition-colors hover:text-white"
                      >
                        {arabic ? "تجوّل في القسم" : "Walk this section"}
                      </Link>
                    </div>
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {works.map((work) => (
                        <li key={work.id}>
                          <Link href={href} className="group block">
                            <div className="relative aspect-[4/5] overflow-hidden border border-white/10">
                              {/* eslint-disable-next-line @next/next/no-img-element -- local JPEGs */}
                              <img
                                src={ismailTextureUrl(work.file)}
                                alt={arabic ? work.titleAr : work.title}
                                className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                              <p className="absolute inset-x-0 bottom-0 translate-y-1 px-3 pb-3 font-serif text-sm text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                {arabic ? work.titleAr : work.title}
                              </p>
                            </div>
                            <p className="mt-2 font-serif text-sm tracking-tight text-white/80">
                              {arabic ? work.titleAr : work.title}
                            </p>
                            <p className="text-[11px] text-white/40">
                              {work.year} · {work.medium}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
          ) : null}

          {isIsmail ? (
            <section className="mt-20 grid gap-8 overflow-hidden border border-white/10 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[22rem]">
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
              <div className="flex flex-col justify-center px-6 py-8 sm:px-8">
                <p className="text-[11px] tracking-[0.2em] text-white/40 uppercase">
                  {arabic ? "في الاستوديو" : "In the studio"}
                </p>
                <h2 className="mt-3 font-serif text-3xl tracking-tight">
                  {arabic ? "الشارقة" : "Sharjah"}
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
                  {arabic
                    ? "أكثر من ثلاثة عشر عاماً في بيت عبيد الشامسي. الشجرة في الساحة، والمراكب، والطرق الليلية — كلها تُعلَّق هنا بمقياس المعرض."
                    : "More than thirteen years in Bait Obaid Al-Shamsi. The courtyard tree, the boats, the night roads — hung here at exhibition scale."}
                </p>
              </div>
            </section>
          ) : null}

          {profile.contact.allowInquiries ? (
            <section className="mt-20 max-w-xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
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
      </div>
    </main>
  );
}

/** Any signed-in studio owner can edit their own public page — not Ismail-only. */
function ownsPublicProfile(
  account: UserAccount | null | undefined,
  profile: ArtistProfile,
): boolean {
  if (!account) return false;
  if (account.defaultWorkspaceId === profile.workspaceId) return true;
  // Seeded Ismail demo: static `/a/ismail-rifai` may not share the Auth workspace id.
  return (
    profile.slug === ISMAIL_SLUG &&
    account.email.toLowerCase() === ISMAIL_EMAIL
  );
}
