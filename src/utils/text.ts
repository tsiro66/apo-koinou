/**
 * Lowercase and strip diacritics so Greek text searches match regardless
 * of tonos and case (e.g. "γλαρος" matches "Ο γλάρος").
 * Used both at build time (data attributes) and at runtime (query input),
 * so matching stays consistent.
 */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Derive a production's director from its crew rows: the first member
 * whose role mentions "Σκηνοθεσία" (matches compounds like
 * "Σκηνοθεσία-Σκηνικά" or "Διασκευή - Σκηνοθεσία"). Frontmatter has no
 * dedicated `director` field in practice — the crew list is the source
 * of truth. Used at build time for the search index and listings.
 */
export function directorFromCrew(
  crew: readonly { role: string; name: string }[],
): string | undefined {
  const row = crew.find((row) =>
    normalizeText(row.role).includes("σκηνοθεσια"),
  );
  return row?.name;
}
