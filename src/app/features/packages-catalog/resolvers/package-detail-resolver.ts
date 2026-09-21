import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';
import { Package } from '../services/package';
import { Seo } from '../../../core/services/seo';
import { PackagePublicDetail } from '../models/package';

export const packageDetailResolver: ResolveFn<PackagePublicDetail | null> = (route) => {
  const pkg = inject(Package);
  const seo = inject(Seo);
  const slug = route.paramMap.get('slug');
  if (!slug) return of(null);

  return pkg.getBySlugWithSeo(slug).pipe(
    tap((res) => res.seo && seo.apply(res.seo)),
    map((res) => res.data),
    catchError(() => of(null))
  );
};
