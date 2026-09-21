import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { BusinessPartner } from '../services/business-partner';
import { BusinessPartnerPublicDetail } from '../models/business-partner';

// Resolves to `null` (rather than letting the request error propagate and
// silently cancel the navigation) on a 404/network error, same pattern as
// blog's postDetailResolver - business-partner-detail then shows a proper
// "not found" message instead of the page just not changing at all.
//
// NOT wired into the shared Seo service like postDetailResolver/
// teamDetailResolver are - see BusinessPartnerPublicDetail.seo's own comment
// for why that field isn't safe to feed to Seo.apply() as-is.
export const businessPartnerDetailResolver: ResolveFn<BusinessPartnerPublicDetail | null> = (route) => {
  const businessPartner = inject(BusinessPartner);
  const slug = route.paramMap.get('slug');
  if (!slug) return of(null);

  return businessPartner.getPublicBySlug(slug).pipe(
    map((data) => data),
    catchError(() => of(null))
  );
};
