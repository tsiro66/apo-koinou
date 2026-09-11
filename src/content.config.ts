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
    // Linked play: Pages CMS relation value — the play's slug (e.g.
    // "glaros"); also tolerates an entry path ("glaros.md").
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
// Συλλογή (/syllogi): photo sets shown ONLY on the Συλλογή page — never
// on the production page. One entry per play, linked via the `reference`
// field (stored as the play's slug); the filename derives from the chosen
// play ({fields.play}), so entries carry no slug of their own. A play
// without a dedicated set falls back to its regular photos (thumbnail +
// gallery), so the Συλλογή page is never empty. Managed by the client
// through Pages CMS.
// ───────────────────────────────────────────────────────────────────────────
const syllogiCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/syllogi" }),
  schema: ({ image }) =>
    z.object({
      play: z.string(),
      photos: z.array(image()).default([]),
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
// Ιστορία (long-form history page, Greek only)
// One Markdown file: src/content/istoria/istoria.md, rendered by
// sections/History.astro. Managed by the client through Pages CMS.
// ───────────────────────────────────────────────────────────────────────────
const istoriaCollection = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/istoria" }),
  schema: z.object({
    title: z.string(),
    seoDescription: z.string().optional(),
  }),
});

// ───────────────────────────────────────────────────────────────────────────
// Επικοινωνία (contact page, Greek only)
// One Markdown file: src/content/epikoinonia/epikoinonia.md — the lead
// text plus the contact details (email, phone, social links). Values
// fall back to the SITE constants in consts.ts when left empty.
// Managed by the client through Pages CMS.
// ───────────────────────────────────────────────────────────────────────────
const epikoinoniaCollection = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/epikoinonia" }),
  schema: z.object({
    // Intro paragraph shown under the heading.
    body: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    youtube: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
  }),
});

export const collections = {
  parastaseis: parastaseisCollection,
  repertorio: repertorioCollection,
  syllogi: syllogiCollection,
  nea: neaCollection,
  istoria: istoriaCollection,
  epikoinonia: epikoinoniaCollection,
};
