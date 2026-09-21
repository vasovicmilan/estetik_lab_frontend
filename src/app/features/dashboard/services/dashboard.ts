import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { DashboardData } from '../models/dashboard';

/**
 * Named DashboardService rather than plain "Dashboard" (unlike most feature services
 * here, e.g. Service/Api) because the dashboard PAGE component is itself named
 * "Dashboard" (see components/dashboard/dashboard.ts, routed from app.routes.ts) -
 * keeping both "Dashboard" would make an unqualified import in that component
 * ambiguous/confusing even though the two live in different files.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(Api);

  get(): Observable<DashboardData> {
    return this.api.get<DashboardData>('admin/dashboard');
  }
}
