import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { PartnerDashboard as PartnerDashboardModel } from '../models/dashboard';

/** GET /partner/dashboard - see partner-guard.ts for the isPartner gating this
 * whole feature sits behind. */
@Injectable({ providedIn: 'root' })
export class PartnerDashboardService {
  private api = inject(Api);

  get(): Observable<PartnerDashboardModel> {
    return this.api.get<PartnerDashboardModel>('partner/dashboard');
  }
}
