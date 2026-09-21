import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/isplate (see app.routes.ts, gated on
 * `manage_payouts`). The outer authGuard/permissionGuard are already applied
 * where this is mounted, so these child routes are left unguarded here, same
 * pattern as partners.routes.ts. Payout requests have no separate edit form -
 * only status-transition actions - so `:id` IS the detail/action page
 * directly, no `novi`/`pregled` split like partners/employees. The direct-entry
 * form gets its own static path so it doesn't collide with `:id`. */
export const PAYOUTS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-payout-list/admin-payout-list').then((m) => m.AdminPayoutList),
  },
  {
    path: 'direktna-isplata',
    loadComponent: () => import('./components/admin-payout-direct-form/admin-payout-direct-form').then((m) => m.AdminPayoutDirectForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/admin-payout-detail/admin-payout-detail').then((m) => m.AdminPayoutDetail),
  },
];
