import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { ImageReference } from '../../../core/models/upload';
import { FilterParams } from '../../../core/models/filter-params';
import { CategoryAdminDetail, CategoryAdminListItem, CategoryEditPayload } from '../models/category';

/** Method names mirror the backend's admin-taxonomy.routes.js - listAdmin ⇄
 * listCategories, getForEdit ⇄ getCategoryForEdit, etc. (see services-catalog's
 * service.ts for the same convention). */
@Injectable({ providedIn: 'root' })
export class Category {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: CategoryAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<CategoryAdminListItem[]>('admin/categories', params);
  }

  /** Display shape - GET /admin/categories/:id. Fine for a read-only detail view, NOT for a form. */
  getById(id: string): Observable<CategoryAdminDetail> {
    return this.api.get<CategoryAdminDetail>(`admin/categories/${id}`);
  }

  /** Raw/edit shape - GET /admin/categories/:id/edit. Use this to populate the admin form. */
  getForEdit(id: string): Observable<CategoryEditPayload> {
    return this.api.get<CategoryEditPayload>(`admin/categories/${id}/edit`);
  }

  create(payload: CategoryEditPayload): Observable<CategoryEditPayload> {
    return this.api.post<CategoryEditPayload>('admin/categories', payload);
  }

  update(id: string, payload: CategoryEditPayload): Observable<CategoryEditPayload> {
    return this.api.put<CategoryEditPayload>(`admin/categories/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/categories/${id}`);
  }

  /** POST /api/v1/admin/uploads/categories - single image only, no gallery (see
   * admin-uploads.controller.js's TYPE_PERMISSIONS). */
  uploadImage(file: File): Observable<ImageReference> {
    return this.api.upload<ImageReference>('admin/uploads/categories', file, 'file');
  }
}
