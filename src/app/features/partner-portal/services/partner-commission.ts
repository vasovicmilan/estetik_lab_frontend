import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { PartnerCommissionEntry } from '../models/commission';

/** GET /partner/commissions?status=&sourceType=&page=&limit= - raw/unmapped
 * data, see commission.ts's header comment for why the shape below is not
 * pre-formatted like the rest of this app's list endpoints. */
@Injectable({ providedIn: 'root' })
export class PartnerCommissionService {
  private api = inject(Api);

  list(params: FilterParams): Observable<{ data: PartnerCommissionEntry[]; meta?: ApiMeta }> {
    return this.api.getList<PartnerCommissionEntry[]>('partner/commissions', params);
  }
}
