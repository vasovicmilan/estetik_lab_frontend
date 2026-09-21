import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/kampanje (see app.routes.ts, gated on
 * `manage_marketing`). The outer authGuard/permissionGuard are already applied
 * where this is mounted, so these child routes are left unguarded here, same
 * pattern as coupons.routes.ts's COUPONS_ADMIN_ROUTES - including the same
 * `novi` (create) / `:id` (edit) / `:id/pregled` (read-only detail) convention. */
export const CAMPAIGNS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-campaign-list/admin-campaign-list').then((m) => m.AdminCampaignList),
  },
  {
    path: 'novi',
    loadComponent: () => import('./components/admin-campaign-form/admin-campaign-form').then((m) => m.AdminCampaignForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/admin-campaign-form/admin-campaign-form').then((m) => m.AdminCampaignForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-campaign-detail/admin-campaign-detail').then((m) => m.AdminCampaignDetail),
  },
];
