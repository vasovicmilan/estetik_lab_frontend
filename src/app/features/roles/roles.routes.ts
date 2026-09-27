import { Routes } from '@angular/router';

/** Mounted at /admin/role (see app.routes.ts, gated on `manage_roles`). The
 * outer authGuard/permissionGuard are already applied where this is mounted,
 * so these child routes are left unguarded here - same convention as
 * taxonomy.routes.ts's TAGS_ADMIN_ROUTES. No read-only detail route: unlike
 * Category/Tag/Resource, a role has nothing worth a dedicated view-only page
 * beyond what the list row already shows (name, description, permission
 * count, priority) - "Izmeni" doubles as "view" here, same as coupons'
 * COUPONS_ADMIN_ROUTES ':id' convention. */
export const ROLES_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-role-list/admin-role-list').then((m) => m.AdminRoleList),
  },
  {
    path: 'nova',
    loadComponent: () => import('./components/admin-role-form/admin-role-form').then((m) => m.AdminRoleForm),
  },
  {
    path: ':id/izmena',
    loadComponent: () => import('./components/admin-role-form/admin-role-form').then((m) => m.AdminRoleForm),
  },
];
