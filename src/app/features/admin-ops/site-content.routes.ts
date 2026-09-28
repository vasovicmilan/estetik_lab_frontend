import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/sadrzaj-sajta (see app.routes.ts, gated on
 * `manage_site_content` - same permission as /admin/podesavanja-sajta). Single
 * tabbed content form, no sub-routes. */
export const SITE_CONTENT_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-site-content-form/admin-site-content-form').then((m) => m.AdminSiteContentForm),
  },
];
