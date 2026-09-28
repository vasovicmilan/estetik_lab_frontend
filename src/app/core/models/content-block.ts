// One rendered content block - matches renderContentBlocks()'s output exactly
// (see content-blocks.util.js). NOT an HTML string: both blog posts and product
// long descriptions are stored as an ordered array of structured blocks
// (paragraph/heading/image/gallery/quote/list/video/table/cards/callout/faq/cta/
// divider/serviceReference/productReference), so the shared <app-content-blocks>
// component (src/app/shared/ui/content-blocks/) switches on `tip` and renders each
// block type's own markup rather than binding this to [innerHTML]. Lives in
// core/models (not blog's or shop's own models) because it's shared by both features.
export interface ContentBlockImage {
  url: string | null;
  alt: string | null;
}

export interface ContentBlockFaqItem {
  question: string;
  answer: string;
  /** Position within the FAQ block's own item list - same "just the array
   * index" convention as a block's own `order` (see admin-blog-form's
   * content-block editor, the only place these are written). */
  order?: number;
}

export interface ContentBlockCard {
  icon?: string | null;
  title?: string | null;
  text?: string | null;
}

export interface ContentBlockButton {
  tekst?: string | null;
  url?: string | null;
}

export interface ContentBlock {
  tip: string;
  tekst: string | null;
  nivo: number | null;
  slika: ContentBlockImage | null;
  galerija: ContentBlockImage[] | null;
  video: { url?: string; title?: string; thumbnail?: string; isExternal?: boolean } | null;
  stavke: string[] | null;
  uredjeno: boolean;
  izvor: string | null;
  kolone: string[] | null;
  redovi: { label?: string; values?: string[] }[] | null;
  kartice: ContentBlockCard[] | null;
  naslovBloka: string | null;
  varijanta: 'info' | 'success' | 'warning' | 'danger';
  faqStavke: ContentBlockFaqItem[] | null;
  dugme: ContentBlockButton | null;
}

// ---- Wire shape (English field names, exactly matching the backend's
// ContentBlogSchema - see content.blog.schema.js) ----
//
// This is what GET /admin/posts/:id actually sends for `content` (postService.
// getPostForEdit / mapPostForEdit does NOT run it through renderContentBlocks()
// the way the read-only display mappers do - see post.mapper.js's header
// comment) and what POST/PUT /admin/posts expects back (admin-marketing.
// controller.js's buildPostPayload passes req.body.content straight into the
// Mongoose schema, unmapped). ContentBlock above is a DISPLAY/EDITOR shape
// (Serbian field names, mirrors renderContentBlocks()'s output) - never the
// wire format for create/update/edit. Use mapApiBlockToContentBlock /
// mapContentBlockToApiBlock at the load/submit boundary to convert between them.
export interface ApiContentBlockImage {
  img: string;
  imgDesc: string;
}

export interface ApiContentBlockFaqItem {
  question: string;
  answer: string;
  order?: number;
}

export interface ApiContentBlockCard {
  icon?: string | null;
  title?: string | null;
  text?: string | null;
}

export interface ApiContentBlockButton {
  text?: string | null;
  url?: string | null;
}

export interface ApiContentBlock {
  type: string;
  text?: string | null;
  level?: number | null;
  image?: ApiContentBlockImage | null;
  gallery?: ApiContentBlockImage[] | null;
  video?: { url?: string; title?: string; thumbnail?: string; isExternal?: boolean } | null;
  items?: string[] | null;
  ordered?: boolean;
  table?: { columns?: string[] | null; rows?: { label?: string; values?: string[] }[] | null } | null;
  cards?: ApiContentBlockCard[] | null;
  meta?: string | null;
  title?: string | null;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  faqItems?: ApiContentBlockFaqItem[] | null;
  button?: ApiContentBlockButton | null;
  order?: number;
}

/** Wire (English) -> editor (Serbian) shape - same field mapping as the
 * backend's own renderContentBlocks() (content-blocks.util.js), kept in sync
 * with it by hand since it isn't shared code across the two repos. */
export function mapApiBlockToContentBlock(block: ApiContentBlock): ContentBlock {
  return {
    tip: block.type,
    tekst: block.text ?? null,
    nivo: block.level ?? null,
    slika: block.image ? { url: block.image.img ?? null, alt: block.image.imgDesc ?? null } : null,
    galerija: Array.isArray(block.gallery) ? block.gallery.map((img) => ({ url: img.img ?? null, alt: img.imgDesc ?? null })) : null,
    video: block.video ?? null,
    stavke: block.items ?? null,
    uredjeno: Boolean(block.ordered),
    izvor: block.meta ?? null,
    kolone: block.table?.columns ?? null,
    redovi: block.table?.rows ?? null,
    kartice: (block.cards as ContentBlockCard[] | null) ?? null,
    naslovBloka: block.title ?? null,
    varijanta: block.variant ?? 'info',
    faqStavke: (block.faqItems as ContentBlockFaqItem[] | null) ?? null,
    dugme: block.button && (block.button.text || block.button.url) ? { tekst: block.button.text ?? null, url: block.button.url ?? null } : null,
  };
}

/** Editor (Serbian) -> wire (English) shape, the inverse of
 * mapApiBlockToContentBlock - `order` is set from the block's position in the
 * array (see admin-blog-form's submit()), same "just the array index"
 * convention already used for faqItems' own order. */
export function mapContentBlockToApiBlock(block: ContentBlock, order: number): ApiContentBlock {
  return {
    type: block.tip,
    text: block.tekst ?? undefined,
    level: block.nivo ?? undefined,
    image: block.slika ? { img: block.slika.url ?? '', imgDesc: block.slika.alt ?? '' } : undefined,
    gallery: block.galerija ? block.galerija.map((img) => ({ img: img.url ?? '', imgDesc: img.alt ?? '' })) : undefined,
    video: block.video ?? undefined,
    items: block.stavke ?? undefined,
    ordered: block.uredjeno,
    table: block.kolone || block.redovi ? { columns: block.kolone ?? undefined, rows: block.redovi ?? undefined } : undefined,
    cards: block.kartice ?? undefined,
    meta: block.izvor ?? undefined,
    title: block.naslovBloka ?? undefined,
    variant: block.varijanta,
    faqItems: block.faqStavke ? block.faqStavke.map((item, i) => ({ ...item, order: i })) : undefined,
    button: block.dugme ? { text: block.dugme.tekst ?? undefined, url: block.dugme.url ?? undefined } : undefined,
    order,
  };
}

/** The 15 block types BLOG_BLOCK_TYPES (backend) recognizes, with the Serbian
 * label shown in the block-type picker of admin-blog-form's content editor. */
export const CONTENT_BLOCK_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'paragraph', label: 'Paragraf' },
  { value: 'heading', label: 'Naslov' },
  { value: 'image', label: 'Slika' },
  { value: 'gallery', label: 'Galerija' },
  { value: 'quote', label: 'Citat' },
  { value: 'list', label: 'Lista' },
  { value: 'video', label: 'Video' },
  { value: 'table', label: 'Tabela' },
  { value: 'cards', label: 'Kartice' },
  { value: 'callout', label: 'Isticanje (callout)' },
  { value: 'faq', label: 'Pitanja i odgovori (FAQ)' },
  { value: 'cta', label: 'Poziv na akciju (CTA)' },
  { value: 'divider', label: 'Razdvajač' },
  { value: 'serviceReference', label: 'Referenca na uslugu' },
  { value: 'productReference', label: 'Referenca na proizvod' },
];

/** A freshly-added block of the given type with sensible empty defaults for
 * every field that type actually uses - used by admin-blog-form's "Dodaj
 * blok" control. Fields the type doesn't use are left at their neutral
 * default (null/false) rather than omitted, since ContentBlock declares them
 * all as always-present. */
export function createEmptyContentBlock(tip: string): ContentBlock {
  const base: ContentBlock = {
    tip,
    tekst: null,
    nivo: null,
    slika: null,
    galerija: null,
    video: null,
    stavke: null,
    uredjeno: false,
    izvor: null,
    kolone: null,
    redovi: null,
    kartice: null,
    naslovBloka: null,
    varijanta: 'info',
    faqStavke: null,
    dugme: null,
  };
  switch (tip) {
    case 'paragraph':
      return { ...base, tekst: '' };
    case 'heading':
      return { ...base, tekst: '', nivo: 2 };
    case 'image':
      return { ...base, slika: { url: null, alt: '' } };
    case 'gallery':
      return { ...base, galerija: [] };
    case 'quote':
      return { ...base, tekst: '', izvor: '' };
    case 'list':
      return { ...base, stavke: [''], uredjeno: false };
    case 'video':
      return { ...base, video: { url: '', title: '', thumbnail: '', isExternal: false } };
    case 'table':
      return { ...base, kolone: [''], redovi: [{ label: '', values: [''] }] };
    case 'cards':
      return { ...base, kartice: [{ icon: '', title: '', text: '' }] };
    case 'callout':
      return { ...base, naslovBloka: '', tekst: '', varijanta: 'info' };
    case 'faq':
      return { ...base, naslovBloka: '', faqStavke: [{ question: '', answer: '', order: 0 }] };
    case 'cta':
    case 'serviceReference':
    case 'productReference':
      return { ...base, naslovBloka: '', dugme: { tekst: '', url: '' } };
    case 'divider':
    default:
      return base;
  }
}
