// Build-time helpers for the Ρεπερτόριο (repertoire) collection.
// Repertoire entries are standalone current-season plays (NOT parastaseis
// archive entries); this helper resolves and orders them for the listing
// and detail pages.
import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "../i18n/ui";

export type RepertoireEntry = CollectionEntry<"repertorio">;

/**
 * One show run: a venue plus one or more dates (e.g. 15 & 16 Ιουνίου
 * share a row). Separate runs at the same venue = separate rows.
 */
export type Show = { venue: string; dates: Date[] };

/**
 * Published repertoire entries, ordered for the listing: manual `order`
 * first (smaller first), then newest production year.
 */
export async function getRepertoire(): Promise<RepertoireEntry[]> {
  const entries = await getCollection("repertorio", ({ data }) => !data.draft);
  return entries.sort(
    (a, b) =>
      (a.data.order ?? Number.POSITIVE_INFINITY) -
        (b.data.order ?? Number.POSITIVE_INFINITY) || b.data.year - a.data.year,
  );
}

const firstDate = (dates: Date[]): Date =>
  dates.reduce((min, d) => (d.getTime() < min.getTime() ? d : min), dates[0]);

/** Performance rows, soonest first (by a row's first date). */
export function sortShows<P extends Show>(rows: P[]): P[] {
  return [...rows].sort(
    (a, b) => firstDate(a.dates).getTime() - firstDate(b.dates).getTime(),
  );
}

/**
 * Human date for a show row, dates grouped per month: "15 & 16 Ιουνίου
 * 2026", "31 Μαΐου & 1 Ιουνίου 2026" ("15 & 16 June 2026" in EN).
 */
export function formatShowDate(show: Show, locale: Locale): string {
  const tag = locale === "en" ? "en-GB" : "el-GR";
  const sorted = [...show.dates].sort((a, b) => a.getTime() - b.getTime());

  // Cluster dates by calendar month (they are usually in the same one).
  const months: Date[][] = [];
  for (const d of sorted) {
    const last = months[months.length - 1];
    if (
      last &&
      last[0].getFullYear() === d.getFullYear() &&
      last[0].getMonth() === d.getMonth()
    ) {
      last.push(d);
    } else {
      months.push([d]);
    }
  }

  return months
    .map((days) => `${dayList(days, tag)} ${monthYear(days[0], tag)}`)
    .join(" – ");
}

/** "15", "15, 16 & 17" — days of one month joined for a show row. */
const dayList = (days: Date[], tag: string): string =>
  days
    .map((d) => new Intl.DateTimeFormat(tag, { day: "numeric" }).format(d))
    .join(", ")
    .replace(/, ([^,]*)$/, " & $1");

/** "Ιουνίου 2026" ("June 2026" in EN) — everything after the day in a
 * full date, so the month comes out in the right grammatical case. */
const monthYear = (d: Date, tag: string): string => {
  const parts = new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(d);
  const dayIndex = parts.findIndex((p) => p.type === "day");
  return parts
    .slice(dayIndex + 1)
    .map((p) => p.value)
    .join("")
    .trim();
};

/**
 * Human date range for a play's season performances, e.g.
 * "14 Μαρτίου 2026", "14–15 Μαρτίου 2026", "14 Μαρτίου – 2 Απριλίου 2026"
 * ("14 March – 2 April 2026" in EN). Used as the card eyebrow on
 * /repertorio in place of the production year. Undefined when the entry
 * has no performances yet (the card then falls back to the year).
 */
export function performanceRange(
  performances: Show[],
  locale: Locale,
): string | undefined {
  if (performances.length === 0) return undefined;
  const dates = performances
    .flatMap((p) => p.dates)
    .sort((a, b) => a.getTime() - b.getTime());
  const first = dates[0];
  const last = dates[dates.length - 1];
  const tag = locale === "en" ? "en-GB" : "el-GR";

  if (first.getTime() === last.getTime()) return full(first, tag);
  return range(first, last, tag);
}

const full = (d: Date, tag: string) =>
  new Intl.DateTimeFormat(tag, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);

/**
 * Human range between two dates, e.g. "13–25 Οκτωβρίου 2026",
 * "13 Οκτωβρίου – 2 Νοεμβρίου 2026", "13 Οκτωβρίου 2026 – 2 Μαρτίου 2027".
 */
function range(first: Date, last: Date, tag: string): string {
  const day = (d: Date) =>
    new Intl.DateTimeFormat(tag, { day: "numeric" }).format(d);
  const month = (d: Date) =>
    new Intl.DateTimeFormat(tag, { month: "long" }).format(d);

  const sameMonth =
    first.getFullYear() === last.getFullYear() &&
    first.getMonth() === last.getMonth();
  if (sameMonth) return `${day(first)}–${full(last, tag)}`;
  if (first.getFullYear() === last.getFullYear())
    return `${day(first)} ${month(first)} – ${full(last, tag)}`;
  return `${full(first, tag)} – ${full(last, tag)}`;
}
