import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/podesavanja-sajta (see app.routes.ts,
 * gated on `manage_site_content`). Single settings form, no sub-routes. */
export const SITE_SETTINGS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-site-settings-form/admin-site-settings-form').then((m) => m.AdminSiteSettingsForm),
  },
];
