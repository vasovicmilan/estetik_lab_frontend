import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/poruke (see app.routes.ts, gated on
 * `manage_marketing`). The outer authGuard/permissionGuard are already applied
 * where this is mounted, so these child routes are left unguarded here, same
 * pattern as subscribers.routes.ts's SUBSCRIBERS_ADMIN_ROUTES - NO `novi`, NO
 * bare `:id` (edit) route, and no form component at all: contact messages come
 * from the public contact form, admin only reviews and changes their status. */
export const CONTACTS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-contact-list/admin-contact-list').then((m) => m.AdminContactList),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-contact-detail/admin-contact-detail').then((m) => m.AdminContactDetail),
  },
];
