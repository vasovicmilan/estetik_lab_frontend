import { ImageDisplay, ImageReference } from '../../../core/models/upload';

// Three distinct shapes come back from the backend for "a service" - this file
// mirrors that split exactly rather than flattening it into one convenient type,
// because the backend genuinely returns different data for each (see
// src/mappers/service.mapper.js and admin-catalog.controller.js's getService vs
// getServiceForEdit header comment):
//
// 1. ServiceListItem  - GET /api/v1/admin/services            (mapServicesForAdminList)
// 2. ServiceDetail     - GET /api/v1/admin/services/:id         (mapServiceForAdminDetail)
//    PublicServiceDetail - GET /api/v1/catalog/services/:slug   (mapServiceForPublicDetail, same shape minus a few admin-only fields)
// 3. ServiceEditPayload - GET .../services/:id/edit, and the body of POST/PUT      (mapServiceForEdit / raw ServiceSchema)
//
// (1) and (2) are Serbian-keyed, pre-formatted DISPLAY data (e.g. trajanje: "60 min",
// a string) - safe to render, unsafe to feed back into a form. (3) is English-keyed,
// unformatted, directly re-editable - the ONLY shape create/update accept.

// ---- (1) Admin list row ----

export interface ServiceListItem {
  id: string;
  naziv: string;
  slika: ImageDisplay | null;
  slug: string;
  kategorije: string[];
  cena: string;
  brojVarijanti: number;
  /** Already the literal string "Da"/"Ne" - baked for direct table display, not a boolean. */
  istaknuto: string;
  aktivna: string;
  kreirana: string;
}

// ---- Public listing card (mapServiceForPublicCard - lighter than (2), just
// enough to render a grid, e.g. on the Home page or /usluge) ----

export interface ServicePublicCard {
  id: string;
  naziv: string;
  slug: string;
  kratakOpis: string;
  slika: ImageDisplay | null;
  kategorije: string[];
  cena: string;
  istaknuto: boolean;
  cta: string;
}

// ---- (2) Admin + public detail (display) ----

export interface ServiceVariantDisplay {
  id: string;
  naziv: string;
  slug: string;
  brojSeansi: number;
  /** Formatted "X min", not a number - see ServiceVariant (edit shape) for the raw value. */
  trajanje: string;
  cena: string;
  staraCena: string | null;
  oznaka: string | null;
  najbolji: boolean;
  aktivan: boolean;
}

export interface ServiceFaqDisplay {
  pitanje: string;
  odgovor: string;
}

/** Matches VideoSchema as returned raw (not through formatImage) on
 * mapServiceForPublicDetail's `videi` field - see service.mapper.js. */
export interface ServiceVideoDisplay {
  url: string;
  title?: string | null;
  thumbnail?: string | null;
  isExternal?: boolean;
}

/** Same {kolone, redovi} shape as a blog/product `table` content block
 * (see ContentBlock's kolone/redovi) - mirrors Service's comparisonColumns/
 * comparisonTable fields, returned as `tabelaPoredjenja` by both
 * mapServiceForAdminDetail and mapServiceForPublicDetail. */
export interface ServiceComparisonTable {
  kolone: string[];
  redovi: { label?: string; values?: string[] }[];
}

/** Only present on the public detail response (mapServiceForPublicDetail) -
 * null when the service has no equipmentNote.text set. */
export interface ServiceEquipmentNote {
  tekst: string;
  dugmeTekst: string;
  dugmeUrl: string;
}

export interface ServiceDetail {
  id: string;
  naziv: string;
  slug: string;
  kratakOpis: string;
  dugiOpis: string;
  kategorije: string[];
  tagovi: string[];
  resursi?: string[];
  slika: ImageDisplay | null;
  galerija: ImageDisplay[];
  /** Only on the public detail response - mapServiceForAdminDetail doesn't return it. */
  videi?: ServiceVideoDisplay[];
  cta: string;
  varijante: ServiceVariantDisplay[];
  tabelaPoredjenja?: ServiceComparisonTable;
  faq: ServiceFaqDisplay[];
  /** Only on the public detail response - mapServiceForAdminDetail doesn't return it. */
  opremaNapomena?: ServiceEquipmentNote | null;
  seoKljucneReci?: string[];
  aktivna?: boolean;
}

export type PublicServiceDetail = Omit<ServiceDetail, 'resursi' | 'seoKljucneReci' | 'aktivna'>;

// ---- (3) Edit / write shape ----

/** Raw ServicePackageSchema fields - matches the repeater pattern discussed earlier
 * (a hidden `_id` control per row preserves the subdocument's identity across an
 * edit; a blank/missing `_id` on submit is what tells the backend to mint a new one). */
export interface ServiceVariant {
  _id?: string;
  name: string;
  slug: string;
  sessions: number;
  duration: number;
  totalPrice: number;
  basePrice?: number | null;
  badge?: string | null;
  isBest?: boolean;
  order?: number;
  isActive?: boolean;
}

export interface ServiceFaqEntry {
  _id?: string;
  question: string;
  answer: string;
  order?: number;
}

export interface ServiceEditPayload {
  id?: string;
  name: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  categories?: string[];
  tags?: string[];
  image?: ImageReference | null;
  gallery?: ImageReference[];
  seoKeywords?: string[];
  defaultDuration?: number;
  highlight?: boolean;
  ctaText?: string;
  packages?: ServiceVariant[];
  faq?: ServiceFaqEntry[];
  isActive?: boolean;
}
