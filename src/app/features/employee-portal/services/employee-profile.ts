import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { EmployeeSelfProfile, EmployeeWorkingHoursUpdatePayload } from '../models/profile';
import { EmployeeWorkingHoursEntry } from '../../employees/models/employee';

/** GET /employee/profile + PUT /employee/profile/working-hours - the logged-in
 * employee's own profile/working-hours, distinct from the admin feature's
 * Employee service (features/employees/services/employee.ts), which manages
 * ANY employee and requires manage_employees. */
@Injectable({ providedIn: 'root' })
export class EmployeeProfile {
  private api = inject(Api);

  get(): Observable<EmployeeSelfProfile> {
    return this.api.get<EmployeeSelfProfile>('employee/profile');
  }

  updateWorkingHours(workingHours: EmployeeWorkingHoursEntry[]): Observable<{ message: string }> {
    const payload: EmployeeWorkingHoursUpdatePayload = { workingHours };
    return this.api.put<{ message: string }>('employee/profile/working-hours', payload);
  }
}
