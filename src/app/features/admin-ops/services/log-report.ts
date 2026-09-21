import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { LogSummary } from '../models/log-summary';

/** `admin/logs`, permission `view_logs`. Read-only traffic/error digest -
 * today's live summary plus a paginated archive of past daily summaries. */
@Injectable({ providedIn: 'root' })
export class AdminLogReport {
  private api = inject(Api);

  getLive(): Observable<LogSummary> {
    return this.api.get<LogSummary>('admin/logs');
  }

  listHistory(params: FilterParams): Observable<{ data: LogSummary[]; meta?: ApiMeta }> {
    return this.api.getList<LogSummary[]>('admin/logs/history', params);
  }

  /** date = "YYYY-MM-DD". 404s (surfaced as an error) when no summary was
   * stored for that day - caller shows a friendly message instead of the raw
   * error. */
  getByDate(date: string): Observable<LogSummary> {
    return this.api.get<LogSummary>(`admin/logs/history/${date}`);
  }
}
