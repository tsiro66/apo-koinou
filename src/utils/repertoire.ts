// Build-time helpers for the Ρεπερτόριο (repertoire) collection.
// A repertoire entry links a play (parastaseis entry) and carries the
// season-specific content; these helpers resolve and order that pairing
// for the listing and detail pages.
import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "../i18n/ui";

export type Play = CollectionEntry<"parastaseis">;
export type RepertoireEntry = CollectionEntry<"repertorio">;
export type RepertoireItem = { entry: RepertoireEntry; play: Play };

/**
 * Normalize a Pages CMS relation value ("glaros.md", "sub/glaros.md")
 * to the bare slug used by parastaseis entry ids.
 */
export function relationSlug(ref: string): string {
  return ref.split("/").pop()!.replace(/\.md$/, "");
}

function findPlay(plays: Play[], ref: string): Play | undefined {
  const slug = relationSlug(ref);
  return plays.find((p) => p.id === slug || p.data.slug === slug);
}

/**
 * Published repertoire entries with their linked play, ordered for the
 * listing: manual `order` first (smaller first), then newest play year.
 * Entries whose play is missing or draft are skipped with a warning, so
 * a bad CMS link can never break the build.
 */
export async function getRepertoire(): Promise<RepertoireItem[]> {
  const [entries, plays] = await Promise.all([
    getCollection("repertorio", ({ data }) => !data.draft),
    getCollection("parastaseis", ({ data }) => !data.draft),
  ]);
  return entries
    .map((entry) => ({ entry, play: findPlay(plays, entry.data.play) }))
    .filter((item): item is RepertoireItem => {
      if (item.play) return true;
      console.warn(
        `[repertorio] "${item.entry.id}" links to missing play "${item.entry.data.play}" — skipped.`,
      );
      return false;
    })
    .sort(
      (a, b) =>
        (a.entry.data.order ?? Number.POSITIVE_INFINITY) -
          (b.entry.data.order ?? Number.POSITIVE_INFINITY) ||
        b.play.data.year - a.play.data.year,
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
