import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { MyAppointment } from '../../services/my-appointment';
import { MyAppointmentDetail } from '../../models/appointment';

/** Read+act view of GET /me/appointments/:id - own-appointment detail, cancel
 * (inline reason textarea) and reschedule (datetime-local input), gated by
 * status the same way the admin appointment detail gates its own actions, but
 * only the subset a customer may do to their own appointment: no confirm/
 * reject/reassign/no-show/reopen/delete, those are staff-only transitions.
 * Mounted at /moj-nalog/zakazivanja/:id. */
@Component({
  selector: 'app-account-appointment-detail',
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './account-appointment-detail.html',
  styleUrl: './account-appointment-detail.scss',
})
export class AccountAppointmentDetail implements OnInit {
  private myAppointment = inject(MyAppointment);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  appointmentId = signal<string | null>(null);
  detail = signal<MyAppointmentDetail | null>(null);
  loading = signal(false);
  notFound = signal(false);
  acting = signal(false);

  cancelling = signal(false);
  cancelReason = signal('');

  rescheduling = signal(false);
  rescheduleValue = signal('');

  /** Only a not-yet-finished appointment can reasonably be self-cancelled or
   * self-rescheduled - same terminal-status logic the admin panel applies
   * elsewhere (see admin-appointment-detail's reopen() gating). */
  canAct(detail: MyAppointmentDetail): boolean {
    return detail.statusRaw === 'pending' || detail.statusRaw === 'confirmed';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.appointmentId.set(id);
    this.load();
  }

  private load(): void {
    const id = this.appointmentId();
    if (!id) return;

    this.loading.set(true);
    this.notFound.set(false);
    this.myAppointment
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.rescheduleValue.set(this.toDatetimeLocal(detail.termin.pocetakRaw));
        },
        error: () => this.notFound.set(true),
      });
  }

  private toDatetimeLocal(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // ---- Cancel ----

  toggleCancel(): void {
    this.cancelling.set(!this.cancelling());
    this.cancelReason.set('');
  }

  submitCancel(): void {
    const id = this.appointmentId();
    if (!id) return;

    this.acting.set(true);
    this.myAppointment
      .cancel(id, this.cancelReason().trim() || undefined)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Termin je otkazan.', 'U redu', { duration: 3000 });
          this.cancelling.set(false);
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Otkazivanje termina nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  // ---- Reschedule ----

  toggleReschedule(): void {
    this.rescheduling.set(!this.rescheduling());
  }

  submitReschedule(): void {
    const id = this.appointmentId();
    const value = this.rescheduleValue();
    if (!id || !value) return;

    this.acting.set(true);
    this.myAppointment
      .reschedule(id, value)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Termin je pomeren.', 'U redu', { duration: 3000 });
          this.rescheduling.set(false);
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Pomeranje termina nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
