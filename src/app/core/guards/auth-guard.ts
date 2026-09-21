import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

/** Blocks a route when there's no decoded user - real enforcement still happens
 * server-side (apiAuthMiddleware); this only avoids showing an admin screen that
 * every API call behind it would 401 on anyway. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.currentUser()) return true;

  return router.createUrlTree(['/prijava'], { queryParams: { redirect: state.url } });
};
