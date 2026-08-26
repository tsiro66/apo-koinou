// Single source of truth for site-wide constants.
// Translatable fields are keyed per locale; UI strings live in src/i18n/ui.ts.
import type { Locale } from './i18n/ui';

export const SITE = {
  // Brand name kept identical in both locales (proper noun).
  site: 'https://apo-koinou.gr',
  email: 'info@apo-koinou.gr',
  social: {
    youtube: 'https://www.youtube.com/@θεατρικήομάδααπόκοινού',
    facebook: 'https://www.facebook.com/theatrikiomadaapokoinouelmeach?locale=el_GR',
    instagram: '',
  },
} as const;

// Current season label, shown on the programme page and homepage band.
export const SEASON = '2025–2026';

// Bunny Stream library ID — shared by every video embed URL. Individual
// video IDs live in each play's `videoId` frontmatter field.
// Find it in the Bunny dashboard → Stream → your library → Settings → API
// ("Library ID", numeric).
export const BUNNY_LIBRARY_ID = '730197'; // TODO: replace with your Bunny Stream library ID

// Per-locale brand strings. Keys mirror src/i18n/ui.ts entries.
export const BRAND: Record<Locale, { title: string; tagline: string; description: string }> = {
  el: {
    title: 'Από Κοινού',
    tagline:
      'Ψηφιακό αρχείο της θεατρικής ομάδας «Από Κοινού». Παραστάσεις, βίντεο, φωτογραφία, πρόγραμμα, ιστορία και τρόποι επικοινωνίας.',
    description:
      'Ψηφιακό αρχείο της θεατρικής ομάδας «Από Κοινού». Παραστάσεις, βίντεο, φωτογραφία, πρόγραμμα, ιστορία και τρόποι επικοινωνίας.',
  },
  en: {
    title: 'Από Κοινού',
    tagline:
      'Digital archive of the «Από Κοινού» theater group. Productions, video, photography, programme, history, and contact.',
    description:
      'Digital archive of the «Από Κοινού» theater group. Productions, video, photography, programme, history, and contact.',
  },
};

// Navigation entries. `href` is the locale-neutral path; labels are pulled
// from the UI dictionary via each entry's `labelKey`.
export const NAV_LINKS = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/parastaseis', labelKey: 'nav.parastaseis' },
  { href: '/nea', labelKey: 'nav.nea' },
  { href: '/programma', labelKey: 'nav.programma' },
  { href: '/syllogi', labelKey: 'nav.syllogi' },
  { href: '/istoria', labelKey: 'nav.istoria' },
  { href: '/epikoinonia', labelKey: 'nav.epikoinonia' },
] as const;