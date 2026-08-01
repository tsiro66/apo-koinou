import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ───────────────────────────────────────────────────────────────────────────
// Παραστάσεις (Productions)
// One Markdown file per play under src/content/parastaseis/<slug>.md
// Image frontmatter fields use the `image()` schema helper, which resolves
// paths relative to the entry file and feeds them through astro:assets for
// build-time optimization (responsive webp/avif, blur placeholders).
// ───────────────────────────────────────────────────────────────────────────
const parastaseisCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/parastaseis' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string().optional(),
      year: z.number().int(),
      // Subtitle under the title, e.g. "Κεντρική Σκηνή (Παιδική Σκηνή)".
      stage: z.string().optional(),
      premiereDate: z.coerce.date().optional(),
      director: z.string().optional(),
      writer: z.string().optional(),
      duration: z.string().optional(),
      genre: z.string().optional(),
      language: z.string().default('Ελληνικά'),
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
      // Cloudflare Stream video id for the full recorded performance.
      streamId: z.string().optional(),
      youtubeTrailer: z.string().optional(),
      thumbnail: image().optional(),
      gallery: z.array(image()).default([]),
      // Αφίσα (poster) and Πρόγραμμα scans for the Υλικό page.
      poster: image().optional(),
      program: z.array(image()).default([]),
      seoDescription: z.string().optional(),
      seoImage: image().optional(),
      draft: z.boolean().default(false),
      order: z.number().optional(),
    }),
});

// ───────────────────────────────────────────────────────────────────────────
// Νέα (Announcements / news posts)
// ───────────────────────────────────────────────────────────────────────────
const neaCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/nea' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string().optional(),
      publishDate: z.coerce.date(),
      excerpt: z.string().optional(),
      thumbnail: image().optional(),
      seoDescription: z.string().optional(),
      seoImage: image().optional(),
      draft: z.boolean().default(false),
    }),
});

// ───────────────────────────────────────────────────────────────────────────
// Συντελεστές (Contributors: actors, directors, technicians)
// ───────────────────────────────────────────────────────────────────────────
const synteleistesCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/synteleistes' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      slug: z.string().optional(),
      role: z.string().optional(),
      bio: z.string().optional(),
      photo: image().optional(),
      order: z.number().optional(),
    }),
});

export const collections = {
  parastaseis: parastaseisCollection,
  nea: neaCollection,
  synteleistes: synteleistesCollection,
};