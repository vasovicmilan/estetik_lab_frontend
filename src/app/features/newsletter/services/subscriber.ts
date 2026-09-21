import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { SubscriberAdminDetail, SubscriberAdminListItem, SubscriberSubmitPayload } from '../models/subscriber';

/** Method names mirror the backend's admin-newsletter-subscribers routes (see
 * category.ts for the same convention). Permission `manage_marketing`, NOT
 * module-gated. No admin create/update here - subscribers sign themselves up
 * publicly (see subscribe() below, hitting the separate unauthenticated
 * POST /newsletter-subscribe) and unsubscribe themselves; admin can only view
 * and delete. Same "one service, admin + public sections" split as
 * features/blog/services/post.ts's Post service. */
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

  // ---- Public ----

  subscribe(payload: SubscriberSubmitPayload): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('newsletter-subscribe', payload);
  }
}
