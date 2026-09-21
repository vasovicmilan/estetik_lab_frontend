import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { EmployeeDashboard as EmployeeDashboardModel } from '../models/dashboard';

/** GET /employee/dashboard - see employee-guard.ts for the isEmployee gating
 * this whole feature sits behind. */
@Injectable({ providedIn: 'root' })
export class EmployeeDashboard {
  private api = inject(Api);

  get(): Observable<EmployeeDashboardModel> {
    return this.api.get<EmployeeDashboardModel>('employee/dashboard');
  }
}
