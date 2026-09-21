import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/utisci (see app.routes.ts, gated on
 * `manage_marketing`). The outer authGuard/permissionGuard are already applied
 * where this is mounted, so these child routes are left unguarded here, same
 * pattern as subscribers.routes.ts's SUBSCRIBERS_ADMIN_ROUTES - NO `novi` and
 * NO bare `:id` (edit) route: testimonials are submitted publicly and admin
 * only reviews/deletes them, never creates or edits the content itself. */
export const TESTIMONIALS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-testimonial-list/admin-testimonial-list').then((m) => m.AdminTestimonialList),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-testimonial-detail/admin-testimonial-detail').then((m) => m.AdminTestimonialDetail),
  },
];
