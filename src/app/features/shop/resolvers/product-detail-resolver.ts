import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';
import { Product } from '../services/product';
import { Seo } from '../../../core/services/seo';
import { ProductPublicDetail } from '../models/product';

/**
 * Same pattern as service-detail-resolver.ts: runs before the route activates so
 * SEO tags are set server-side (see seo.ts's header comment), and a bad slug /
 * failed request resolves to null instead of erroring the navigation.
 */
export const productDetailResolver: ResolveFn<ProductPublicDetail | null> = (route) => {
  const product = inject(Product);
  const seo = inject(Seo);
  const slug = route.paramMap.get('slug');
  if (!slug) return of(null);

  return product.getBySlugWithSeo(slug).pipe(
    tap((res) => res.seo && seo.apply(res.seo)),
    map((res) => res.data),
    catchError(() => of(null))
  );
};
