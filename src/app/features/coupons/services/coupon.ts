import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { CouponAdminDetail, CouponAdminListItem, CouponEditPayload, CouponWritePayload } from '../models/coupon';

/** Method names mirror the backend's admin-coupons routes - listAdmin ⇄
 * listCoupons, getForEdit ⇄ getCouponForEdit, etc. (see category.ts for the same
 * convention). Permission `manage_coupons`, module `coupons`. */
@Injectable({ providedIn: 'root' })
export class Coupon {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: CouponAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<CouponAdminListItem[]>('admin/coupons', params);
  }

  /** Display shape - GET /admin/coupons/:id. Fine for a read-only detail view,
   * NOT for a form (see this feature's models/coupon.ts header comment about the
   * :id / :id/edit split fix). */
  getById(id: string): Observable<CouponAdminDetail> {
    return this.api.get<CouponAdminDetail>(`admin/coupons/${id}`);
  }

  /** Raw/edit shape - GET /admin/coupons/:id/edit. Use this to populate the admin form. */
  getForEdit(id: string): Observable<CouponEditPayload> {
    return this.api.get<CouponEditPayload>(`admin/coupons/${id}/edit`);
  }

  create(payload: CouponWritePayload): Observable<CouponEditPayload> {
    return this.api.post<CouponEditPayload>('admin/coupons', payload);
  }

  update(id: string, payload: CouponWritePayload): Observable<CouponEditPayload> {
    return this.api.put<CouponEditPayload>(`admin/coupons/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/coupons/${id}`);
  }
}
