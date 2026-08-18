/**
 * Returns a stable YYYY-MM-DD key in the configured IANA timezone.
 * formatToParts avoids locale-specific date ordering.
 */
export function dateKeyInTimezone(date: Date, timezone: string): string {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type === "year" || part.type === "month" || part.type === "day")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}
