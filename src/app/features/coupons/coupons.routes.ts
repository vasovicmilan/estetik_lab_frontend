import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/kuponi (see app.routes.ts, gated on
 * `manage_coupons`). The outer authGuard/permissionGuard are already applied
 * where this is mounted, so these child routes are left unguarded here, same
 * pattern as business-partners.routes.ts's BUSINESS_PARTNERS_ADMIN_ROUTES -
 * including the same `:id` (edit) / `:id/pregled` (read-only detail)
 * convention. */
export const COUPONS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-coupon-list/admin-coupon-list').then((m) => m.AdminCouponList),
  },
  {
    path: 'novi',
    loadComponent: () => import('./components/admin-coupon-form/admin-coupon-form').then((m) => m.AdminCouponForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/admin-coupon-form/admin-coupon-form').then((m) => m.AdminCouponForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-coupon-detail/admin-coupon-detail').then((m) => m.AdminCouponDetail),
  },
];
