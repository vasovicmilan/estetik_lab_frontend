// đ/Đ (U+0111/U+0110, "LATIN SMALL/CAPITAL LETTER D WITH STROKE") has no
// Unicode decomposition, so NFD + combining-mark-stripping below (which
// handles š/č/ć/ž just fine, each of those IS a base letter + combining
// accent) leaves đ untouched - the [^a-z0-9] strip further down would then
// silently DROP it instead of transliterating it, corrupting slugs for any
// heading containing it. Mirrors the backend's own anchor slugifier
// (slugifyHeading in presenters/blog/blog.presenter.js), which maps it the
// same way, so a heading's frontend-generated id and the backend's
// TOC-anchor scheme agree on real Serbian text.
const EXTRA_DIACRITICS: Record<string, string> = { đ: 'dj', Đ: 'dj' };

/** Turns arbitrary heading text into a URL-safe anchor id (lowercase, Latin
 * diacritics stripped, non-alphanumerics collapsed to single hyphens).
 * Shared between the content-blocks renderer (which stamps the id on each
 * heading element) and blog-detail's TOC sidebar (which must derive the exact
 * same id from the same text to link to it). Not unique-guaranteed on its
 * own - callers that render a list of headings should disambiguate repeats
 * with an index suffix (see buildToc in blog-detail.ts). */
export function slugify(text: string): string {
  return (text || '')
    .toString()
    .split('')
    .map((ch) => EXTRA_DIACRITICS[ch] || ch)
    .join('')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
