/**
 * Studio custom hostnames — DNS labels only (no protocol, no path).
 */

const HOST_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export function normalizeHostname(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function isValidCustomHostname(host: string): boolean {
  if (!HOST_PATTERN.test(host)) return false;
  if (host.endsWith(".localhost") || host === "localhost") return false;
  return true;
}

export function cnameTargetFromSiteUrl(siteUrl: string): string {
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return "virtual-gallery-zeta.vercel.app";
  }
}

export function isPrimarySiteHost(host: string, siteUrl: string): boolean {
  const primary = cnameTargetFromSiteUrl(siteUrl);
  return host === primary || host.endsWith(".vercel.app");
}
