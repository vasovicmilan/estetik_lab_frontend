import { Routes } from '@angular/router';

/** Customer "Moj nalog" area - mounted at /moj-nalog in app.routes.ts, behind
 * authGuard (any logged-in user, no manage_* permission needed). All children
 * sit inside AccountShell's light tab nav, same nesting shape as AdminShell's
 * children but far lighter (see AccountShell's own header comment). */
export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/account-profile/account-profile').then((m) => m.AccountProfile),
  },
  {
    path: 'zakazivanja',
    loadComponent: () => import('./components/account-appointments/account-appointments').then((m) => m.AccountAppointments),
  },
  {
    path: 'zakazivanja/:id',
    loadComponent: () =>
      import('./components/account-appointment-detail/account-appointment-detail').then((m) => m.AccountAppointmentDetail),
  },
  {
    path: 'porudzbine',
    loadComponent: () => import('./components/account-orders/account-orders').then((m) => m.AccountOrders),
  },
  {
    path: 'porudzbine/:id',
    loadComponent: () => import('./components/account-order-detail/account-order-detail').then((m) => m.AccountOrderDetail),
  },
  {
    path: 'adrese',
    loadComponent: () => import('./components/account-addresses/account-addresses').then((m) => m.AccountAddresses),
  },
];
