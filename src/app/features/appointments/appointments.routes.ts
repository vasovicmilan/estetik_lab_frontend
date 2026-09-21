import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/zakazivanja. The outer authGuard/permissionGuard
 * are already applied where this is mounted (see app.routes.ts's 'zakazivanja' entry,
 * gated on `manage_appointments_all`), so these child routes are left unguarded here,
 * same pattern as services-catalog.routes.ts's *_ADMIN_ROUTES.
 *
 * No separate edit form here, unlike other entities - an appointment is edited
 * through the detail page's status-transition buttons + reschedule/reassign
 * controls, not a generic edit form. */
export const APPOINTMENTS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/admin-appointment-list/admin-appointment-list').then((m) => m.AdminAppointmentList),
  },
  {
    path: 'novi',
    loadComponent: () =>
      import('./components/admin-appointment-manual-form/admin-appointment-manual-form').then(
        (m) => m.AdminAppointmentManualForm
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/admin-appointment-detail/admin-appointment-detail').then((m) => m.AdminAppointmentDetail),
  },
];
