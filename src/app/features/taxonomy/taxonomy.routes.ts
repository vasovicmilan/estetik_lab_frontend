import { Routes } from '@angular/router';

/** Three admin-only entities (no public routes - Category/Tag/Resource are pure
 * taxonomy/booking-support data, never rendered on their own page) mounted at
 * /admin/kategorije, /admin/tagovi, /admin/resursi (see app.routes.ts). The outer
 * authGuard/permissionGuard are already applied where each is mounted, so these
 * child routes are left unguarded here - same convention as
 * services-catalog.routes.ts's SERVICES_CATALOG_ADMIN_ROUTES. */

export const CATEGORIES_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-category-list/admin-category-list').then((m) => m.AdminCategoryList),
  },
  {
    path: 'nova',
    loadComponent: () => import('./components/admin-category-form/admin-category-form').then((m) => m.AdminCategoryForm),
  },
  {
    path: ':id/izmena',
    loadComponent: () => import('./components/admin-category-form/admin-category-form').then((m) => m.AdminCategoryForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-category-detail/admin-category-detail').then((m) => m.AdminCategoryDetail),
  },
];

export const TAGS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-tag-list/admin-tag-list').then((m) => m.AdminTagList),
  },
  {
    path: 'novi',
    loadComponent: () => import('./components/admin-tag-form/admin-tag-form').then((m) => m.AdminTagForm),
  },
  {
    path: ':id/izmena',
    loadComponent: () => import('./components/admin-tag-form/admin-tag-form').then((m) => m.AdminTagForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-tag-detail/admin-tag-detail').then((m) => m.AdminTagDetail),
  },
];

export const RESOURCES_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-resource-list/admin-resource-list').then((m) => m.AdminResourceList),
  },
  {
    path: 'novi',
    loadComponent: () => import('./components/admin-resource-form/admin-resource-form').then((m) => m.AdminResourceForm),
  },
  {
    path: ':id/izmena',
    loadComponent: () => import('./components/admin-resource-form/admin-resource-form').then((m) => m.AdminResourceForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-resource-detail/admin-resource-detail').then((m) => m.AdminResourceDetail),
  },
];
