import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';
import { BusinessPartner } from '../services/business-partner';
import { Seo } from '../../../core/services/seo';
import { BusinessPartnerPublicDetail } from '../models/business-partner';

// Resolves to `null` (rather than letting the request error propagate and
// silently cancel the navigation) on a 404/network error, same pattern as
// blog's postDetailResolver - business-partner-detail then shows a proper
// "not found" message instead of the page just not changing at all.
//
// The backend now returns the same top-level `seo` object as every other detail
// endpoint (catalog.controller.js getBusinessPartner), so it is applied here
// exactly like postDetailResolver does.
export const businessPartnerDetailResolver: ResolveFn<BusinessPartnerPublicDetail | null> = (route) => {
  const businessPartner = inject(BusinessPartner);
  const seo = inject(Seo);
  const slug = route.paramMap.get('slug');
  if (!slug) return of(null);

  return businessPartner.getPublicBySlugWithSeo(slug).pipe(
    tap((res) => res.seo && seo.apply(res.seo)),
    map((res) => res.data),
    catchError(() => of(null))
  );
};
