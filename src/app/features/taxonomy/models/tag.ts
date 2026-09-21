// Same admin-list/edit-payload split as models/category.ts.

export type TagDomain = 'post' | 'service' | 'product';

// ---- (1) Admin list row ---- GET /api/v1/admin/tags (mapTagsForAdminList)

export interface TagAdminListItem {
  id: string;
  naziv: string;
  slug: string;
  /** Serbian display label - "Blog"|"Usluga"|"Proizvod". */
  domen: string;
  domenRaw: TagDomain;
  aktivan: 'Da' | 'Ne';
  kreiran: string;
}

// ---- Admin detail (display only) ---- GET /api/v1/admin/tags/:id (mapTagForAdminDetail)

export interface TagAdminDetail {
  id: string;
  naziv: string;
  slug: string;
  domen: string;
  aktivan: boolean;
  vreme: { kreiran: string; azuriran: string };
}

// ---- (2) Edit / write shape ---- GET /api/v1/admin/tags/:id/edit, and the body of POST/PUT (mapTagForEdit)

export interface TagEditPayload {
  id?: string;
  name: string;
  slug?: string;
  domain: TagDomain;
  isActive: boolean;
  isIndexable?: boolean;
  description?: string;
}
