import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import {
  PackagePurchaseAdminDetail,
  PackagePurchaseAdminListItem,
  PackagePurchaseCheckCouponPayload,
  PackagePurchaseCouponPreview,
  PackagePurchaseCreatePayload,
  PackagePurchaseUpdatePayload,
} from '../models/package-purchase';

/** Method names mirror the backend's admin-package-purchases routes - permission
 * `manage_packages`. Named `PackagePurchase` (checked for a collision first: no
 * other `class PackagePurchase` or `PackagePurchase }` import exists in this
 * repo, so it's free and unambiguous here, same as User.ts's own note about
 * `User`). */
@Injectable({ providedIn: 'root' })
export class PackagePurchase {
  private api = inject(Api);

  list(params: FilterParams): Observable<{ data: PackagePurchaseAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<PackagePurchaseAdminListItem[]>('admin/package-purchases', params);
  }

  getById(id: string): Observable<PackagePurchaseAdminDetail> {
    return this.api.get<PackagePurchaseAdminDetail>(`admin/package-purchases/${id}`);
  }

  create(payload: PackagePurchaseCreatePayload): Observable<PackagePurchaseAdminDetail> {
    return this.api.post<PackagePurchaseAdminDetail>('admin/package-purchases', payload);
  }

  /** Live discount preview - does NOT redeem the coupon. Redemption happens
   * server-side as part of create() when `couponCode` is included in that
   * payload. */
  checkCoupon(payload: PackagePurchaseCheckCouponPayload): Observable<PackagePurchaseCouponPreview> {
    return this.api.post<PackagePurchaseCouponPreview>('admin/package-purchases/check-coupon', payload);
  }

  /** expiresAt/notes only - the only fields editable after creation. */
  update(id: string, payload: PackagePurchaseUpdatePayload): Observable<PackagePurchaseAdminDetail> {
    return this.api.put<PackagePurchaseAdminDetail>(`admin/package-purchases/${id}`, payload);
  }

  cancel(id: string): Observable<PackagePurchaseAdminDetail> {
    return this.api.put<PackagePurchaseAdminDetail>(`admin/package-purchases/${id}/cancel`, {});
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/package-purchases/${id}`);
  }
}
