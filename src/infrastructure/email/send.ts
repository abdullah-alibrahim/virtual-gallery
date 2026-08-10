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
