import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/poslovni-saradnici (see app.routes.ts,
 * gated on `manage_marketing`). The outer authGuard/permissionGuard are already
 * applied where this is mounted, so these child routes are left unguarded here,
 * same pattern as employees.routes.ts's EMPLOYEES_ADMIN_ROUTES - including the
 * same `:id` (edit) / `:id/pregled` (read-only detail) convention. */
export const BUSINESS_PARTNERS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-business-partner-list/admin-business-partner-list').then((m) => m.AdminBusinessPartnerList),
  },
  {
    path: 'novi',
    loadComponent: () => import('./components/admin-business-partner-form/admin-business-partner-form').then((m) => m.AdminBusinessPartnerForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/admin-business-partner-form/admin-business-partner-form').then((m) => m.AdminBusinessPartnerForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-business-partner-detail/admin-business-partner-detail').then((m) => m.AdminBusinessPartnerDetail),
  },
];
