import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/pretplatnici (see app.routes.ts, gated on
 * `manage_marketing`). The outer authGuard/permissionGuard are already applied
 * where this is mounted, so these child routes are left unguarded here, same
 * pattern as business-partners.routes.ts's BUSINESS_PARTNERS_ADMIN_ROUTES - but
 * NO `novi` and NO bare `:id` (edit) route: subscribers sign themselves up
 * publicly and unsubscribe themselves, admin can only view and delete (see
 * models/subscriber.ts's header comment), so only list + read-only detail exist. */
export const SUBSCRIBERS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-subscriber-list/admin-subscriber-list').then((m) => m.AdminSubscriberList),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-subscriber-detail/admin-subscriber-detail').then((m) => m.AdminSubscriberDetail),
  },
];
