import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import {
  EmployeeAppointmentDetail,
  EmployeeAppointmentListItem,
  EmployeeAppointmentNoShowPayload,
  EmployeeAppointmentRejectPayload,
  EmployeeAppointmentReschedulePayload,
} from '../models/appointment';

/** Named `EmployeeAppointment` (not `Appointment`) to avoid colliding with the
 * admin feature's Appointment service (features/appointments/services/appointment.ts)
 * and the account feature's MyAppointment service - three different endpoints
 * (/admin/appointments, /me/appointments, /employee/appointments), three
 * different actors, three different action sets on the same underlying model. */
@Injectable({ providedIn: 'root' })
export class EmployeeAppointment {
  private api = inject(Api);

  list(params: FilterParams): Observable<{ data: EmployeeAppointmentListItem[]; meta?: ApiMeta }> {
    return this.api.getList<EmployeeAppointmentListItem[]>('employee/appointments', params);
  }

  getById(id: string): Observable<EmployeeAppointmentDetail> {
    return this.api.get<EmployeeAppointmentDetail>(`employee/appointments/${id}`);
  }

  confirm(id: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`employee/appointments/${id}/confirm`, {});
  }

  reject(id: string, reason: string): Observable<{ message: string }> {
    const payload: EmployeeAppointmentRejectPayload = { reason };
    return this.api.post<{ message: string }>(`employee/appointments/${id}/reject`, payload);
  }

  complete(id: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`employee/appointments/${id}/complete`, {});
  }

  noShow(id: string, note: string): Observable<{ message: string }> {
    const payload: EmployeeAppointmentNoShowPayload = { note };
    return this.api.post<{ message: string }>(`employee/appointments/${id}/no-show`, payload);
  }

  reschedule(id: string, newStartTime: string): Observable<EmployeeAppointmentDetail> {
    const payload: EmployeeAppointmentReschedulePayload = { newStartTime };
    return this.api.post<EmployeeAppointmentDetail>(`employee/appointments/${id}/reschedule`, payload);
  }
}
