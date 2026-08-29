import type { CollectionEntry } from 'astro:content';
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

/** Longest-edge cap for lightbox "full view" images. 1920px covers any
 *  screen without shipping the multi-megabyte camera originals. */
const LIGHTBOX_MAX = 1920;

/** Build-time URL for the lightbox full view: capped at 1920px on the
 *  long edge (never upscaled) and re-encoded as WebP. Referencing the
 *  raw `img.src` instead would force Astro to ship the original file
 *  (often 6000×4000, 10–17MB) into the build output. */
export async function lightboxSrc(img: ImageMetadata): Promise<string> {
  const landscape = img.width >= img.height;
  const edge = Math.min(LIGHTBOX_MAX, landscape ? img.width : img.height);
  const out = await getImage({
    src: img,
    ...(landscape ? { width: edge } : { height: edge }),
    format: 'webp',
  });
  return out.src;
}

/** Build-time og:image / twitter:image: 1200×630 cover-cropped JPEG.
 *  Social crawlers (Facebook, WhatsApp, Twitter) reject or time out on
 *  images larger than a few MB, so the raw originals must never be used.
 *  Returns the URL plus the actual output dimensions — sources smaller
 *  than 1200px are never upscaled, so their crop can be smaller. */
export async function ogSrc(img: ImageMetadata): Promise<{
  src: string;
  width: number;
  height: number;
}> {
  const out = await getImage({
    src: img,
    width: 1200,
    height: 630,
    fit: 'cover',
    format: 'jpeg',
  });
  return { src: out.src, width: out.attributes.width, height: out.attributes.height };
}

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
