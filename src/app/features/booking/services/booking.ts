import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { BookingConfirmPayload, BookingConfirmResponse, BookingSlotsResponse } from '../models/booking';

@Injectable({ providedIn: 'root' })
export class Booking {
  private api = inject(Api);

  getSlots(serviceSlug: string, servicePackageId: string, date: string, employeeId?: string): Observable<BookingSlotsResponse> {
    return this.api.get<BookingSlotsResponse>(`booking/${serviceSlug}/slots`, { servicePackageId, date, employeeId });
  }

  confirm(payload: BookingConfirmPayload): Observable<BookingConfirmResponse> {
    return this.api.post<BookingConfirmResponse>('booking/confirm', payload);
  }
}
