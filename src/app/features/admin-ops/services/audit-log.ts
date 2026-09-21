import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { AuditLogEntry, AuditLogFilterParams } from '../models/audit-log';

/** `admin/audit-log`, permission `view_logs`. Read-only, raw Mongoose docs -
 * see models/audit-log.ts's header comment. meta.availableActions (alongside
 * the usual page/limit/total/totalPages) populates the action filter. */
@Injectable({ providedIn: 'root' })
export class AdminAuditLog {
  private api = inject(Api);

  list(params: AuditLogFilterParams): Observable<{ data: AuditLogEntry[]; meta?: { page: number; limit: number; total: number; totalPages: number; availableActions: string[] } }> {
    return this.api.getList<AuditLogEntry[]>('admin/audit-log', params) as Observable<{
      data: AuditLogEntry[];
      meta?: { page: number; limit: number; total: number; totalPages: number; availableActions: string[] };
    }>;
  }
}
