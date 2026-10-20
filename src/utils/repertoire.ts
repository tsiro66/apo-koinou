// Build-time helpers for the Ρεπερτόριο (repertoire) collection.
// Repertoire entries are standalone current-season plays (NOT parastaseis
// archive entries); this helper resolves and orders them for the listing
// and detail pages.
import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "../i18n/ui";

export type RepertoireEntry = CollectionEntry<"repertorio">;

/** One show (venue + date). Non-consecutive days = more rows. */
export type Show = { date: Date; venue: string };

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

/** Performance rows, soonest first. */
export function sortShows<P extends { date: Date }>(rows: P[]): P[] {
  return [...rows].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Human date for a show row: "14 Μαρτίου 2026" ("14 March 2026" in EN).
 */
export function formatShowDate(show: { date: Date }, locale: Locale): string {
  return full(show.date, locale === "en" ? "en-GB" : "el-GR");
}

/**
 * Human date range for a play's season performances, e.g.
 * "14 Μαρτίου 2026", "14–15 Μαρτίου 2026", "14 Μαρτίου – 2 Απριλίου 2026"
 * ("14 March – 2 April 2026" in EN). Used as the card eyebrow on
 * /repertorio in place of the production year. Undefined when the entry
 * has no performances yet (the card then falls back to the year).
 */
export function performanceRange(
  performances: { date: Date }[],
  locale: Locale,
): string | undefined {
  if (performances.length === 0) return undefined;
  const dates = performances
    .map((p) => p.date)
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
