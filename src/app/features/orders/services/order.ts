import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { OrderAdminDetail, OrderAdminListItem, OrderContactUpdatePayload } from '../models/order';

/** Method names mirror the backend's own admin-orders routes (see
 * admin-orders.controller.js) - permission `manage_orders`, module `shop`.
 *
 * All the PUT status-transition calls return `{success: true, data: {...}}` with
 * either a `{message}` or the updated order - treated loosely as `unknown` here,
 * same as appointment.ts does for its own no-body transitions; callers refetch
 * the order detail after a successful action instead of trusting this shape. */
@Injectable({ providedIn: 'root' })
export class Order {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: OrderAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<OrderAdminListItem[]>('admin/orders', params);
  }

  getById(id: string): Observable<OrderAdminDetail> {
    return this.api.get<OrderAdminDetail>(`admin/orders/${id}`);
  }

  markProcessing(id: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/orders/${id}/process`, {});
  }

  markShipped(id: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/orders/${id}/ship`, {});
  }

  markDelivered(id: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/orders/${id}/deliver`, {});
  }

  markCompleted(id: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/orders/${id}/complete`, {});
  }

  markReturned(id: string, reason?: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/orders/${id}/return`, { reason });
  }

  markRefunded(id: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/orders/${id}/refund`, {});
  }

  cancel(id: string, reason?: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/orders/${id}/cancel`, { reason });
  }

  reopen(id: string): Observable<unknown> {
    return this.api.put<unknown>(`admin/orders/${id}/reopen`, {});
  }

  updateContact(id: string, payload: OrderContactUpdatePayload): Observable<unknown> {
    return this.api.put<unknown>(`admin/orders/${id}/contact`, payload);
  }
}
