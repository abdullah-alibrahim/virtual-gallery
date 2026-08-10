/** Pure time-bucket helpers for rate limiting (no I/O). */

export function hourBucket(date = new Date()): string {
  return date.toISOString().slice(0, 13);
}

export function minuteBucket(date = new Date()): string {
  return date.toISOString().slice(0, 16);
}
