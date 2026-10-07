// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { readdir, readFile, rm } from "node:fs/promises";
import { extname, join } from "node:path";

/**
 * The content layer's image() helper always emits the ORIGINAL source file
 * of every collection image into dist/_astro/ — even when the site only
 * serves optimized derivatives (WebP variants, lightbox and og:image crops).
 * With 6000×4000 camera originals this used to ship ~485MB of dead weight
 * that no built page ever references.
 *
 * This integration walks the finished build, collects every /_astro/<file>
 * reference from the emitted HTML/CSS/JS/XML, and deletes unreferenced
 * image files. Referenced assets (all derivatives appear in HTML or CSS)
 * are never touched.
 */
const PRUNABLE_IMAGE_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
  ".tiff",
]);

function pruneUnreferencedOriginals() {
  /** @type {import('astro').AstroIntegration} */
  const integration = {
    name: "prune-unreferenced-originals",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const distDir = new URL(dir).pathname;
        const astroDir = join(distDir, "_astro");
        if (!(await readdir(astroDir).catch(() => undefined))) return;

        // Collect every "/_astro/<name>" string from all emitted text files
        // (HTML, CSS, JS — including chunks inside _astro, whose CSS url()
        // references fonts — sitemap XML, JSON): that is every way a hashed
        // asset can be referenced at runtime.
        const TEXT_EXTS = new Set([
          ".html",
          ".css",
          ".js",
          ".mjs",
          ".xml",
          ".json",
          ".txt",
          ".svg",
          ".webmanifest",
        ]);
        const referenced = new Set();
        // Parens are legal filename chars ("DSC00620 (1).jpg"); refs in
        // attributes/strings are quote-terminated, so capture ")" too and
        // trim only an UNbalanced trailing one ("url(...)" context).
        const REFERENCE_RE = /\/_astro\/[^"'\s<>\\]+/g;
        const walk = async (/** @type {string} */ directory) => {
          for (const entry of await readdir(directory, {
            withFileTypes: true,
          })) {
            const full = join(directory, entry.name);
            if (entry.isDirectory()) {
              await walk(full);
              continue;
            }
            if (!TEXT_EXTS.has(extname(entry.name).toLowerCase())) continue;
            const text = await readFile(full, "utf8").catch(() => undefined);
            if (text === undefined) continue;
            for (const match of text.matchAll(REFERENCE_RE)) {
              // Filenames may contain parentheses (e.g. "DSC00620 (1).jpg"),
              // but url(...) and srcset(...) contexts end in ")". Keep ")"
              // in the capture and trim only an UNBALANCED trailing one —
              // balanced pairs belong to the filename itself.
              let ref = match[0].slice("/_astro/".length);
              while (ref.endsWith(")")) {
                const opens = (ref.match(/\(/g) || []).length;
                const closes = (ref.match(/\)/g) || []).length;
                if (closes > opens) ref = ref.slice(0, -1);
                else break;
              }
              referenced.add(ref);
            }
          }
        };
        await walk(distDir);

        // URLs in HTML are percent-encoded; files on disk keep their raw
        // names (Unicode filenames are written verbatim by the fs, while
        // Astro emits percent-encoded URLs). Index both forms so encoded
        // Greek-named derivatives are never treated as unreferenced.
        const matchedNames = new Set();
        for (const ref of referenced) {
          matchedNames.add(ref);
          try {
            matchedNames.add(decodeURIComponent(ref));
          } catch {
            /* malformed escape — keep raw form only */
          }
        }
        const referencedNames = matchedNames;

        // Delete image files in _astro that nothing references.
        let count = 0;
        let bytes = 0;
        for (const name of await readdir(astroDir)) {
          if (!PRUNABLE_IMAGE_EXTS.has(extname(name).toLowerCase())) continue;
          if (referencedNames.has(name)) continue;
          const full = join(astroDir, name);
          bytes +=
            (await readFile(full).catch(() => undefined))?.byteLength ?? 0;
          await rm(full, { force: true });
          count += 1;
        }
        if (count > 0) {
          logger.info(
            `pruned ${count} unreferenced original image(s), reclaiming ${(bytes / 1e6).toFixed(1)}MB`,
          );
        }
      },
    },
  };
  return integration;
}

// https://astro.build/config
export default defineConfig({
  site: "https://apo-koinou.gr",
  integrations: [sitemap(), pruneUnreferencedOriginals()],
  // The programme page was renamed to repertoire (Ρεπερτόριο); keep old
  // links and sitemap entries working. Static builds emit meta-refresh
  // HTML pages for these.
  redirects: {
    "/programma": "/repertorio",
    "/en/programma": "/en/repertorio",
  },
  // Fetch internal pages before the click so ClientRouter swaps instantly.
  // All links are few and pages are small static HTML, so viewport is safe.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  i18n: {
    defaultLocale: "el",
    locales: ["el", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
