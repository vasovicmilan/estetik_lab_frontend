// Same admin-list/edit-payload split as models/category.ts. Resources are
// booking equipment/rooms - see resource.mapper.js.

// ---- (1) Admin list row ---- GET /api/v1/admin/resources (mapResourcesForAdminList)

export interface ResourceAdminListItem {
  id: string;
  naziv: string;
  kapacitet: number;
  aktivan: 'Da' | 'Ne';
  kreiran: string;
}

// ---- Admin detail (display only) ---- GET /api/v1/admin/resources/:id (mapResourceForAdminDetail)

export interface ResourceAdminDetail {
  id: string;
  naziv: string;
  kapacitet: number;
  aktivan: boolean;
  napomena: string;
  vreme: { kreiran: string; azuriran: string };
}

// ---- (2) Edit / write shape ---- GET /api/v1/admin/resources/:id/edit, and the body of POST/PUT (mapResourceForEdit)

export interface ResourceEditPayload {
  id?: string;
  name: string;
  capacity: number;
  isActive: boolean;
  notes?: string;
}
