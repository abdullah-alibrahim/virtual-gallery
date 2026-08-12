/**
 * Outbound transactional email. Uses Resend when RESEND_API_KEY is set;
 * otherwise logs (safe for emulators / local launch prep).
 */

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: boolean; mode: "resend" | "log" }> {
  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "Virtual Gallery <onboarding@virtual.gallery>";

  if (!key) {
    console.info("[email:log]", {
      to: input.to,
      subject: input.subject,
      text: input.text.slice(0, 200),
    });
    return { ok: true, mode: "log" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<p>${input.text.replace(/\n/g, "<br/>")}</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[email:resend] failed", body);
    return { ok: false, mode: "resend" };
  }

  return { ok: true, mode: "resend" };
}

export async function sendWelcomeEmail(input: {
  to: string;
  displayName: string;
  profileUrl: string;
}): Promise<void> {
  await sendTransactionalEmail({
    to: input.to,
    subject: "Welcome to Virtual Gallery",
    text: `Hi ${input.displayName},\n\nYour studio is ready. Publish a walkable show and share it with collectors.\n\nYour public profile: ${input.profileUrl}\n\n— Virtual Gallery`,
  });
}

export async function sendEnquiryToArtist(input: {
  to: string;
  artistName: string;
  collectorName: string;
  collectorEmail: string;
  message: string;
  galleryTitle: string;
  artworkTitle: string | null;
  inboxUrl: string;
}): Promise<void> {
  const about = input.artworkTitle
    ? ` about “${input.artworkTitle}”`
    : "";
  await sendTransactionalEmail({
    to: input.to,
    subject: `New enquiry — ${input.galleryTitle}`,
    text: `Hi ${input.artistName},\n\n${input.collectorName} (${input.collectorEmail}) wrote${about} from “${input.galleryTitle}”:\n\n${input.message}\n\nReply in your inbox: ${input.inboxUrl}\n\n— Virtual Gallery\n\n---\n\nمرحباً ${input.artistName}،\n\n${input.collectorName} (${input.collectorEmail}) أرسل استفساراً${about} من «${input.galleryTitle}»:\n\n${input.message}\n\nالرد من صندوق الوارد: ${input.inboxUrl}\n\n— Virtual Gallery`,
  });
}

export async function sendEnquiryConfirmation(input: {
  to: string;
  collectorName: string;
  artistName: string;
  galleryTitle: string;
}): Promise<void> {
  await sendTransactionalEmail({
    to: input.to,
    subject: `We received your enquiry — ${input.galleryTitle}`,
    text: `Hi ${input.collectorName},\n\nThanks for writing to ${input.artistName} about “${input.galleryTitle}”. They’ll see your message in their studio inbox.\n\n— Virtual Gallery\n\n---\n\nمرحباً ${input.collectorName}،\n\nشكراً لرسالتك إلى ${input.artistName} حول «${input.galleryTitle}». سيصلهم الاستفسار في صندوق وارد الاستوديو.\n\n— Virtual Gallery`,
  });
}

export async function sendGalleryPublishedEmail(input: {
  to: string;
  artistName: string;
  galleryTitle: string;
  viewerUrl: string;
  firstPublish: boolean;
}): Promise<void> {
  const subject = input.firstPublish
    ? `Your first exhibition is live — ${input.galleryTitle}`
    : `Your gallery is live — ${input.galleryTitle}`;
  const lead = input.firstPublish
    ? "Your first walkable show is published."
    : "Your gallery update is live.";
  const leadAr = input.firstPublish
    ? "عُرضك الأول القابل للتجوّل أصبح منشوراً."
    : "تحديث معرضك أصبح مباشراً.";
  await sendTransactionalEmail({
    to: input.to,
    subject,
    text: `Hi ${input.artistName},\n\n${lead}\n\nShare this link with collectors:\n${input.viewerUrl}\n\n— Virtual Gallery\n\n---\n\nمرحباً ${input.artistName}،\n\n${leadAr}\n\nشارك هذا الرابط مع الجامعين:\n${input.viewerUrl}\n\n— Virtual Gallery`,
  });
}

export async function sendWeeklyDigestEmail(input: {
  to: string;
  artistName: string;
  analyticsUrl: string;
  views: number;
  uniqueVisitors: number;
  leads: number;
  galleryCount: number;
}): Promise<void> {
  await sendTransactionalEmail({
    to: input.to,
    subject: `Your week in the gallery — ${input.views} views`,
    text: `Hi ${input.artistName},\n\nLast 7 days across ${input.galleryCount} published show(s):\n${input.views} views · ${input.uniqueVisitors} unique visitors · ${input.leads} enquiries\n\nOpen analytics: ${input.analyticsUrl}\n\n— Virtual Gallery\n\n---\n\nمرحباً ${input.artistName}،\n\nآخر 7 أيام عبر ${input.galleryCount} عرض منشور:\n${input.views} مشاهدة · ${input.uniqueVisitors} زائر فريد · ${input.leads} استفسار\n\nالتحليلات: ${input.analyticsUrl}\n\n— Virtual Gallery`,
  });
}
