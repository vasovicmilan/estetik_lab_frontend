import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta, ApiResponse } from '../../../core/models/api-response';
import { ImageReference } from '../../../core/models/upload';
import { FilterParams } from '../../../core/models/filter-params';
import { PostAdminDetail, PostAdminListItem, PostCard, PostDetail, PostEditPayload } from '../models/post';

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

  /** GET /admin/posts/:id - unlike every other admin feature in this app, this
   * endpoint already returns the raw/edit shape directly (postService's
   * getPostForEdit), not a separate display shape - there never was a
   * display/edit split to close with a :id/edit route here. Named getForEdit()
   * anyway for consistency with Service/Package/Product/Expert. */
  getForEdit(id: string): Observable<PostEditPayload> {
    return this.api.get<PostEditPayload>(`admin/posts/${id}`);
  }

  /** Same GET /admin/posts/:id as getForEdit() above, but read as the
   * Serbian-keyed, pre-formatted DISPLAY shape (mapPostForAdminDetail) for a
   * read-only detail view - NOT safe to feed back into the form. */
  getById(id: string): Observable<PostAdminDetail> {
    return this.api.get<PostAdminDetail>(`admin/posts/${id}`);
  }

  create(payload: PostEditPayload): Observable<PostEditPayload> {
    return this.api.post<PostEditPayload>('admin/posts', payload);
  }

  update(id: string, payload: PostEditPayload): Observable<PostEditPayload> {
    return this.api.put<PostEditPayload>(`admin/posts/${id}`, payload);
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

  list(params: { category?: string; tag?: string; search?: string; page?: number }): Observable<{ data: PostCard[]; meta?: ApiMeta }> {
    return this.api.getList<PostCard[]>('blog/posts', params);
  }

  getBySlugWithSeo(slug: string): Observable<ApiResponse<PostDetail>> {
    return this.api.getWithSeo<PostDetail>(`blog/posts/${slug}`);
  }
}
