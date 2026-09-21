import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { ContactAdminDetail, ContactAdminListItem, ContactStatus } from '../models/contact';

/** Method names mirror the backend's admin-contacts routes. Permission
 * `manage_marketing`, NOT module-gated. No create/update/delete beyond the
 * status transition - contact messages come from the public contact form and
 * the backend has no delete endpoint for them (see this feature's model
 * header comment). */
@Injectable({ providedIn: 'root' })
export class Contact {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: ContactAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<ContactAdminListItem[]>('admin/contacts', params);
  }

  /** GET /admin/contacts/:id - opening a message that is currently `new`
   * marks it `read` server-side as a side effect of this call, so the
   * returned `statusRaw` may already say "read" even though it was "new" a
   * moment ago. Callers that navigate back to the list should refetch. */
  getById(id: string): Observable<ContactAdminDetail> {
    return this.api.get<ContactAdminDetail>(`admin/contacts/${id}`);
  }

  /** PUT .../:id/status - for the transitions other than the automatic
   * new -> read one above (marking `replied` after emailing back manually,
   * archiving, or moving back to `new`). */
  updateStatus(id: string, status: ContactStatus): Observable<ContactAdminDetail> {
    return this.api.put<ContactAdminDetail>(`admin/contacts/${id}/status`, { status });
  }
}
