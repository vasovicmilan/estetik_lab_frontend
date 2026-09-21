import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/privremene-porudzbine (see app.routes.ts,
 * gated on `manage_orders` - same permission as the existing /admin/porudzbine).
 * The outer authGuard/permissionGuard are already applied where this is mounted,
 * so these child routes are left unguarded here, same pattern as
 * orders.routes.ts's ORDERS_ADMIN_ROUTES.
 *
 * No `novi` (create) route and no bare `:id` (edit) route - a temporary order
 * isn't created or edited by an admin, only confirmed or given a shipping quote
 * (see admin-temporary-order-detail.ts), so there's no admin-temporary-order-form
 * at all, just list + detail. Same "no create/no separate edit route" precedent
 * as ORDERS_ADMIN_ROUTES itself. */
export const TEMPORARY_ORDERS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/admin-temporary-order-list/admin-temporary-order-list').then((m) => m.AdminTemporaryOrderList),
  },
  {
    path: ':id/pregled',
    loadComponent: () =>
      import('./components/admin-temporary-order-detail/admin-temporary-order-detail').then((m) => m.AdminTemporaryOrderDetail),
  },
];
