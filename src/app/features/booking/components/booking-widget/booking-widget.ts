import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { Booking } from '../../services/booking';
import { BookingCouponCheckResponse, BookingSlot, BookingSlotsResponse } from '../../models/booking';

export interface BookingWidgetDialogData {
  serviceSlug: string;
  servicePackageId: string;
  variantName?: string;
}

// Sentinel used by the employee button-toggle group's "any therapist" option -
// null itself can't be a mat-button-toggle value here since it's also the value
// selectedSlot()'s own employeeId legitimately takes (auto-assignable slot).
const ANY_EMPLOYEE = '__any__';

/**
 * Opened as a MatDialog from a service's detail page (see services-catalog's
 * service-detail component) once a visitor picks a variant to book - see
 * service-detail.ts's openBookingDialog(). Two-step flow matching the backend's
 * two-call design (see booking.ts's header comment): pick a date -> browse that
 * day's open slots -> pick a slot -> fill contact details -> confirm. Open to
 * guests (no login required - contact details are collected directly, exactly
 * like the web flow); a logged-in visitor gets the appointment attached to their
 * account automatically (handled server-side from the Bearer token, nothing
 * extra needed here).
 *
 * This component is only ever used inside a dialog (confirmed - service-detail is
 * the only place it was embedded), so its inputs are read from MAT_DIALOG_DATA
 * rather than as component inputs.
 *
 * Coupon/referral + package-purchase support (added after an audit against the
 * backend contract found these missing entirely): a referral code captured
 * from a ?code= link (coupon-capture.middleware.js) lives in an httpOnly
 * cookie, so it can't be read directly by this component - GET
 * booking/referral-code is the backend telling us what it captured, which is
 * then pre-filled AND auto-checked here, mirroring what the web flow does
 * automatically server-side via req.session. A logged-in visitor who already
 * owns a usable package for this exact service+variant (slotsResponse().
 * usablePackagePurchase) can pay from it instead - mutually exclusive with a
 * coupon, same rule bookAppointment enforces server-side.
 */
@Component({
  selector: 'app-booking-widget',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './booking-widget.html',
  styleUrl: './booking-widget.scss',
})
export class BookingWidget implements OnInit {
  private fb = inject(FormBuilder);
  private booking = inject(Booking);
  private dialogRef = inject(MatDialogRef<BookingWidget>);
  private data = inject<BookingWidgetDialogData>(MAT_DIALOG_DATA);

  serviceSlug = this.data.serviceSlug;
  servicePackageId = this.data.servicePackageId;
  variantName = this.data.variantName || '';

  readonly anyEmployee = ANY_EMPLOYEE;

  today = new Date().toISOString().slice(0, 10);
  selectedDate = signal(this.today);
  loadingSlots = signal(false);
  slotsResponse = signal<BookingSlotsResponse | null>(null);
  selectedSlot = signal<BookingSlot | null>(null);
  selectedEmployeeId = signal<string>(ANY_EMPLOYEE);

  confirming = signal(false);
  confirmedAppointmentId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Coupon/referral state (see this component's header comment).
  couponCode = signal('');
  couponResult = signal<BookingCouponCheckResponse | null>(null);
  couponChecking = signal(false);
  couponError = signal<string | null>(null);
  usePackagePurchase = signal(false);
  /** A referral code fetched from the backend before slots finish loading -
   * applied once slotsResponse() is actually available (checkCoupon needs
   * the service id from it). Handles either call resolving first. */
  private pendingReferralCode: string | null = null;

  // getSlots() is now always called WITH the current employeeId filter (see
  // loadSlots()) - the merged "any therapist" view intentionally never puts a
  // real employeeId on a slot (see booking.controller.js's own comment: never
  // guess which of several free therapists to book), so client-side filtering
  // by employeeId against that merged response never actually matched
  // anything - this used to make picking a specific therapist show zero
  // slots. Slots are now correctly employee-specific by construction, so this
  // just reads straight from the response.
  visibleSlots = computed(() => this.slotsResponse()?.slots ?? []);

  contactForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]],
    note: ['', [Validators.maxLength(500)]],
    // Honeypot - stays empty for real visitors, styled off-screen in the template
    // rather than display:none (some bots skip hidden fields specifically).
    nickname: [''],
  });

  close(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.loadSlots();
    // Best-effort - a visitor with nothing captured just gets { code: null },
    // never surfaced as an error (matches tryApplyCoupon's own "never throws"
    // reasoning on the backend for the same auto-apply-on-load flow).
    this.booking.getReferralCode().subscribe({
      next: (res) => {
        if (!res.code) return;
        this.pendingReferralCode = res.code;
        if (this.slotsResponse()) this.applyPendingReferralCode();
      },
      error: () => undefined,
    });
  }

  private applyPendingReferralCode(): void {
    const code = this.pendingReferralCode;
    this.pendingReferralCode = null;
    if (!code || this.couponCode()) return;
    this.couponCode.set(code);
    this.checkCoupon();
  }

  onDateChange(value: string): void {
    this.selectedDate.set(value);
    this.selectedSlot.set(null);
    this.loadSlots();
  }

  onEmployeeChange(employeeId: string): void {
    this.selectedEmployeeId.set(employeeId);
    // The previously-selected slot may not belong to the newly-selected
    // therapist - always clear it rather than trying to validate it against
    // the freshly (re)loaded list.
    this.selectedSlot.set(null);
    this.loadSlots();
  }

  loadSlots(): void {
    this.loadingSlots.set(true);
    this.errorMessage.set(null);
    const employeeId = this.selectedEmployeeId() === ANY_EMPLOYEE ? undefined : this.selectedEmployeeId();
    this.booking
      .getSlots(this.serviceSlug, this.servicePackageId, this.selectedDate(), employeeId)
      .pipe(finalize(() => this.loadingSlots.set(false)))
      .subscribe({
        next: (res) => {
          this.slotsResponse.set(res);
          if (this.pendingReferralCode) this.applyPendingReferralCode();
        },
        error: (error) => this.errorMessage.set(error?.message || 'Greška pri učitavanju termina.'),
      });
  }

  pickSlot(slot: BookingSlot): void {
    this.selectedSlot.set(slot);
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
  }

  checkCoupon(): void {
    const code = this.couponCode().trim();
    const res = this.slotsResponse();
    if (!code || !res) return;

    this.couponChecking.set(true);
    this.couponError.set(null);
    this.booking
      .checkCoupon(code, res.service.id, this.servicePackageId)
      .pipe(finalize(() => this.couponChecking.set(false)))
      .subscribe({
        next: (result) => this.couponResult.set(result),
        error: (error) => {
          this.couponResult.set(null);
          this.couponError.set(error?.message || 'Kod kupona nije važeći.');
        },
      });
  }

  clearCoupon(): void {
    this.couponCode.set('');
    this.couponResult.set(null);
    this.couponError.set(null);
  }

  togglePackagePurchase(use: boolean): void {
    this.usePackagePurchase.set(use);
    // Mutually exclusive with a coupon, same as bookAppointment enforces
    // server-side (see appointment.service.js's header comment).
    if (use) this.clearCoupon();
  }

  submit(): void {
    const slot = this.selectedSlot();
    if (!slot || this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.confirming.set(true);
    this.errorMessage.set(null);
    const { firstName, lastName, email, phone, note, nickname } = this.contactForm.getRawValue();
    const usePackagePurchase = this.usePackagePurchase();
    const packagePurchaseId = usePackagePurchase ? (this.slotsResponse()?.usablePackagePurchase?.id as string | undefined) : undefined;
    // Only sent once checkCoupon() actually confirmed the code works - typing
    // something and hitting "Potvrdi zakazivanje" without checking it first
    // just books without a discount, same as leaving the field empty.
    const couponCode = !usePackagePurchase && this.couponResult() ? this.couponCode().trim() : undefined;

    this.booking
      .confirm({
        serviceId: this.slotsResponse()!.service.id,
        servicePackageId: this.servicePackageId,
        // getSlots() is now always called with the current employee filter
        // (see loadSlots()), so every returned slot already carries the
        // correct employeeId - null for "any therapist" (bookAppointment's
        // own resolveEmployeeAssignment decides), or the specifically chosen
        // therapist's id otherwise. No extra branching needed here anymore.
        employeeId: slot.employeeId,
        startTime: slot.startTime,
        firstName: firstName!,
        lastName: lastName || undefined,
        email: email!,
        phone: phone!,
        note: note || undefined,
        couponCode,
        packagePurchaseId,
        nickname: nickname || undefined,
      })
      .pipe(finalize(() => this.confirming.set(false)))
      .subscribe({
        next: (res) => this.confirmedAppointmentId.set(res.appointment.id),
        error: (error) => this.errorMessage.set(error?.message || 'Zakazivanje nije uspelo. Pokušajte ponovo.'),
      });
  }
}
