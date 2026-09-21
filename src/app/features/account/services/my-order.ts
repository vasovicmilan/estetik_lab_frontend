import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { MyOrderDetail, MyOrderListItem } from '../models/order';

/** Named `MyOrder` (not `Order`) to avoid colliding with the admin feature's
 * Order service (features/orders/services/order.ts) - these hit different
 * endpoints (/me/orders vs /admin/orders) with different response shapes. */
@Injectable({ providedIn: 'root' })
export class MyOrder {
  private api = inject(Api);

  list(params: FilterParams): Observable<{ data: MyOrderListItem[]; meta?: ApiMeta }> {
    return this.api.getList<MyOrderListItem[]>('me/orders', params);
  }

  getById(id: string): Observable<MyOrderDetail> {
    return this.api.get<MyOrderDetail>(`me/orders/${id}`);
  }

  cancel(id: string, reason?: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`me/orders/${id}/cancel`, { reason });
  }
}
