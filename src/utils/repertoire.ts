// Build-time helpers for the Ρεπερτόριο (repertoire) collection.
// Repertoire entries are standalone current-season plays (NOT parastaseis
// archive entries); this helper resolves and orders them for the listing
// and detail pages.
import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import type { Locale } from "../i18n/ui";

export type RepertoireEntry = CollectionEntry<"repertorio">;

/**
 * Page-level texts for /repertorio, edited through the "Ρεπερτόριο —
 * Σελίδα" single-file entry in Pages CMS. Undefined fields fall back
 * to the SEASON constant / the hardcoded translations at the call
 * sites, so a blank entry never breaks anything.
 */
export async function getRepertoirePage(): Promise<{
  season?: string;
  intro?: string;
  emptyNote?: string;
}> {
  const entry = await getEntry("repertorioselida", "repertorioselida");
  return entry?.data ?? {};
}

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
  const day = (d: Date) =>
    new Intl.DateTimeFormat(tag, { day: "numeric" }).format(d);
  const month = (d: Date) =>
    new Intl.DateTimeFormat(tag, { month: "long" }).format(d);
  const full = (d: Date) =>
    new Intl.DateTimeFormat(tag, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);

  if (first.getTime() === last.getTime()) return full(first);
  const sameMonth =
    first.getFullYear() === last.getFullYear() &&
    first.getMonth() === last.getMonth();
  if (sameMonth) return `${day(first)}–${full(last)}`;
  if (first.getFullYear() === last.getFullYear())
    return `${day(first)} ${month(first)} – ${full(last)}`;
  return `${full(first)} – ${full(last)}`;
}
