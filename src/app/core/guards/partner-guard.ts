import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

/** Same shape as employeeGuard, just checking isPartner instead of isEmployee -
 * the JWT already carries isPartner (see AuthUser/partnerMiddleware on the
 * backend), so this is purely a client-side "don't show a screen every API call
 * behind it would 403 on anyway" guard; real enforcement is still the backend's
 * partnerMiddleware. Logged-out users go to /prijava (same as authGuard); a
 * logged-in NON-partner goes to / rather than /prijava, since logging in again
 * wouldn't change anything. */
export const partnerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const user = auth.currentUser();
  if (!user) {
    return router.createUrlTree(['/prijava'], { queryParams: { redirect: state.url } });
  }

  if (!user.isPartner) {
    return router.createUrlTree(['/']);
  }

  return true;
};
