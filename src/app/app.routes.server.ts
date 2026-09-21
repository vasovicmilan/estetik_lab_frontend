import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Admin screens are behind auth/permission guards and read the JWT from
  // localStorage, which doesn't exist during SSR - render them client-side only.
  {
    path: 'admin/**',
    renderMode: RenderMode.Client,
  },
  // Everything else (public catalog pages, including parameterized :slug routes)
  // renders on the server. Prerender would require getPrerenderParams for any
  // dynamic segment, which we don't have a fixed list for (services/products are
  // managed through the admin panel, not known at build time).
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
