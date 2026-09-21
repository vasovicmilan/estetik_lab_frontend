import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { MyAppointmentDetail, MyAppointmentListItem, MyAppointmentReschedulePayload } from '../models/appointment';

/** Named `MyAppointment` (not `Appointment`) to avoid colliding with the admin
 * feature's Appointment service (features/appointments/services/appointment.ts) -
 * these hit different endpoints (/me/appointments vs /admin/appointments) with
 * different response shapes. */
@Injectable({ providedIn: 'root' })
export class MyAppointment {
  private api = inject(Api);

  list(params: FilterParams): Observable<{ data: MyAppointmentListItem[]; meta?: ApiMeta }> {
    return this.api.getList<MyAppointmentListItem[]>('me/appointments', params);
  }

  getById(id: string): Observable<MyAppointmentDetail> {
    return this.api.get<MyAppointmentDetail>(`me/appointments/${id}`);
  }

  cancel(id: string, reason?: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`me/appointments/${id}/cancel`, { reason });
  }

  reschedule(id: string, newStartTime: string): Observable<MyAppointmentDetail> {
    const payload: MyAppointmentReschedulePayload = { newStartTime };
    return this.api.post<MyAppointmentDetail>(`me/appointments/${id}/reschedule`, payload);
  }
}
