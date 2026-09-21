import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { PartnerAdminDetail, PartnerAdminListItem, PartnerCreatePayload, PartnerEditPayload, PartnerUpdatePayload } from '../models/partner';

/** Method names mirror the backend's admin-partners routes - listAdmin ⇄
 * listPartners, getForEdit ⇄ getPartnerForEdit, etc. (see employee.ts/category.ts
 * for the same convention). Permission `manage_partners`, module `partners`. */
@Injectable({ providedIn: 'root' })
export class Partner {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: PartnerAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<PartnerAdminListItem[]>('admin/partners', params);
  }

  /** Display shape - GET /admin/partners/:id. Fine for a read-only detail view, NOT for a form. */
  getById(id: string): Observable<PartnerAdminDetail> {
    return this.api.get<PartnerAdminDetail>(`admin/partners/${id}`);
  }

  /** Raw/edit shape - GET /admin/partners/:id/edit. Use this to populate the admin form. */
  getForEdit(id: string): Observable<PartnerEditPayload> {
    return this.api.get<PartnerEditPayload>(`admin/partners/${id}/edit`);
  }

  create(payload: PartnerCreatePayload): Observable<PartnerEditPayload> {
    return this.api.post<PartnerEditPayload>('admin/partners', payload);
  }

  update(id: string, payload: PartnerUpdatePayload): Observable<PartnerEditPayload> {
    return this.api.put<PartnerEditPayload>(`admin/partners/${id}`, payload);
  }

  /** Backend blocks deletion (400) if the partner has a pending commission or
   * unresolved payout - caller surfaces error.message as-is, same pattern as
   * admin-user-detail's delete(). */
  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/partners/${id}`);
  }
}
