import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { EmployeeAdminDetail, EmployeeAdminListItem, EmployeeEditPayload, EmployeeWorkingHoursEntry } from '../models/employee';

/** Method names mirror the backend's own admin-people routes for employees (see
 * admin-people.controller.js) - permission `manage_employees`, module `employees`.
 *
 * listAdmin only forwards isActive/page/limit - the backend's listEmployees
 * doesn't read a `search` query param at all (checked employee.repository.js's
 * findEmployees/buildEmployeeFilter), so no search filter is sent here even
 * though the task brief mentions one; sending it would just be silently
 * ignored server-side. */
@Injectable({ providedIn: 'root' })
export class Employee {
  private api = inject(Api);

  listAdmin(params: Omit<FilterParams, 'search'>): Observable<{ data: EmployeeAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<EmployeeAdminListItem[]>('admin/employees', params);
  }

  /** Display shape - GET /admin/employees/:id. Fine for a read-only detail view, NOT for a form. */
  getById(id: string): Observable<EmployeeAdminDetail> {
    return this.api.get<EmployeeAdminDetail>(`admin/employees/${id}`);
  }

  /** Raw/edit shape - GET /admin/employees/:id/edit. Use this to populate the admin form. */
  getForEdit(id: string): Observable<EmployeeEditPayload> {
    return this.api.get<EmployeeEditPayload>(`admin/employees/${id}/edit`);
  }

  create(payload: EmployeeEditPayload): Observable<EmployeeEditPayload> {
    return this.api.post<EmployeeEditPayload>('admin/employees', payload);
  }

  /** userId is NOT editable after creation - validateEmployeeUpdate doesn't even
   * accept it, so callers should build this payload without a userId field. */
  update(id: string, payload: Omit<EmployeeEditPayload, 'userId'>): Observable<EmployeeAdminDetail> {
    return this.api.put<EmployeeAdminDetail>(`admin/employees/${id}`, payload);
  }

  /** PUT .../working-hours - a convenience endpoint for a schedule-only quick
   * edit. Not used by admin-employee-form (which sends workingHours as part of
   * the normal create/update payload instead - see validateEmployeeCreate/
   * validateEmployeeUpdate, both accept it), kept here for completeness. */
  updateWorkingHours(id: string, workingHours: EmployeeWorkingHoursEntry[]): Observable<unknown> {
    return this.api.put<unknown>(`admin/employees/${id}/working-hours`, { workingHours });
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/employees/${id}`);
  }
}
