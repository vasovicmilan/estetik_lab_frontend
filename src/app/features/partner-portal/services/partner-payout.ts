import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { PartnerPayoutRequest, PartnerPayoutRequestPayload } from '../models/payout';

/** GET/POST /partner/payouts - see payout.ts's header comment for the raw/
 * unformatted response shape. */
@Injectable({ providedIn: 'root' })
export class PartnerPayoutService {
  private api = inject(Api);

  list(params: FilterParams): Observable<{ data: PartnerPayoutRequest[]; meta?: ApiMeta }> {
    return this.api.getList<PartnerPayoutRequest[]>('partner/payouts', params);
  }

  request(amount: number): Observable<{ message: string }> {
    const payload: PartnerPayoutRequestPayload = { amount };
    return this.api.post<{ message: string }>('partner/payouts', payload);
  }
}
