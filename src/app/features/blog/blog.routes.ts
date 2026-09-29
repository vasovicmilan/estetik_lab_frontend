import { Routes } from '@angular/router';
import { pageSeoResolver } from '../../core/resolvers/page-seo-resolver';
import { postDetailResolver } from './resolvers/post-detail-resolver';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/blog-list/blog-list').then((m) => m.BlogList),
    resolve: { seo: pageSeoResolver('blog') },
  },
  // Category/tag archive pages - MUST come before the generic ':slug' post-detail
  // route below, or Angular would match "kategorija"/"tag" as a post slug instead.
  // Mounted here (rather than under the leaf ':slug'/:slug route) so the final URL
  // is /blog/kategorija/:slug and /blog/tag/:slug (see app.routes.ts's 'blog' entry).
  {
    path: 'kategorija/:slug',
    loadComponent: () => import('./components/blog-archive/blog-archive').then((m) => m.BlogArchive),
    data: { filterType: 'category' },
  },
  {
    path: 'tag/:slug',
    loadComponent: () => import('./components/blog-archive/blog-archive').then((m) => m.BlogArchive),
    data: { filterType: 'tag' },
  },
  {
    path: ':slug',
    loadComponent: () => import('./components/blog-detail/blog-detail').then((m) => m.BlogDetail),
    resolve: { post: postDetailResolver },
  },
];

/** Admin routes - mounted at /admin/blog. The outer authGuard/permissionGuard are
 * already applied where this is mounted (see app.routes.ts's 'admin/blog' entry,
 * matching how admin-content.routes.js gates /api/v1/admin/posts/* with
 * requireModule('blog') + requirePermission('manage_blog')), so these child
 * routes are left unguarded here to avoid checking the same permission twice. */
export const BLOG_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-blog-list/admin-blog-list').then((m) => m.AdminBlogList),
  },
  {
    path: 'novi',
    loadComponent: () => import('./components/admin-blog-form/admin-blog-form').then((m) => m.AdminBlogForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/admin-blog-form/admin-blog-form').then((m) => m.AdminBlogForm),
  },
  {
    path: ':id/pregled',
    loadComponent: () => import('./components/admin-blog-detail/admin-blog-detail').then((m) => m.AdminBlogDetail),
  },
];
