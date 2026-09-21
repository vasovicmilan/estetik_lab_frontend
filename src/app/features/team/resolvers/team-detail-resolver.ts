import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';
import { Team } from '../services/team';
import { Seo } from '../../../core/services/seo';
import { TeamMemberDetail } from '../models/expert';

export const teamDetailResolver: ResolveFn<TeamMemberDetail | null> = (route) => {
  const team = inject(Team);
  const seo = inject(Seo);
  const slug = route.paramMap.get('slug');
  if (!slug) return of(null);

  return team.getBySlugWithSeo(slug).pipe(
    tap((res) => res.seo && seo.apply(res.seo)),
    map((res) => res.data),
    catchError(() => of(null))
  );
};
