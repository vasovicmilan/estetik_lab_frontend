import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta, ApiResponse } from '../../../core/models/api-response';
import { ImageReference } from '../../../core/models/upload';
import { FilterParams } from '../../../core/models/filter-params';
import { BlogFilters, PostAdminDetail, PostAdminListItem, PostCard, PostDetail, PostEditPayload } from '../models/post';

/** GET /api/v1/blog/posts, GET /api/v1/blog/posts/:slug - gated behind the "blog"
 * module (see catalog.routes.js). The /api/v1/admin/posts/* admin endpoints are
 * likewise gated behind requireModule('blog') + requirePermission('manage_blog'). */
@Injectable({ providedIn: 'root' })
export class Post {
  private api = inject(Api);

  // ---- Admin ----

  listAdmin(params: FilterParams): Observable<{ data: PostAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<PostAdminListItem[]>('admin/posts', params);
  }

  /** GET /admin/posts/:id/edit - raw/edit shape (mapPostForEdit), for loading
   * the admin form. Post used to have no separate /edit route and reused the
   * bare :id route for this, which broke the read-only detail view below
   * (its Serbian field bindings had nothing to match against the raw shape).
   * Now matches the Service/Package/Product/Expert :id/edit convention. */
  getForEdit(id: string): Observable<PostEditPayload> {
    return this.api.get<PostEditPayload>(`admin/posts/${id}/edit`);
  }

  /** GET /admin/posts/:id - Serbian-keyed, pre-formatted DISPLAY shape
   * (mapPostForAdminDetail) for the read-only detail view - NOT safe to feed
   * back into the form. */
  getById(id: string): Observable<PostAdminDetail> {
    return this.api.get<PostAdminDetail>(`admin/posts/${id}`);
  }

  create(payload: PostEditPayload): Observable<PostEditPayload> {
    return this.api.post<PostEditPayload>('admin/posts', payload);
  }

  update(id: string, payload: PostEditPayload): Observable<PostEditPayload> {
    return this.api.put<PostEditPayload>(`admin/posts/${id}`, payload);
  }

  /** PUT /admin/posts/:postId/seo - separate from create/update (see
   * updatePostSeo in admin-marketing.controller.js), takes flat
   * seoTitle/seoDescription/seoKeywords (comma-separated string or array),
   * not the nested PostSeo shape the rest of this app uses. */
  updateSeo(id: string, seo: { seoTitle?: string; seoDescription?: string; seoKeywords?: string }): Observable<PostEditPayload> {
    return this.api.put<PostEditPayload>(`admin/posts/${id}/seo`, seo);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/posts/${id}`);
  }

  /** POST /api/v1/admin/uploads/posts - see admin-uploads.routes.js. */
  uploadImage(file: File): Observable<ImageReference> {
    return this.api.upload<ImageReference>('admin/uploads/posts', file, 'file');
  }

  uploadGallery(files: File[]): Observable<ImageReference[]> {
    return this.api.uploadMultiple<ImageReference[]>('admin/uploads/posts/gallery', files, 'gallery');
  }

  // ---- Public ----

  list(params: { category?: string; tag?: string; search?: string; page?: number; limit?: number }): Observable<{ data: PostCard[]; meta?: ApiMeta }> {
    return this.api.getList<PostCard[]>('blog/posts', params);
  }

  /** GET /blog/filters - category pills (with post counts) + tag chips shown
   * above the blog grid, same on the plain list, a category archive, or a tag
   * archive - fetched once per page load, in parallel with list()/whatever
   * posts request that page also makes (see catalog.controller.js's
   * getBlogFilters for why this isn't just folded into list()). */
  getFilters(): Observable<BlogFilters> {
    return this.api.get<BlogFilters>('blog/filters');
  }

  getBySlugWithSeo(slug: string): Observable<ApiResponse<PostDetail>> {
    return this.api.getWithSeo<PostDetail>(`blog/posts/${slug}`);
  }
}
