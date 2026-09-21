import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { PayoutRequest, PayoutRequestPayload } from '../models/payout';

/** GET/POST /employee/payouts - see payout.ts's header comment for the raw/
 * unformatted response shape. */
@Injectable({ providedIn: 'root' })
export class EmployeePayout {
  private api = inject(Api);

  list(params: FilterParams): Observable<{ data: PayoutRequest[]; meta?: ApiMeta }> {
    return this.api.getList<PayoutRequest[]>('employee/payouts', params);
  }

  request(amount: number): Observable<{ message: string }> {
    const payload: PayoutRequestPayload = { amount };
    return this.api.post<{ message: string }>('employee/payouts', payload);
  }
}
