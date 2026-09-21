import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';
import { Service } from '../services/service';
import { Seo } from '../../../core/services/seo';
import { PublicServiceDetail } from '../models/service';

/**
 * Runs before the route activates - during SSR, that's before the page is sent to
 * the client, which is the whole point (see seo.ts's header comment: tags set
 * after an initial render are invisible to a crawler that doesn't execute JS).
 * withComponentInputBinding() (see app.config.ts) means the resolved value below
 * lands directly on the component's `service` @Input, no ActivatedRoute plumbing
 * needed in the component itself.
 */
export const serviceDetailResolver: ResolveFn<PublicServiceDetail | null> = (route) => {
  const service = inject(Service);
  const seo = inject(Seo);
  const slug = route.paramMap.get('slug');
  if (!slug) return of(null);

  // A failed request (404, network error) resolves to null instead of erroring
  // the navigation - Angular's default on a resolver error is to silently
  // abort the route change, which looks exactly like "the page doesn't work".
  return service.getBySlugWithSeo(slug).pipe(
    tap((res) => res.seo && seo.apply(res.seo)),
    map((res) => res.data),
    catchError(() => of(null))
  );
};
