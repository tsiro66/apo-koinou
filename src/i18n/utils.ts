// Locale helpers shared by every page and component.
// el = default locale, served at site root (no /el prefix).
// en = secondary locale, served under /en/*.
import { defaultLocale, locales, ui, type Locale, type UIKey } from './ui';

export { locales, defaultLocale };
export type { Locale, UIKey };

/** Determine the active locale from any URL. */
export function getLocaleFromUrl(url: URL): Locale {
  const [, seg] = url.pathname.split('/');
  return seg === 'en' ? 'en' : defaultLocale;
}

/** Translation function for the given locale. Falls back to defaultLocale. */
export function useTranslations(locale: Locale) {
  return (key: UIKey): string => {
    const table = ui[locale] as Record<string, string>;
    return table[key] ?? (ui[defaultLocale] as Record<string, string>)[key] ?? key;
  };
}

/** Render a templated string, e.g. "Πρόγραμμα {season}" -> "Πρόγραμμα 2025–2026". */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/**
 * Strip the /en locale prefix (and trailing slash) to get the
 * locale-neutral path used for active-link checks and cross-locale linking.
 */
export function neutralPath(url: URL): string {
  let p = url.pathname.replace(/\/$/, '') || '/';
  if (p.startsWith('/en')) p = p.replace(/^\/en(\/|$)/, '/') || '/';
  return p;
}

/** Map a locale-neutral path to a localized URL for the given locale. */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : path.replace(/\/$/, '');
  if (locale === 'en') return clean === '' ? '/en' : `/en${clean}`;
  return clean === '' ? '/' : clean;
}

/** Opposite of the active locale, for the switcher's "other" link. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'el' ? 'en' : 'el';
}