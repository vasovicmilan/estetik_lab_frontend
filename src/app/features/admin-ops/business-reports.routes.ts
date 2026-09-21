import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/izvestaji (see app.routes.ts, gated on
 * `view_business_reports`). Read-only: live tabbed dashboard (one tab per
 * period type), paginated history per period type, single stored period. */
export const BUSINESS_REPORTS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-business-reports-dashboard/admin-business-reports-dashboard').then((m) => m.AdminBusinessReportsDashboard),
  },
  {
    path: ':periodType',
    loadComponent: () => import('./components/admin-business-reports-history-list/admin-business-reports-history-list').then((m) => m.AdminBusinessReportsHistoryList),
  },
  {
    path: ':periodType/:periodKey',
    loadComponent: () => import('./components/admin-business-reports-history-detail/admin-business-reports-history-detail').then((m) => m.AdminBusinessReportsHistoryDetail),
  },
];
