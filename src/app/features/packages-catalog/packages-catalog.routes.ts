import { Routes } from '@angular/router';
import { packageDetailResolver } from './resolvers/package-detail-resolver';

export const PACKAGES_CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/package-list/package-list').then((m) => m.PackageList),
  },
  {
    path: ':slug',
    loadComponent: () => import('./components/package-detail/package-detail').then((m) => m.PackageDetail),
    resolve: { pkg: packageDetailResolver },
  },
];

/** Admin routes - guards applied where this is mounted (see app.routes.ts), same
 * pattern as services-catalog.routes.ts. */
export const PACKAGES_CATALOG_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-package-list/admin-package-list').then((m) => m.AdminPackageList),
  },
  {
    path: 'novi',
    loadComponent: () => import('./components/admin-package-form/admin-package-form').then((m) => m.AdminPackageForm),
  },
  {
    path: ':id/izmena',
    loadComponent: () => import('./components/admin-package-form/admin-package-form').then((m) => m.AdminPackageForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-package-detail/admin-package-detail').then((m) => m.AdminPackageDetail),
  },
];
