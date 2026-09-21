import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { SubscriberAdminDetail, SubscriberAdminListItem } from '../models/subscriber';

/** Method names mirror the backend's admin-newsletter-subscribers routes (see
 * category.ts for the same convention). Permission `manage_marketing`, NOT
 * module-gated. No create/update here - subscribers sign themselves up
 * publicly and unsubscribe themselves; admin can only view and delete. */
@Injectable({ providedIn: 'root' })
export class Subscriber {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: SubscriberAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<SubscriberAdminListItem[]>('admin/newsletter-subscribers', params);
  }

  getById(id: string): Observable<SubscriberAdminDetail> {
    return this.api.get<SubscriberAdminDetail>(`admin/newsletter-subscribers/${id}`);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/newsletter-subscribers/${id}`);
  }
}
