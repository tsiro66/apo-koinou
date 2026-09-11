import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// ───────────────────────────────────────────────────────────────────────────
// Παραστάσεις (Productions)
// One Markdown file per play under src/content/parastaseis/<slug>.md
// Image frontmatter fields use the `image()` schema helper, which resolves
// paths relative to the entry file and feeds them through astro:assets for
// build-time optimization (responsive webp/avif, blur placeholders).
// ───────────────────────────────────────────────────────────────────────────
const parastaseisCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/parastaseis" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string().optional(),
      year: z.number().int(),
      premiereDate: z.coerce.date().optional(),
      director: z.string().optional(),
      writer: z.string().optional(),
      duration: z.string().optional(),
      genre: z.string().optional(),
      language: z.string().default("Ελληνικά"),
      // Διανομή: actor name + optional role.
      cast: z
        .array(z.object({ name: z.string(), role: z.string().optional() }))
        .default([]),
      crew: z
        .array(z.object({ role: z.string(), name: z.string() }))
        .default([]),
      // Τόπος & χρόνος: one row per performance.
      performances: z
        .array(z.object({ date: z.coerce.date(), venue: z.string() }))
        .default([]),
      summary: z.string().optional(),
      // Bunny Stream video ID (GUID) for the full recorded performance.
      videoId: z.string().optional(),
      youtubeTrailer: z.string().optional(),
      thumbnail: image().optional(),
      gallery: z.array(image()).default([]),
      // Συλλογή (/syllogi): photos shown ONLY on the Συλλογή page —
      // never on the production page. A play without syllogiPhotos
      // falls back to its regular photos (thumbnail + gallery) there,
      // so the Συλλογή page is never empty. Managed by the client
      // through Pages CMS.
      syllogiPhotos: z.array(image()).default([]),
      // Πρόσκληση (front/back scans) and Πρόγραμμα scans for the Υλικό page.
      invitation: z.array(image()).default([]),
      poster: image().optional(),
      program: z.array(image()).default([]),
      // Κριτικές: review quotes with source attribution.
      kritikes: z
        .array(z.object({ source: z.string(), text: z.string() }))
        .default([]),
      seoDescription: z.string().optional(),
      seoImage: image().optional(),
      draft: z.boolean().default(false),
      // Editors pick the front-page hero carousel slides with this flag
      // (Home.astro falls back to the five most recent plays if none).
      carousel: z.boolean().default(false),
    }),
});

// ───────────────────────────────────────────────────────────────────────────
// Ρεπερτόριο (current-season repertoire)
// One entry per play currently in the season's repertoire. The entry links
// to a parastaseis document (Pages CMS `relation` picker, stored as the
// entry path, e.g. "glaros.md") and carries only the season-specific
// content: body text, summary and upcoming show dates. Title, year,
// thumbnail and crew come from the linked play at build time
// (see src/utils/repertoire.ts).
// ───────────────────────────────────────────────────────────────────────────
const repertorioCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/repertorio" }),
  schema: z.object({
    // Linked play: Pages CMS relation value ("glaros.md" or bare slug).
    play: z.string(),
    // Short blurb; falls back to the play's archive summary when omitted.
    summary: z.string().optional(),
    // This season's shows — kept separate from the play's historical
    // `performances` so the archive page stays purely historical.
    performances: z
      .array(z.object({ date: z.coerce.date(), venue: z.string() }))
      .default([]),
    // Manual listing order on /repertorio (smaller first). Falls back to
    // the play's year, newest first.
    order: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

// ───────────────────────────────────────────────────────────────────────────
// Νέα (Announcements / news posts)
// Minimal entry: title + image + markdown body. Pages CMS auto-fills
// publishDate with today's date on creation.
// ───────────────────────────────────────────────────────────────────────────
const neaCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/nea" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string().optional(),
      publishDate: z.coerce.date(),
      thumbnail: image().optional(),
    }),
});

// ───────────────────────────────────────────────────────────────────────────
// Σελίδες (long-form static pages, one Markdown file per locale)
// src/content/selides/<locale>/<page>.md — rendered by the matching section
// (e.g. sections/History.astro renders selides/<locale>/istoria).
// ───────────────────────────────────────────────────────────────────────────
const selidesCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/selides" }),
  schema: z.object({
    title: z.string(),
    seoDescription: z.string().optional(),
  }),
});

export const collections = {
  parastaseis: parastaseisCollection,
  repertorio: repertorioCollection,
  nea: neaCollection,
  selides: selidesCollection,
};
