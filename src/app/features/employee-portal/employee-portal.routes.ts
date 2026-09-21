import { Routes } from '@angular/router';

/** Employee "Panel zaposlenog" area - mounted at /zaposleni-panel in
 * app.routes.ts, behind employeeGuard (a logged-in user whose JWT carries
 * isEmployee: true). All children sit inside EmployeeShell's light tab nav,
 * same nesting shape as ACCOUNT_ROUTES (see that file's own header comment). */
export const EMPLOYEE_PORTAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/employee-dashboard/employee-dashboard').then((m) => m.EmployeeDashboard),
  },
  {
    path: 'termini',
    loadComponent: () => import('./components/employee-appointments/employee-appointments').then((m) => m.EmployeeAppointments),
  },
  {
    path: 'termini/:id',
    loadComponent: () =>
      import('./components/employee-appointment-detail/employee-appointment-detail').then((m) => m.EmployeeAppointmentDetail),
  },
  {
    path: 'profil',
    loadComponent: () => import('./components/employee-profile/employee-profile').then((m) => m.EmployeeProfile),
  },
  {
    path: 'zarade',
    loadComponent: () => import('./components/employee-earnings/employee-earnings').then((m) => m.EmployeeEarnings),
  },
];
