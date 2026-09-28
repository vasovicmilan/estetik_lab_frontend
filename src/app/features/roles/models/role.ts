// Mirrors the backend's Role shape (see role.model.js's PERMISSIONS export and
// role.mapper.js) - same admin-list/detail/edit split as taxonomy/models/tag.ts,
// EXCEPT there is no dedicated GET /admin/roles/:id/edit endpoint on the backend
// (admin-taxonomy.routes.js only exposes list/get/create/update/delete for
// roles - no ":id/edit" route like Category/Tag/Resource have). So the admin
// form loads the DETAIL shape (mapRoleForAdminDetail's osnovno/permisije) via
// getById() and re-shapes it into RoleEditPayload itself (see role.ts's
// toEditPayload()) instead of calling a getForEdit() that doesn't exist.

/** Mirrors role.model.js's PERMISSIONS export exactly - keep in sync if the
 * backend enum changes. Labels mirror role.mapper.js's translatePermission(). */
export const PERMISSIONS: { value: string; label: string }[] = [
  { value: 'access_admin_panel', label: 'Pristup Admin Panelu' },
  { value: 'view_dashboard', label: 'Pregled dashboard-a' },

  { value: 'manage_users', label: 'Upravljanje korisnicima' },
  { value: 'manage_roles', label: 'Upravljanje rolama' },
  { value: 'manage_employees', label: 'Upravljanje zaposlenima' },

  { value: 'manage_services', label: 'Upravljanje uslugama' },
  { value: 'manage_packages', label: 'Upravljanje paketima' },
  { value: 'manage_taxonomy', label: 'Upravljanje kategorijama i tagovima' },
  { value: 'manage_resources', label: 'Upravljanje resursima (stolovi, aparati, prostorije)' },
  { value: 'manage_blog', label: 'Upravljanje blogom' },

  { value: 'manage_appointments_all', label: 'Upravljanje svim terminima' },
  { value: 'manage_appointments_assigned', label: 'Upravljanje dodeljenim terminima' },
  { value: 'manage_own_appointments', label: 'Upravljanje sopstvenim terminima' },

  { value: 'manage_marketing', label: 'Upravljanje marketingom' },
  { value: 'manage_coupons', label: 'Upravljanje kuponima' },

  { value: 'manage_products', label: 'Upravljanje proizvodima' },
  { value: 'manage_orders', label: 'Upravljanje porudžbinama' },

  { value: 'manage_partners', label: 'Upravljanje partnerima' },
  { value: 'manage_payouts', label: 'Upravljanje isplatama' },
  { value: 'manage_site_content', label: 'Upravljanje sadržajem sajta (podešavanja i tekstualni sadržaj)' },
  { value: 'view_own_commissions', label: 'Pregled sopstvene provizije' },
  { value: 'view_logs', label: 'Pregled logova' },
  { value: 'view_business_reports', label: 'Pregled poslovnih izveštaja' },
];

/** Reserved role names (role.model.js's RESERVED_ROLE_NAMES) - the backend
 * refuses to rename or delete these (see role.service.js's updateRoleById /
 * deleteRoleById), so the form disables the name field and the list hides the
 * delete action for them. */
export const RESERVED_ROLE_NAMES = ['admin', 'employee', 'user'];

// ---- (1) Admin list row ---- GET /api/v1/admin/roles (mapRolesForAdminList)

export interface RoleAdminListItem {
  id: string;
  naziv: string;
  opis: string;
  brojPermisija: number;
  podrazumevana: 'Da' | 'Ne';
  prioritet: number;
  kreirana: string;
}

// ---- Admin detail ---- GET /api/v1/admin/roles/:id (mapRoleForAdminDetail) -
// also what create/update return, and what the form loads to populate itself
// (there is no separate raw/edit endpoint for roles - see this file's header).

export interface RoleAdminDetail {
  id: string;
  osnovno: {
    naziv: string;
    opis: string;
    podrazumevana: boolean;
    prioritet: number;
  };
  permisije: { kod: string; naziv: string }[];
  vreme: { kreirano: string; azurirano: string };
}

// ---- (2) Write shape ---- body of POST/PUT /admin/roles (validateRoleCreate /
// validateRoleUpdate expect this flat shape, not the nested osnovno/permisije
// display shape).

export interface RoleEditPayload {
  name: string;
  description?: string;
  permissions: string[];
  isDefault: boolean;
  priority: number;
}

/** Re-shapes a detail response into the form's edit payload - see this file's
 * header comment for why this exists instead of a getForEdit() call. */
export function toEditPayload(role: RoleAdminDetail): RoleEditPayload {
  return {
    name: role.osnovno.naziv,
    description: role.osnovno.opis || undefined,
    permissions: role.permisije.map((p) => p.kod),
    isDefault: role.osnovno.podrazumevana,
    priority: role.osnovno.prioritet,
  };
}
