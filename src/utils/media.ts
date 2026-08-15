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
