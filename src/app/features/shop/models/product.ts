import { ImageDisplay, ImageReference } from '../../../core/models/upload';
import { ContentBlock } from '../../../core/models/content-block';

// Same three-shape split as services-catalog/models/service.ts (see that file's
// header comment for the full rationale): a Serbian-keyed pre-formatted DISPLAY
// shape for the admin list and for public rendering, and an English-keyed raw
// EDIT shape that's the only one create/update accept.
//
// 1. ProductAdminListItem - GET /api/v1/admin/products             (mapProductsForAdminList)
// 2. ProductPublicCard     - GET /api/v1/products                   (mapProductForPublicCard)
//    ProductPublicDetail   - GET /api/v1/products/:slug              (mapProductForPublicDetail)
// 3. ProductEditPayload   - GET /api/v1/admin/products/:id/edit, and the body of POST/PUT (mapProductForEdit)

// ---- (1) Admin list row ----

export interface ProductAdminListItem {
  id: string;
  naziv: string;
  slika: ImageDisplay | null;
  sku: string | null;
  slug: string;
  kategorije: string[];
  cena: string | null;
  naUpit: boolean;
  /** Total stock across variations. */
  stanje: number;
  brojVarijanti: number;
  oznaka: string | null;
  aktivan: 'Da' | 'Ne';
  kreiran: string;
}

// ---- Public listing card ----

export interface ProductPublicCard {
  id: string;
  naziv: string;
  slug: string;
  kratakOpis: string;
  slika: ImageDisplay | null;
  kategorije: string[];
  /** e.g. "1.200 din" or a range "1.200 - 2.000 din", or null if no active variation / naUpit. */
  cena: string | null;
  /** true = "Cena na upit" - ignore `cena` when this is true. */
  naUpit: boolean;
  naStanju: boolean;
  oznaka: string | null;
  oznakaRaw: 'none' | 'featured' | 'sale';
}

// ---- Public detail (display) ----

export interface ProductVariantDisplay {
  id: string;
  naziv: string;
  sku: string | null;
  cena: number;
  staraCena: number | null;
  stanje: number;
  pragNiskogStanja: number;
  naStanju: boolean;
  slika: ImageDisplay | null;
  redosled: number;
  najbolja: boolean;
  aktivna: boolean;
}

export interface ProductRelatedRef {
  id: string;
  naziv: string;
  slug: string;
  slika: ImageDisplay | null;
}

export interface ProductRelatedPostRef {
  id: string;
  naslov: string;
  slug: string;
  slika: ImageDisplay | null;
}

export interface ProductFaqDisplay {
  pitanje: string;
  odgovor: string;
}

export interface ProductPublicDetail {
  id: string;
  naziv: string;
  slug: string;
  kratakOpis: string;
  /** Structured content blocks, NOT an HTML string - rendered by <app-content-blocks [blocks]="p.dugiOpis" />. */
  dugiOpis: ContentBlock[];
  /** Plain-text fallback - not used for rendering, kept for completeness. */
  dugiOpisTekst: string;
  kategorije: string[];
  tagovi: string[];
  slika: ImageDisplay | null;
  galerija: ImageDisplay[];
  videi: unknown[];
  /** Only active variations, already sorted (isBest first, then order, then _id). */
  varijante: ProductVariantDisplay[];
  povezaniProizvodi: ProductRelatedRef[];
  povezaneUsluge: ProductRelatedRef[];
  povezaniPostovi: ProductRelatedPostRef[];
  faq: ProductFaqDisplay[];
  oznaka: string | null;
  naUpit: boolean;
}

// ---- Admin detail (display only) - GET /api/v1/admin/products/:id (mapProductForAdminDetail).
// Same split rationale as ServiceDetail/PackageAdminDetail: Serbian-keyed,
// pre-formatted, safe to render read-only, NOT the shape a form can post back. ----

export interface ProductAdminDetailRef {
  id: string;
  naziv: string;
  slug: string;
}

export interface ProductAdminDetailPostRef {
  id: string;
  naslov: string;
  slug: string;
  slika: ImageDisplay | null;
}

export interface ProductAdminDetail {
  id: string;
  naziv: string;
  slug: string;
  sku: string | null;
  kratakOpis: string;
  /** Structured content blocks, NOT an HTML string - render with <app-content-blocks>. */
  dugiOpis: ContentBlock[];
  kategorije: string[];
  tagovi: string[];
  slika: ImageDisplay | null;
  galerija: ImageDisplay[];
  videi: unknown[];
  varijante: ProductVariantDisplay[];
  stanjeUkupno: number;
  povezaniProizvodi: ProductAdminDetailRef[];
  povezaneUsluge: ProductAdminDetailRef[];
  povezaniPostovi: ProductAdminDetailPostRef[];
  faq: ProductFaqDisplay[];
  seoKljucneReci: string[];
  oznaka: string | null;
  oznakaRaw: string;
  nacinDostave: string;
  nacinDostaveRaw: string;
  naUpit: boolean;
  aktivan: boolean;
  vreme: { kreiran: string; azuriran: string };
}

// ---- (3) Edit / write shape ----

/** Raw ProductVariationSchema fields - matches the repeater pattern used by
 * ServiceVariant (see services-catalog/models/service.ts). A blank/missing `_id`
 * on submit is what tells the backend to mint a new one for that row. */
export interface ProductVariation {
  _id?: string;
  label: string;
  price: number;
  compareAtPrice?: number | null;
  sku?: string;
  stock: number;
  lowStockThreshold?: number;
  image?: ImageReference | null;
  order?: number;
  isBest?: boolean;
  isActive?: boolean;
}

export interface ProductFaqEntry {
  _id?: string;
  question: string;
  answer: string;
  order?: number;
}

export type ProductBadge = 'none' | 'featured' | 'sale';
export type ProductShippingClass = 'standard' | 'freight';

export interface ProductEditPayload {
  id?: string;
  name: string;
  slug?: string;
  sku?: string;
  shortDescription?: string;
  /** Content blocks, NOT a plain string (unlike Service/Package's description) -
   * this pass has no block editor UI, so a form field just carries whatever came
   * back from getForEdit() unchanged and merges it back in on submit. */
  longDescription?: ContentBlock[];
  categories?: string[];
  tags?: string[];
  image?: ImageReference | null;
  gallery?: ImageReference[];
  videos?: unknown[];
  seoKeywords?: string[];
  variations?: ProductVariation[];
  relatedProducts?: string[];
  relatedServices?: string[];
  relatedPosts?: string[];
  faq?: ProductFaqEntry[];
  badge?: ProductBadge;
  shippingClass?: ProductShippingClass;
  priceOnRequest?: boolean;
  isActive?: boolean;
}
