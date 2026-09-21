import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import {
  BookingConfirmPayload,
  BookingConfirmResponse,
  BookingCouponCheckResponse,
  BookingReferralCodeResponse,
  BookingSlotsResponse,
} from '../models/booking';

@Injectable({ providedIn: 'root' })
export class Booking {
  private api = inject(Api);

  getSlots(serviceSlug: string, servicePackageId: string, date: string, employeeId?: string): Observable<BookingSlotsResponse> {
    return this.api.get<BookingSlotsResponse>(`booking/${serviceSlug}/slots`, { servicePackageId, date, employeeId });
  }

  confirm(payload: BookingConfirmPayload): Observable<BookingConfirmResponse> {
    return this.api.post<BookingConfirmResponse>('booking/confirm', payload);
  }

  /** Best-effort - a visitor with no captured referral code just gets { code: null }. */
  getReferralCode(): Observable<BookingReferralCodeResponse> {
    return this.api.get<BookingReferralCodeResponse>('booking/referral-code');
  }

  checkCoupon(code: string, serviceId: string, servicePackageId: string): Observable<BookingCouponCheckResponse> {
    return this.api.post<BookingCouponCheckResponse>('booking/coupon/check', { code, serviceId, servicePackageId });
  }
}
