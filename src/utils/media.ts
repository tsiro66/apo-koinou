import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

/**
 * Effective thumbnail for a production: the explicitly chosen thumbnail,
 * falling back to the first gallery photo when none was set. Content editors
 * may therefore skip the thumbnail field and simply order the gallery with
 * the preferred photo first.
 */
export const getThumbnail = (
  d: CollectionEntry<'parastaseis'>['data'],
): ImageMetadata | undefined => d.thumbnail ?? d.gallery[0];

/**
 * Streamable video ID for a production, if a real one is set. Placeholder
 * values ("TODO…") count as no video — they must not render a player
 * or a Watch-now button.
 */
export const getVideoId = (
  d: CollectionEntry<'parastaseis'>['data'],
): string | undefined =>
  d.videoId && !d.videoId.trim().toUpperCase().startsWith('TODO')
    ? d.videoId
    : undefined;

/**
 * All photos of a production — the effective thumbnail first, then the
 * gallery (minus the thumbnail, so it is never shown twice).
 */
export const getPhotos = (
  d: CollectionEntry<'parastaseis'>['data'],
): ImageMetadata[] => {
  const thumb = getThumbnail(d);
  const seen = new Set<string>(thumb ? [thumb.src] : []);
  return [thumb, ...d.gallery.filter((p) => !seen.has(p.src))].filter(
    (p): p is ImageMetadata => !!p,
  );
};
