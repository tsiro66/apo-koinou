/**
 * Lowercase and strip diacritics so Greek text searches match regardless
 * of tonos and case (e.g. "γλαρος" matches "Ο γλάρος").
 * Used both at build time (data attributes) and at runtime (query input),
 * so matching stays consistent.
 */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
