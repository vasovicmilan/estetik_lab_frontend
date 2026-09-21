import { Routes } from '@angular/router';

/** Admin routes - mounted at /admin/korisnici. The outer authGuard/permissionGuard
 * are already applied where this is mounted (see app.routes.ts's 'korisnici' entry,
 * gated on `manage_users`), so these child routes are left unguarded here, same
 * pattern as orders.routes.ts's ORDERS_ADMIN_ROUTES.
 *
 * No create route - users self-register (POST /auth/register), admins only ever
 * manage existing accounts. */
export const USERS_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-user-list/admin-user-list').then((m) => m.AdminUserList),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/admin-user-detail/admin-user-detail').then((m) => m.AdminUserDetail),
  },
];
