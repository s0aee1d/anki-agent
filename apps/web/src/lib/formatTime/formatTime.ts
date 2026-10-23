/** Locale-aware time of day (e.g. "2:05:09 PM") for an epoch-millisecond timestamp. */
export function formatTime(epochMs: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { timeStyle: "medium" }).format(epochMs);
}
