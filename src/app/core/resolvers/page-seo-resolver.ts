import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';
import { Api } from '../services/api';
import { Seo } from '../services/seo';
import { SeoData } from '../models/api-response';

/**
 * Backend is the single source of truth for static/listing page SEO
 * (title, description, canonical, robots, OG/Twitter, JSON-LD): it lives in the
 * DB (SiteContent.pageSeo, editable in the admin at /admin/sajt/sadrzaj/seo-stranica)
 * and is served by GET /api/v1/page-seo/:page. This resolver only fetches and
 * applies it - no SEO copy is hardcoded in the frontend anymore.
 *
 * Runs as a route resolver so the tags are set before SSR sends the page (see
 * seo.ts's header comment). A failed request never blocks navigation: the page
 * just keeps the generic default from index.html.
 *
 * `page` is one of the backend's PAGE_SEO_PAGES keys: home, services, packages,
 * products, blog, team, partners, contact, about, faq, privacyPolicy,
 * termsAndConditions, partnership.
 */
export const pageSeoResolver = (page: string): ResolveFn<boolean> => () => {
  const api = inject(Api);
  const seo = inject(Seo);
  return api.get<SeoData>(`page-seo/${page}`).pipe(
    tap((data) => seo.apply(data)),
    map(() => true),
    catchError(() => of(false))
  );
};
