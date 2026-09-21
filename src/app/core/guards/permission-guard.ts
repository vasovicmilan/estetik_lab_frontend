import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

/**
 * Route-data-driven guard: `{ path: 'usluge', canActivate: [permissionGuard], data: { permission: 'manage_services' } }`.
 * Mirrors requirePermission() on the backend (src/middlewares/permission.middleware.js) -
 * same permission string, same "the token carries the whole permissions list at
 * login time" caveat: if an admin's permission is revoked mid-session, this guard
 * (reading the already-decoded token) won't know until they log in again, exactly
 * like the backend won't until the token expires or is reissued.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const required = route.data['permission'] as string | undefined;

  if (!required || auth.hasPermission(required)) return true;

  return router.createUrlTree(['/admin']);
};
