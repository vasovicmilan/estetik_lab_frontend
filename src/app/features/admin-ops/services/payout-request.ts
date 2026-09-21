import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { PayoutActionPayload, PayoutDirectPayload, PayoutRequestAdminDetail, PayoutRequestAdminListItem } from '../models/payout-request';

/** Admin-facing management of payout requests from both employees and
 * partners - `admin/payout-requests`, permission `manage_payouts`. Distinct
 * from the earner's own self-service payout services (employee-portal's
 * EmployeePayout, partner-portal's PartnerPayout). */
@Injectable({ providedIn: 'root' })
export class AdminPayoutRequest {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: PayoutRequestAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<PayoutRequestAdminListItem[]>('admin/payout-requests', params);
  }

  getById(requestId: string): Observable<PayoutRequestAdminDetail> {
    return this.api.get<PayoutRequestAdminDetail>(`admin/payout-requests/${requestId}`);
  }

  /** Only valid when statusRaw === 'requested'. */
  approve(requestId: string, payload: PayoutActionPayload): Observable<PayoutRequestAdminDetail> {
    return this.api.put<PayoutRequestAdminDetail>(`admin/payout-requests/${requestId}/approve`, payload);
  }

  /** Valid when statusRaw is 'requested' or 'approved'. */
  pay(requestId: string, payload: PayoutActionPayload): Observable<PayoutRequestAdminDetail> {
    return this.api.put<PayoutRequestAdminDetail>(`admin/payout-requests/${requestId}/pay`, payload);
  }

  /** Invalid when statusRaw === 'paid'. */
  reject(requestId: string, payload: PayoutActionPayload): Observable<PayoutRequestAdminDetail> {
    return this.api.put<PayoutRequestAdminDetail>(`admin/payout-requests/${requestId}/reject`, payload);
  }

  /** Directly records an already-happened payout, skipping the request step -
   * 201 on success. */
  recordDirect(payload: PayoutDirectPayload): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('admin/payout-requests/direct', payload);
  }
}
