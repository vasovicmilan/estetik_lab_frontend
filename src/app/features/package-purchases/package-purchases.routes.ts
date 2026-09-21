import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/kupljeni-paketi (see app.routes.ts, gated on
 * `manage_packages`, same permission as the Packages catalog admin). The outer
 * authGuard/permissionGuard are already applied where this is mounted, so these
 * child routes are left unguarded here, same pattern as coupons.routes.ts's
 * COUPONS_ADMIN_ROUTES - EXCEPT there is no bare `:id` (edit) route: per the
 * backend contract, only `expiresAt`/`notes` are editable after creation (see
 * this feature's models/package-purchase.ts header comment), and that's handled
 * inline on the `:id/pregled` detail view, not a dedicated form. Same
 * `novi`-create-only / `:id/pregled`-only convention as testimonials.routes.ts's
 * TESTIMONIALS_ADMIN_ROUTES (no bare `:id` there either, for the same reason:
 * no full edit form). */
export const PACKAGE_PURCHASES_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/admin-package-purchase-list/admin-package-purchase-list').then((m) => m.AdminPackagePurchaseList),
  },
  {
    path: 'novi',
    loadComponent: () =>
      import('./components/admin-package-purchase-create/admin-package-purchase-create').then((m) => m.AdminPackagePurchaseCreate),
  },
  {
    path: ':id/pregled',
    loadComponent: () =>
      import('./components/admin-package-purchase-detail/admin-package-purchase-detail').then((m) => m.AdminPackagePurchaseDetail),
  },
];
