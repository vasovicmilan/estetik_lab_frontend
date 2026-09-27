import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { RoleAdminDetail, RoleAdminListItem, RoleEditPayload, toEditPayload } from '../models/role';

/** Method names mirror the backend's admin-taxonomy.routes.js Roles section
 * (permission `manage_roles`, not module-gated). No getForEdit() here - unlike
 * Category/Tag/Resource, the backend has no GET /admin/roles/:id/edit route,
 * so getForEdit() loads the same detail shape getById() does and reshapes it
 * with toEditPayload() (see models/role.ts's header comment). */
@Injectable({ providedIn: 'root' })
export class Role {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: RoleAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<RoleAdminListItem[]>('admin/roles', params);
  }

  /** Detail shape - GET /admin/roles/:id. Fine for a read-only detail view. */
  getById(id: string): Observable<RoleAdminDetail> {
    return this.api.get<RoleAdminDetail>(`admin/roles/${id}`);
  }

  /** Same GET /admin/roles/:id, reshaped into the flat write payload so the
   * form can patch itself the same way every other admin form does. */
  getForEdit(id: string): Observable<RoleEditPayload> {
    return this.getById(id).pipe(map(toEditPayload));
  }

  create(payload: RoleEditPayload): Observable<RoleAdminDetail> {
    return this.api.post<RoleAdminDetail>('admin/roles', payload);
  }

  update(id: string, payload: RoleEditPayload): Observable<RoleAdminDetail> {
    return this.api.put<RoleAdminDetail>(`admin/roles/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/roles/${id}`);
  }
}
