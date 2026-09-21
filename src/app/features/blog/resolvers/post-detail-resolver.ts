import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';
import { Post } from '../services/post';
import { Seo } from '../../../core/services/seo';
import { PostDetail } from '../models/post';

// Resolves to `null` (rather than letting the request error propagate and
// silently cancel the navigation - Angular's default) on a 404/network error,
// so blog-detail can show a proper "not found" message instead of the page
// just not changing at all.
export const postDetailResolver: ResolveFn<PostDetail | null> = (route) => {
  const post = inject(Post);
  const seo = inject(Seo);
  const slug = route.paramMap.get('slug');
  if (!slug) return of(null);

  return post.getBySlugWithSeo(slug).pipe(
    tap((res) => res.seo && seo.apply(res.seo)),
    map((res) => res.data),
    catchError(() => of(null))
  );
};
