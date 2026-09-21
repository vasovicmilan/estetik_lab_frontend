import { ContentBlock } from '../../../core/models/content-block';

// Mirrors business-partner.mapper.js exactly. A BusinessPartner is a public-facing
// B2B/showcase profile (equipment supplier, cross-promo partner...) - permission
// `manage_marketing`, NOT module-gated. Same three-shape split as Category/Post:
//
// 1. BusinessPartnerAdminListItem - GET /admin/business-partners             (mapBusinessPartnersForAdminList)
// 2. BusinessPartnerAdminDetail    - GET /admin/business-partners/:id          (mapBusinessPartnerForAdminDetail)
// 3. BusinessPartnerEditPayload    - GET /admin/business-partners/:id/edit, and the body of POST/PUT (mapBusinessPartnerForEdit)

// ---- (1) Admin list row ----

export interface BusinessPartnerAdminListItem {
  id: string;
  naziv: string;
  slika: { url: string; alt?: string } | null;
  aktivan: boolean;
  kreirano: string;
}

// ---- (2) Admin detail (display only) - NOT the shape admin-business-partner-form posts back ----

export interface BusinessPartnerAdminDetail {
  id: string;
  naziv: string;
  slug: string;
  kratakOpis: string;
  slika: { url: string; alt?: string } | null;
  adresa: string | null;
  imaMapu: boolean;
  geo: { latitude: number; longitude: number } | null;
  outboundUrl: string;
  ctaLabel: string;
  aktivan: boolean;
  /** renderContentBlocks() Serbian-shape block array - rendered with the shared
   * <app-content-blocks> component (src/app/shared/ui/content-blocks/), same as
   * Blog Post/Product detail views. NOT the same shape as edit's raw `content`. */
  sadrzaj: ContentBlock[];
  vreme: { kreiran: string; azuriran: string };
}

// ---- (3) Edit / write shape (mapBusinessPartnerForEdit) ----

export interface BusinessPartnerCoverImage {
  img: string;
  imgThumb?: string;
  imgMedium?: string;
  imgOriginal?: string;
  imgDesc?: string;
}

export interface BusinessPartnerEditPayload {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  /** RAW content blocks (English-keyed, Mongoose-shaped) - same "round-trip
   * unchanged" pattern as Category's content/Product's longDescription. Kept in
   * a private component field, never rendered, merged back unchanged on submit -
   * identical to admin-category-form's `content` handling. */
  content: unknown[];
  coverImage: BusinessPartnerCoverImage | null;
  address: string;
  latitude: number | string;
  longitude: number | string;
  outboundUrl: string;
  ctaLabel: string;
  isActive: boolean;
  seo: Record<string, unknown>;
}

// ---- Create/update payload actually POSTed/PUT ----

/** coverImage REQUIRED on create (backend 400s without it) - uploaded first via
 * BusinessPartner.uploadImage(), then attached here as the ImageReference the
 * upload endpoint returns. All other fields optional on update. */
export interface BusinessPartnerWritePayload {
  name?: string;
  slug?: string;
  shortDescription?: string;
  content?: unknown[];
  coverImage?: BusinessPartnerCoverImage | null;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  outboundUrl?: string;
  ctaLabel?: string;
  isActive?: boolean;
}
