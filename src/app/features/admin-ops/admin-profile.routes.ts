import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/profil (see app.routes.ts). No
 * permissionGuard/data.permission here beyond the base `access_admin_panel`
 * already required by the whole 'admin' parent route via authGuard + the
 * backend's admin-ops router (see the task spec's section 6). */
export const ADMIN_PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-profile/admin-profile').then((m) => m.AdminProfile),
  },
];
