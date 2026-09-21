import { Routes } from '@angular/router';
import { teamDetailResolver } from './resolvers/team-detail-resolver';

export const TEAM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/team-list/team-list').then((m) => m.TeamList),
  },
  {
    path: ':slug',
    loadComponent: () => import('./components/team-detail/team-detail').then((m) => m.TeamDetail),
    resolve: { member: teamDetailResolver },
  },
];

/** Admin routes - mounted at /admin/tim. The outer authGuard/permissionGuard are
 * already applied where this is mounted (see app.routes.ts's 'admin/tim' entry,
 * matching how admin-employees.routes.js gates /api/v1/admin/experts/* with
 * requirePermission('manage_employees')), so these child routes are left
 * unguarded here to avoid checking the same permission twice. */
export const TEAM_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-team-list/admin-team-list').then((m) => m.AdminTeamList),
  },
  {
    path: 'novi',
    loadComponent: () => import('./components/admin-team-form/admin-team-form').then((m) => m.AdminTeamForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/admin-team-form/admin-team-form').then((m) => m.AdminTeamForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-team-detail/admin-team-detail').then((m) => m.AdminTeamDetail),
  },
];
