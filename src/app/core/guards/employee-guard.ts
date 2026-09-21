import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

/** Same shape as authGuard, plus an isEmployee check - the JWT already carries
 * isEmployee (see AuthUser/employeeMiddleware on the backend), so this is purely
 * a client-side "don't show a screen every API call behind it would 403 on
 * anyway" guard; real enforcement is still the backend's employeeMiddleware.
 * Logged-out users go to /prijava (same as authGuard); a logged-in NON-employee
 * goes to / rather than /prijava, since logging in again wouldn't change anything. */
export const employeeGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const user = auth.currentUser();
  if (!user) {
    return router.createUrlTree(['/prijava'], { queryParams: { redirect: state.url } });
  }

  if (!user.isEmployee) {
    return router.createUrlTree(['/']);
  }

  return true;
};
