import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';
import { ApiErrorResponse } from '../models/api-response';

/**
 * Single place that reacts to a failed request. 401 means the token is missing,
 * expired, or invalid (apiAuthMiddleware rejects before touching the DB - see
 * auth.middleware.js) - there's no refresh-token flow (docs/sr/15-api-v1-referenca.md),
 * so the only correct move is clear the session and send the admin back to login.
 * 403 is left alone here (a valid, logged-in user who genuinely lacks a permission) -
 * that's a per-screen "you can't do this" state, not a global redirect.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.clearSession();
        router.navigate(['/prijava'], { queryParams: { redirect: router.url } });
      }

      const body = error.error as ApiErrorResponse | undefined;
      const message = body?.error?.message || error.message || 'Došlo je do greške.';
      return throwError(() => new Error(message));
    })
  );
};
