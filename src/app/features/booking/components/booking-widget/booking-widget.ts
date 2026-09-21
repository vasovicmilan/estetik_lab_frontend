import { Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { Booking } from '../../services/booking';
import { BookingSlot, BookingSlotsResponse } from '../../models/booking';

/**
 * Embedded in a service's detail page (see services-catalog's service-detail
 * component) once a visitor picks a variant to book. Two-step flow matching the
 * backend's two-call design (see booking.ts's header comment): pick a date ->
 * browse that day's open slots -> pick a slot -> fill contact details -> confirm.
 * Open to guests (no login required - contact details are collected directly,
 * exactly like the web flow); a logged-in visitor gets the appointment attached to
 * their account automatically (handled server-side from the Bearer token, nothing
 * extra needed here).
 */
@Component({
  selector: 'app-booking-widget',
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './booking-widget.html',
  styleUrl: './booking-widget.scss',
})
export class BookingWidget {
  private fb = inject(FormBuilder);
  private booking = inject(Booking);

  serviceSlug = input.required<string>();
  servicePackageId = input.required<string>();
  variantName = input<string>('');

  today = new Date().toISOString().slice(0, 10);
  selectedDate = signal(this.today);
  loadingSlots = signal(false);
  slotsResponse = signal<BookingSlotsResponse | null>(null);
  selectedSlot = signal<BookingSlot | null>(null);

  confirming = signal(false);
  confirmedAppointmentId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

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

  onDateChange(value: string): void {
    this.selectedDate.set(value);
    this.selectedSlot.set(null);
    this.loadSlots();
  }

  loadSlots(): void {
    this.loadingSlots.set(true);
    this.errorMessage.set(null);
    this.booking
      .getSlots(this.serviceSlug(), this.servicePackageId(), this.selectedDate())
      .pipe(finalize(() => this.loadingSlots.set(false)))
      .subscribe({
        next: (res) => this.slotsResponse.set(res),
        error: (error) => this.errorMessage.set(error?.message || 'Greška pri učitavanju termina.'),
      });
  }

  pickSlot(slot: BookingSlot): void {
    this.selectedSlot.set(slot);
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
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

    this.booking
      .confirm({
        serviceId: this.slotsResponse()!.service.id,
        servicePackageId: this.servicePackageId(),
        employeeId: slot.employeeId,
        startTime: slot.startTime,
        firstName: firstName!,
        lastName: lastName || undefined,
        email: email!,
        phone: phone!,
        note: note || undefined,
        nickname: nickname || undefined,
      })
      .pipe(finalize(() => this.confirming.set(false)))
      .subscribe({
        next: (res) => this.confirmedAppointmentId.set(res.appointment.id),
        error: (error) => this.errorMessage.set(error?.message || 'Zakazivanje nije uspelo. Pokušajte ponovo.'),
      });
  }
}
