import { ImageDisplay, ImageReference } from '../../../core/models/upload';

// Mirrors expert.mapper.js exactly. "Team"/"Expert" here is a public showcase
// profile, deliberately independent of Employee/booking accounts (see
// expert.model.js's own comment: works with zero login accounts behind it).
//
// Three shapes come back from the backend for "an expert", same split as
// Service/Package/Product (see models/service.ts's header comment):
// 1. TeamMemberCard/TeamMemberDetail - public read shapes (below, unchanged).
// 2. ExpertAdminListItem - GET /admin/experts (mapExpertsForAdminList).
// 3. ExpertEditPayload - GET /admin/experts/:id/edit, and the body of POST/PUT
//    (mapExpertForEdit) - the ONLY shape create/update accept.

export interface TeamMemberCard {
  id: string;
  imePrezime: string;
  slug: string;
  titula: string;
  kratkaBiografija: string;
  slika: ImageDisplay | null;
}

export interface TeamMemberDetail {
  id: string;
  imePrezime: string;
  slug: string;
  titula: string;
  kratkaBiografija: string;
  biografija: string;
  slika: ImageDisplay | null;
  galerija: ImageDisplay[];
  specijalizacije: string[];
  usluge: string[];
  drustveneMreze: Record<string, string>;
}

// ---- Admin list row (mapExpertsForAdminList) ----

export interface ExpertAdminListItem {
  id: string;
  imePrezime: string;
  slika: ImageDisplay | null;
  titula: string;
  slug: string;
  brojUsluga: number;
  aktivan: 'Da' | 'Ne';
  redosled: number;
  kreiran: string;
}

// ---- Admin detail (display only) - GET /admin/experts/:id (mapExpertForAdminDetail).
// Same split rationale as ServiceDetail/PackageAdminDetail: Serbian-keyed,
// pre-formatted, safe to render read-only, NOT the shape admin-team-form posts back. ----

export interface ExpertAdminDetail {
  id: string;
  osnovno: {
    ime: string;
    prezime: string;
    slug: string;
    titula: string;
    kratkaBiografija: string;
    biografija: string;
  };
  slika: ImageDisplay | null;
  galerija: ImageDisplay[];
  specijalizacije: string[];
  /** Service NAMES, display only - not ids, unlike ExpertEditPayload.services. */
  usluge: string[];
  drustveneMreze: ExpertSocialLinks;
  aktivan: boolean;
  redosled: number;
  vreme: { kreirano: string; azurirano: string };
}

// ---- Edit / write shape (mapExpertForEdit) ----

export interface ExpertSocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
}

export interface ExpertEditPayload {
  id?: string;
  firstName: string;
  lastName: string;
  slug?: string;
  title?: string;
  shortBio?: string;
  bio?: string;
  image?: ImageReference | null;
  gallery?: ImageReference[];
  /** Plain string tags (e.g. "Masaza", "Kozmetika") - no chip-input component
   * exists in this app yet (checked: MatChipsModule is only used by public
   * detail pages, not any admin form), so admin-team-form edits this as a
   * simple comma-separated text field split/joined on ",". */
  specializations?: string[];
  /** ObjectId strings of related Service docs. There's no service-picker
   * component in this app yet, so - same simplification as
   * PackageItemInput.service elsewhere - this is a plain comma-separated
   * text field of raw Mongo ids rather than a real multi-select. */
  services?: string[];
  socialLinks?: ExpertSocialLinks;
  isActive?: boolean;
  order?: number;
}
