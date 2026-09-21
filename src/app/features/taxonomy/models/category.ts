import { ImageDisplay, ImageReference } from '../../../core/models/upload';

// Same three-shape split as services-catalog/models/service.ts (see that file's
// header comment for the full rationale) - a Serbian-keyed pre-formatted DISPLAY
// shape for the admin list, and an English-keyed raw EDIT shape that's the only
// one create/update accept.
//
// 1. CategoryAdminListItem - GET /api/v1/admin/categories             (mapCategoriesForAdminList)
// 2. CategoryEditPayload   - GET /api/v1/admin/categories/:id/edit, and the body of POST/PUT (mapCategoryForEdit)

export type CategoryDomain = 'post' | 'service' | 'product';

// ---- (1) Admin list row ----

export interface CategoryAdminListItem {
  id: string;
  naziv: string;
  slika: ImageDisplay | null;
  slug: string;
  /** Serbian display label - "Blog"|"Usluga"|"Proizvod". */
  domen: string;
  domenRaw: CategoryDomain;
  /** Parent category name, or null for a root category. */
  roditelj: string | null;
  prioritet: number;
  aktivna: 'Da' | 'Ne';
  kreirana: string;
}

// ---- Admin detail (display only) - GET /admin/categories/:id (mapCategoryForAdminDetail).
// Same split rationale as ServiceDetail: Serbian-keyed, pre-formatted, safe to
// render read-only, NOT the shape admin-category-form posts back. ----

export interface CategoryAdminDetailParent {
  id: string;
  naziv?: string;
  slug?: string;
}

export interface CategoryAdminDetail {
  id: string;
  naziv: string;
  slug: string;
  domen: string;
  roditelj: CategoryAdminDetailParent | null;
  kratakOpis: string | null;
  dugiOpis: string | null;
  slika: { url: string | null; opis: string | null } | null;
  meta: { indeksiranje: string; prioritet: number; aktivna: string };
  vreme: { kreirano: string; azurirano: string };
}

// ---- (2) Edit / write shape ----

/** `content`/`longDescription` are opaque here (same "round-trip unchanged"
 * pattern as Product's longDescription / Post's content elsewhere in this app) -
 * no block editor for a category's page content in this pass. */
export interface CategoryEditPayload {
  id?: string;
  name: string;
  slug?: string;
  domain: CategoryDomain;
  parent: string | null;
  shortDescription?: string;
  longDescription?: string;
  content?: unknown[];
  featureImage?: ImageReference | null;
  isIndexable?: boolean;
  priority?: number;
  isActive?: boolean;
}
