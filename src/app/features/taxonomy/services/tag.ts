import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { TagAdminDetail, TagAdminListItem, TagEditPayload } from '../models/tag';

/** Method names mirror the backend's admin-taxonomy.routes.js - listAdmin ⇄
 * listTags, getForEdit ⇄ getTagForEdit, etc. No image upload for tags. */
@Injectable({ providedIn: 'root' })
export class Tag {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: TagAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<TagAdminListItem[]>('admin/tags', params);
  }

  /** Display shape - GET /admin/tags/:id. Fine for a read-only detail view, NOT for a form. */
  getById(id: string): Observable<TagAdminDetail> {
    return this.api.get<TagAdminDetail>(`admin/tags/${id}`);
  }

  /** Raw/edit shape - GET /admin/tags/:id/edit. Use this to populate the admin form. */
  getForEdit(id: string): Observable<TagEditPayload> {
    return this.api.get<TagEditPayload>(`admin/tags/${id}/edit`);
  }

  create(payload: TagEditPayload): Observable<TagEditPayload> {
    return this.api.post<TagEditPayload>('admin/tags', payload);
  }

  update(id: string, payload: TagEditPayload): Observable<TagEditPayload> {
    return this.api.put<TagEditPayload>(`admin/tags/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/tags/${id}`);
  }
}
