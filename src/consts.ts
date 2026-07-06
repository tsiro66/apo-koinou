// Single source of truth for site-wide constants.
// Translatable fields are keyed per locale; UI strings live in src/i18n/ui.ts.
import type { Locale } from './i18n/ui';

export const SITE = {
  // Brand name kept identical in both locales (proper noun).
  site: 'https://apo-koinou.gr',
  email: 'info@apo-koinou.gr',
  social: {
    youtube: '',
    facebook: '',
    instagram: '',
  },
} as const;

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
  { href: '/synteleistes', labelKey: 'nav.synteleistes' },
  { href: '/syllogi', labelKey: 'nav.syllogi' },
  { href: '/istoria', labelKey: 'nav.istoria' },
  { href: '/epikoinonia', labelKey: 'nav.epikoinonia' },
] as const;