import { ImageDisplay, ImageReference } from '../../../core/models/upload';

// Mirrors package.mapper.js. GET /admin/packages/:id/edit now exists (added
// alongside this frontend work - see admin-catalog.controller.js's
// getPackageForEdit), same split as services: GET /admin/packages/:id returns the
// DISPLAY shape (PackageAdminDetail below), GET .../edit returns the raw,
// re-postable shape (PackageEditPayload) a form can prefill from and post back.

export interface PackageItemDisplay {
  usluga: { id: string; naziv: string; slug?: string };
  varijanta: { id: string; naziv?: string; cena?: number };
  brojSeansi: number;
}

// ---- Admin list row ----

export interface PackageListItem {
  id: string;
  naziv: string;
  slika: ImageDisplay | null;
  slug: string;
  stavke: string[];
  cena: string;
  najbolji: string;
  aktivan: string;
  kreiran: string;
}

// ---- Admin detail (display only - see header comment) ----

export interface PackageAdminDetail {
  id: string;
  naziv: string;
  slug: string;
  opis: string;
  kratakOpis: string;
  stavke: PackageItemDisplay[];
  cena: number;
  staraCena: number | null;
  ukupnoTrajanje: string | null;
  oznaka: string;
  najbolji: boolean;
  redosled: number;
  slika: ImageDisplay | null;
  galerija: ImageDisplay[];
  faq: { pitanje: string; odgovor: string }[];
  aktivan: boolean;
}

// ---- Create/edit payload (matches validatePackageCreate/mapPackageForEdit) ----

export interface PackageItemInput {
  service: string;
  servicePackageId: string;
  sessions: number;
}

export interface PackageCreatePayload {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  items: PackageItemInput[];
  totalPrice: number;
  basePrice?: number | null;
  badge?: string;
  isBest?: boolean;
  order?: number;
  image?: ImageReference | null;
  isActive?: boolean;
}

// GET /admin/packages/:id/edit response shape (mapPackageForEdit) - a superset of
// PackageCreatePayload (adds id + a few fields the create form doesn't need to
// set directly), used to prefill admin-package-form in edit mode.
export interface PackageEditPayload {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  items: PackageItemInput[];
  totalPrice: number;
  basePrice: number | null;
  totalDuration: number | null;
  badge: string;
  isBest: boolean;
  order: number;
  image: ImageReference | null;
  gallery: ImageReference[];
  videos: unknown[];
  categories: string[];
  tags: string[];
  faq: { question: string; answer: string; order?: number; _id?: string }[];
  isActive: boolean;
}

// ---- Public ----

export interface PackagePublicCard {
  id: string;
  naziv: string;
  slug: string;
  kratakOpis: string;
  stavke: string[];
  cena: string;
  staraCena: string | null;
  ustedaProcenat: number | null;
  oznaka: string | null;
  najbolji: boolean;
  slika: ImageDisplay | null;
}

export interface PackagePublicDetail {
  id: string;
  naziv: string;
  slug: string;
  opis: string;
  kratakOpis: string;
  stavke: PackageItemDisplay[];
  cena: number;
  staraCena: number | null;
  ukupnoTrajanje: string | null;
  oznaka: string;
  najbolji: boolean;
  slika: ImageDisplay | null;
  galerija: ImageDisplay[];
  faq: { pitanje: string; odgovor: string }[];
}
