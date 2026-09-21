import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import {
  AppointmentAdminDetail,
  AppointmentAdminListItem,
  AppointmentReschedulePayload,
  EmployeePickerItem,
  ManualAppointmentPayload,
  ManualAppointmentResponse,
} from '../models/appointment';

/** Method names mirror the backend's own admin-appointments routes (see
 * admin-appointments.controller.js) - permission `manage_appointments_all`,
 * module `booking`. */
@Injectable({ providedIn: 'root' })
export class Appointment {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: AppointmentAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<AppointmentAdminListItem[]>('admin/appointments', params);
  }

  getById(id: string): Observable<AppointmentAdminDetail> {
    return this.api.get<AppointmentAdminDetail>(`admin/appointments/${id}`);
  }

  confirm(id: string): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`admin/appointments/${id}/confirm`, {});
  }

  reject(id: string, reason?: string): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`admin/appointments/${id}/reject`, { reason });
  }

  cancel(id: string, reason?: string): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`admin/appointments/${id}/cancel`, { reason });
  }

  complete(id: string): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`admin/appointments/${id}/complete`, {});
  }

  noShow(id: string, note?: string): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`admin/appointments/${id}/no-show`, { note });
  }

  reopen(id: string): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`admin/appointments/${id}/reopen`, {});
  }

  reassign(id: string, employeeId: string): Observable<{ message: string }> {
    return this.api.put<{ message: string }>(`admin/appointments/${id}/reassign`, { employeeId });
  }

  reschedule(id: string, newStartTime: string): Observable<AppointmentAdminDetail> {
    const payload: AppointmentReschedulePayload = { newStartTime };
    return this.api.put<AppointmentAdminDetail>(`admin/appointments/${id}/reschedule`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/appointments/${id}`);
  }

  createManual(payload: ManualAppointmentPayload): Observable<ManualAppointmentResponse> {
    return this.api.post<ManualAppointmentResponse>('admin/appointments/manual', payload);
  }

  /** GET /admin/employees?limit=200 - one-off fetch for the reassign/manual-create
   * pickers, not a full Employee feature (out of scope here - see this feature's
   * header comment). Requires `manage_employees`; an admin without it gets a 403,
   * which we swallow into an empty list so callers can just hide/disable the
   * picker instead of erroring the whole page. */
  listEmployeesForPicker(): Observable<EmployeePickerItem[]> {
    return this.api.getList<EmployeePickerItem[]>('admin/employees', { limit: 200 }).pipe(
      map((res) => res.data),
      catchError(() => of([] as EmployeePickerItem[]))
    );
  }
}
