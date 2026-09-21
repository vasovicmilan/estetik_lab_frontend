import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

/**
 * Attaches `Authorization: Bearer <token>` to every request - matches
 * apiAuthMiddleware on the backend (src/middlewares/auth.middleware.js), which
 * requires exactly that header, no cookie/session fallback for /api/v1.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(Auth).getToken();
  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
