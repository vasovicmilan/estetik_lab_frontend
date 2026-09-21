import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/logovi (see app.routes.ts, gated on
 * `view_logs`). Read-only: live dashboard, paginated history list, single
 * stored day. */
export const LOGS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-logs-dashboard/admin-logs-dashboard').then((m) => m.AdminLogsDashboard),
  },
  {
    path: 'istorija',
    loadComponent: () => import('./components/admin-logs-history-list/admin-logs-history-list').then((m) => m.AdminLogsHistoryList),
  },
  {
    path: 'istorija/:date',
    loadComponent: () => import('./components/admin-logs-history-detail/admin-logs-history-detail').then((m) => m.AdminLogsHistoryDetail),
  },
];
