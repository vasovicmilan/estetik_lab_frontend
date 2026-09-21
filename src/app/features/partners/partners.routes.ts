import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/partneri (see app.routes.ts, gated on
 * `manage_partners`). The outer authGuard/permissionGuard are already applied
 * where this is mounted, so these child routes are left unguarded here, same
 * pattern as employees.routes.ts's EMPLOYEES_ADMIN_ROUTES - including the same
 * `:id` (edit) / `:id/pregled` (read-only detail) convention. */
export const PARTNERS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-partner-list/admin-partner-list').then((m) => m.AdminPartnerList),
  },
  {
    path: 'novi',
    loadComponent: () => import('./components/admin-partner-form/admin-partner-form').then((m) => m.AdminPartnerForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/admin-partner-form/admin-partner-form').then((m) => m.AdminPartnerForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-partner-detail/admin-partner-detail').then((m) => m.AdminPartnerDetail),
  },
];
