import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/audit-log (see app.routes.ts, gated on
 * `view_logs`). Read-only, list only - no detail sub-route (rows expand
 * inline instead, see admin-audit-log-list's header comment). */
export const AUDIT_LOG_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-audit-log-list/admin-audit-log-list').then((m) => m.AdminAuditLogList),
  },
];
