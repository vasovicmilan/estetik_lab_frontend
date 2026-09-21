import { Routes } from '@angular/router';
import { serviceDetailResolver } from './resolvers/service-detail-resolver';

/** Public routes - mounted at /usluge (see app.routes.ts). SSR-critical: the
 * :slug route resolves and sets SEO tags server-side before render. */
export const SERVICES_CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/service-list/service-list').then((m) => m.ServiceList),
  },
  {
    path: ':slug',
    loadComponent: () => import('./components/service-detail/service-detail').then((m) => m.ServiceDetail),
    resolve: { service: serviceDetailResolver },
  },
];

/** Admin routes - mounted at /admin/usluge. The outer authGuard/permissionGuard are
 * already applied where this is mounted (see app.routes.ts's 'admin/usluge' entry,
 * matching how admin-catalog.routes.js gates /api/v1/admin/services/* with
 * requirePermission('manage_services')), so these child routes are left unguarded
 * here to avoid checking the same permission twice. */
export const SERVICES_CATALOG_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-service-list/admin-service-list').then((m) => m.AdminServiceList),
  },
  {
    path: 'nova',
    loadComponent: () => import('./components/admin-service-form/admin-service-form').then((m) => m.AdminServiceForm),
  },
  {
    path: ':id/izmena',
    loadComponent: () => import('./components/admin-service-form/admin-service-form').then((m) => m.AdminServiceForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-service-detail/admin-service-detail').then((m) => m.AdminServiceDetail),
  },
];
