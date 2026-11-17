import { defineCollection, z } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import type { ZodObject, ZodRawShape } from "astro/zod";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

// ───────────────────────────────────────────────────────────────────────────
// Παραστάσεις (Productions)
// One Markdown file per play under src/content/parastaseis/<slug>.md
// Image frontmatter fields use the `image()` schema helper, which resolves
// paths relative to the entry file and feeds them through astro:assets for
// build-time optimization (responsive webp/avif, blur placeholders).
// ───────────────────────────────────────────────────────────────────────────
/**
 * List-of-rows fields whose editor is Pages CMS. When an editor adds a list
 * item and clears its fields (or never fills them in), the CMS commits a
 * YAML row with missing/empty values (e.g. `- {}` or `- { name: "" }`),
 * which would fail strict validation and break every build. Such rows are
 * abandoned edits, so we drop any row whose required keys are missing or
 * empty *before* schema validation (z.preprocess) instead of failing.
 *
 * Rows that are partially filled but genuinely incomplete are likewise
 * dropped — a nameless crew member has no usable identity to render.
 * Empty list values (e.g. a performance row with no dates yet) count as
 * missing too.
 */
const cmsRows = <
  T extends [string, ...string[]],
  S extends ZodObject<ZodRawShape>,
>(
  requiredKeys: T,
  schema: S,
) =>
  z.preprocess(
    (val) =>
      Array.isArray(val)
        ? val.filter(
            (row) =>
              row !== null &&
              typeof row === "object" &&
              requiredKeys.every((key) => {
                const v = (row as Record<string, unknown>)[key];
                if (Array.isArray(v)) return v.length > 0;
                return v !== undefined && v !== null && v !== "";
              }),
          )
        : val,
    z.array(schema).default([]),
  );

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
      cast: cmsRows(
        ["name"],
        z.object({ name: z.string(), role: z.string().optional() }),
      ),
      crew: cmsRows(
        ["role", "name"],
        z.object({ role: z.string(), name: z.string() }),
      ),
      // Τόπος & χρόνος: one row per venue run — each row holds one or
      // more dates (15 & 16 June share a row); a different venue or a
      // non-consecutive run is a separate row.
      performances: cmsRows(
        ["venue", "dates"],
        z.object({
          venue: z.string(),
          dates: z.array(z.coerce.date()),
        }),
      ),
      summary: z.string().optional(),
      // Bunny Stream video ID (GUID) for the full recorded performance.
      videoId: z.string().optional(),
      youtubeTrailer: z.string().optional(),
      thumbnail: image().optional(),
      gallery: z.array(image()).default([]),
      // Πρόσκληση (front/back scans) and Πρόγραμμα scans for the
      // production page (Υλικό sections).
      invitation: z.array(image()).default([]),
      poster: image().optional(),
      program: z.array(image()).default([]),
      // Κριτικές: review quotes with source attribution. `title` and `date`
      // are optional pro fields; real dates are Greek prose ("8 Μαΐου 2026"),
      // so `date` stays a string. Required keys stay ["source", "text"] so
      // old-format rows keep validating.
      kritikes: cmsRows(
        ["source", "text"],
        z.object({
          source: z.string(),
          text: z.string(),
          title: z.string().optional(),
          date: z.string().optional(),
        }),
      ),
      // Συνεντεύξεις: interviews about/around the production — videos
      // (YouTube link/ID or Bunny Stream GUID/embed link; the two are
      // auto-detected at render time via utils/media) and voice
      // recordings. Two lists (not one typed list) so each keeps its own
      // required key and CMS editors only ever see the fields relevant
      // to what they are adding.
      syneunteixeisVideo: cmsRows(
        ["video"],
        z.object({
          video: z.string(),
          title: z.string().optional(),
          date: z.string().optional(),
        }),
      ),
      // Voice recordings: audio lives in public/syneunteixeis (no
      // astro:assets processing for mp3s) — the frontmatter value is a
      // site-absolute path like /syneunteixeis/<slug>/file.mp3.
      syneunteixeisAudio: cmsRows(
        ["audio"],
        z.object({
          audio: z.string(),
          title: z.string().optional(),
          date: z.string().optional(),
        }),
      ),
      // Press clippings (Στον Τύπο): interviews, news articles etc.
      // about the production, uploaded as PDFs — files live in
      // public/parastaseis-docs (no astro:assets processing for PDFs),
      // so the frontmatter value is a site-absolute path like
      // /parastaseis-docs/<slug>/article.pdf.
      dimosieumata: cmsRows(
        ["file"],
        z.object({
          file: z.string(),
          title: z.string().optional(),
          source: z.string().optional(),
          date: z.string().optional(),
        }),
      ),
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
// One standalone entry per play currently in the season's repertoire.
// Repertoire plays are deliberately NOT in the parastaseis archive —
// they are on stage now — so each entry carries everything the listing
// and detail pages show: title, writer, own thumbnail, text, crew and
// this season's show dates. When a run ends, a parastaseis entry is
// created separately for the archive.
// ───────────────────────────────────────────────────────────────────────────
const repertorioCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/repertorio" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Filename derives from the slug ({fields.slug} in Pages CMS).
      slug: z.string().optional(),
      year: z.number().int(),
      writer: z.string().optional(),
      // Short blurb for the listing and meta description.
      summary: z.string().optional(),
      thumbnail: image().optional(),
      // Συντελεστές: role + name rows, same shape as parastaseis.
      crew: cmsRows(
        ["role", "name"],
        z.object({ role: z.string(), name: z.string() }),
      ),
      // This season's shows — kept separate from the play's historical
      // `performances` so the archive page stays purely historical.
      // One row per venue run; each row's `dates` list covers days that
      // belong together (15 & 16 June in one row).
      performances: cmsRows(
        ["venue", "dates"],
        z.object({
          venue: z.string(),
          dates: z.array(z.coerce.date()),
        }),
      ),
      // Manual listing order on /repertorio (smaller first). Falls back
      // to the production year, newest first.
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
/**
 * Splits the single istoria.md source into two entries at the second
 * `## ` heading, so sections/History.astro can render the interviews block
 * *inside* the article — after the intro section ("Ποιοι είμαστε"), before
 * the rest — while the client keeps editing one file in the CMS. Astro's
 * render() compiles an entry's markdown once (keyed by id), so the page
 * cannot slice an already-rendered body; emitting two entries instead lets
 * each chunk go through the standard markdown pipeline (prose, heading
 * slugs, astro:assets) exactly like a glob-loaded entry.
 */
const istoriaSplitLoader = (): Loader => ({
  name: "istoria-split",
  async load({ store, watcher, parseData, renderMarkdown, generateDigest }) {
    const fileUrl = new URL("./content/istoria/istoria.md", import.meta.url);
    const filePath = fileURLToPath(fileUrl);
    // The data store requires paths relative to the project root.
    const relPath = "src/content/istoria/istoria.md";
    watcher?.add(filePath); // re-run the loader on change in dev
    const raw = fs.readFileSync(filePath, "utf8");

    // Frontmatter stays with both entries (the page consumes the head
    // entry's data; the tail entry keeps it for schema uniformity).
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    const rawData = (fm ? parseYaml(fm[1]) : {}) as Record<string, unknown>;
    const body = fm ? raw.slice(fm[0].length) : raw;

    const h2s = [...body.matchAll(/^## /gm)];
    const splitAt =
      h2s.length >= 2 ? (h2s[1].index ?? body.length) : body.length;
    const headBody = body.slice(0, splitAt);
    const tailBody = body.slice(splitAt);

    // Render each chunk through the standard markdown pipeline (same
    // slugs/prose/astro:assets handling as glob-loaded entries) and
    // validate the frontmatter through the collection schema.
    const data = await parseData({
      id: "istoria-head",
      data: rawData,
      filePath: relPath,
    });
    const renderedHead = await renderMarkdown(headBody, { fileURL: fileUrl });
    const renderedTail =
      tailBody.trim() !== ""
        ? await renderMarkdown(tailBody, { fileURL: fileUrl })
        : undefined;

    store.set({
      id: "istoria-head",
      data,
      body: headBody,
      filePath: relPath,
      digest: generateDigest(raw),
      rendered: renderedHead,
      assetImports: renderedHead.metadata?.imagePaths,
    });
    store.set({
      id: "istoria-tail",
      data,
      body: tailBody,
      filePath: relPath,
      digest: generateDigest(raw),
      ...(renderedTail
        ? {
            rendered: renderedTail,
            assetImports: renderedTail.metadata?.imagePaths,
          }
        : {}),
    });
  },
});

const istoriaCollection = defineCollection({
  loader: istoriaSplitLoader(),
  schema: z.object({
    title: z.string(),
    seoDescription: z.string().optional(),
    // Συνεντεύξεις/βίντεο γύρω από την ομάδα — Bunny Stream GUID/embed
    // link ή YouTube link/ID (auto-detected at render time via
    // utils/media), rendered by sections/History.astro.
    syneunteixeisVideo: cmsRows(
      ["video"],
      z.object({
        video: z.string(),
        title: z.string().optional(),
        date: z.string().optional(),
      }),
    ),
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
