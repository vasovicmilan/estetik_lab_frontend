import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/porudzbine. The outer authGuard/permissionGuard
 * are already applied where this is mounted (see app.routes.ts's 'porudzbine' entry,
 * gated on `manage_orders`), so these child routes are left unguarded here, same
 * pattern as appointments.routes.ts's APPOINTMENTS_ADMIN_ROUTES.
 *
 * No manual-order-creation route here - POST /admin/orders/manual is a deliberate
 * v1 skip (same reasoning as appointments' manual-form skipping the existing-user
 * picker: it would need its own product/variant/user picker UI, out of scope for
 * this pass). Also no route for /admin/temporary-orders (unconfirmed pending-checkout
 * carts) - that's a separate, lower-priority concern from managing real orders. */
export const ORDERS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-order-list/admin-order-list').then((m) => m.AdminOrderList),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/admin-order-detail/admin-order-detail').then((m) => m.AdminOrderDetail),
  },
];
