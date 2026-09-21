import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { ResourceAdminDetail, ResourceAdminListItem, ResourceEditPayload } from '../models/resource';

/** Method names mirror the backend's admin-taxonomy.routes.js - listAdmin ⇄
 * listResources, getForEdit ⇄ getResourceForEdit, etc. No image upload for
 * resources. Every endpoint sits behind requireModule("booking") server-side. */
@Injectable({ providedIn: 'root' })
export class Resource {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: ResourceAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<ResourceAdminListItem[]>('admin/resources', params);
  }

  /** Display shape - GET /admin/resources/:id. Fine for a read-only detail view, NOT for a form. */
  getById(id: string): Observable<ResourceAdminDetail> {
    return this.api.get<ResourceAdminDetail>(`admin/resources/${id}`);
  }

  /** Raw/edit shape - GET /admin/resources/:id/edit. Use this to populate the admin form. */
  getForEdit(id: string): Observable<ResourceEditPayload> {
    return this.api.get<ResourceEditPayload>(`admin/resources/${id}/edit`);
  }

  create(payload: ResourceEditPayload): Observable<ResourceEditPayload> {
    return this.api.post<ResourceEditPayload>('admin/resources', payload);
  }

  update(id: string, payload: ResourceEditPayload): Observable<ResourceEditPayload> {
    return this.api.put<ResourceEditPayload>(`admin/resources/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/resources/${id}`);
  }
}
