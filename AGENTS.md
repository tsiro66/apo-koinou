## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Code organization

- `src/pages/` files are thin wrappers; the page body lives in `src/sections/` (shared by both locales).
- When a section grows past ~200 lines, split its visual blocks into `src/components/<page>/` — one component per block, owning its markup, `<script>` and `<style>` (see `src/components/home/`).
- Non-trivial client-side scripts live in a co-located `.ts` file next to their component, rendered via `<script src="./Name.ts">`.
- All ClientRouter-aware scripts bind through the shared `onPageLoad()` helper (`src/scripts/onPageLoad.ts`) — never hand-roll `window.__xBound` guards or raw `astro:page-load` listeners.
- Shared build-time helpers live in `src/utils/` and `src/i18n/`; before adding a helper, check whether one already exists (e.g. `formatDate`, `getThumbnail`).
- Before shipping: `pnpm run format`, `pnpm run check`, `pnpm run build` (CI runs all three).

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
