import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/zaposleni. The outer authGuard/permissionGuard
 * are already applied where this is mounted (see app.routes.ts's 'zaposleni' entry,
 * gated on `manage_employees`), so these child routes are left unguarded here, same
 * pattern as services-catalog.routes.ts's SERVICES_CATALOG_ADMIN_ROUTES - including
 * the same `:id/pregled` convention for the read-only detail view. */
export const EMPLOYEES_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-employee-list/admin-employee-list').then((m) => m.AdminEmployeeList),
  },
  {
    path: 'novi',
    loadComponent: () => import('./components/admin-employee-form/admin-employee-form').then((m) => m.AdminEmployeeForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/admin-employee-form/admin-employee-form').then((m) => m.AdminEmployeeForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-employee-detail/admin-employee-detail').then((m) => m.AdminEmployeeDetail),
  },
];
