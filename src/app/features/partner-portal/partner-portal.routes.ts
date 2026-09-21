import { Routes } from '@angular/router';

/** Partner "Panel partnera" area - mounted at /partner-panel in app.routes.ts,
 * behind partnerGuard (a logged-in user whose JWT carries isPartner: true). All
 * children sit inside PartnerShell's light tab nav, same nesting shape as
 * EMPLOYEE_PORTAL_ROUTES (see that file's own header comment). */
export const PARTNER_PORTAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/partner-dashboard/partner-dashboard').then((m) => m.PartnerDashboard),
  },
  {
    path: 'zarade',
    loadComponent: () => import('./components/partner-earnings/partner-earnings').then((m) => m.PartnerEarnings),
  },
  {
    path: 'katalog',
    loadComponent: () => import('./components/partner-catalog/partner-catalog').then((m) => m.PartnerCatalog),
  },
];
