import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { TemporaryOrderAdminDetail, TemporaryOrderAdminListItem } from '../models/temporary-order';

/** Method names mirror the backend's admin-temporary-orders routes - permission
 * `manage_orders`, no separate module gate (same as Order.ts).
 *
 * confirm() creates a real Order behind the scenes - its response is treated
 * loosely as `unknown`, same as order.ts's own status-transition calls; callers
 * navigate to the temporary-orders list on success instead of trusting this
 * shape. */
@Injectable({ providedIn: 'root' })
export class TemporaryOrder {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: TemporaryOrderAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<TemporaryOrderAdminListItem[]>('admin/temporary-orders', params);
  }

  getById(id: string): Observable<TemporaryOrderAdminDetail> {
    return this.api.get<TemporaryOrderAdminDetail>(`admin/temporary-orders/${id}`);
  }

  /** PUT .../:id/confirm - admin manually confirms the order on the customer's
   * behalf (e.g. they called in). Returns the newly created real Order. */
  confirm(id: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/temporary-orders/${id}/confirm`, {});
  }

  /** PUT .../:id/shipping - sets the real shipping cost on a freight-quote order,
   * unblocking the customer's own confirm link. */
  setShipping(id: string, shippingAmount: number): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`admin/temporary-orders/${id}/shipping`, { shippingAmount });
  }
}
