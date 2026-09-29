import { HttpInterceptorFn } from '@angular/common/http';
import { PLATFORM_ID, REQUEST, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';

/**
 * During SSR every API call originates from the SSR server, so the backend's rate limiter would
 * see ONE client for all visitors. When SSR_SHARED_SECRET is set (same value as on the backend),
 * pass the real visitor's IP so limits are counted per visitor. In the browser this does nothing;
 * without the secret nothing is sent and the backend keeps using the connection IP.
 */
export const ssrClientInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformServer(inject(PLATFORM_ID))) return next(req);

  const secret = typeof process !== 'undefined' ? process.env?.['SSR_SHARED_SECRET'] : undefined;
  const incoming = inject(REQUEST, { optional: true });
  if (!secret || !incoming) return next(req);

  const headers = incoming.headers;
  const ip =
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (!ip) return next(req);

  return next(req.clone({ setHeaders: { 'X-SSR-Secret': secret, 'X-Client-IP': ip } }));
};
