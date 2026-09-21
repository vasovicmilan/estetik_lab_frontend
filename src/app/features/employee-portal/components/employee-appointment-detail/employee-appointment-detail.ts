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
import { EmployeeAppointment } from '../../services/employee-appointment';
import { EmployeeAppointmentDetail as EmployeeAppointmentDetailModel } from '../../models/appointment';

/** Which reason-collecting action's inline text field is currently open - same
 * "no dialog library" convention as admin-appointment-detail's ReasonAction,
 * just a smaller action set (an employee can't cancel/reassign/reopen/delete,
 * only act on their own assigned appointment's pending/confirmed transitions). */
type ReasonAction = 'reject' | 'no_show';

/** Read+act view of GET /employee/appointments/:id - status-driven action
 * buttons (confirm/reject/complete/no-show) plus reschedule, mirroring the
 * admin appointment detail's UX conventions (inline expanding reason/note
 * textareas, naive datetime-local reschedule) but scoped to the employee's own
 * action set. Mounted at /zaposleni-panel/termini/:id. */
@Component({
  selector: 'app-employee-appointment-detail',
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './employee-appointment-detail.html',
  styleUrl: './employee-appointment-detail.scss',
})
export class EmployeeAppointmentDetail implements OnInit {
  private employeeAppointment = inject(EmployeeAppointment);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  appointmentId = signal<string | null>(null);
  detail = signal<EmployeeAppointmentDetailModel | null>(null);
  loading = signal(false);
  notFound = signal(false);
  acting = signal(false);

  /** Which reason-collecting action's inline text field is currently open. */
  reasonAction = signal<ReasonAction | null>(null);
  reasonText = signal('');

  rescheduling = signal(false);
  rescheduleValue = signal('');

  /** Reschedule is available whenever the appointment isn't already in a
   * terminal state - same condition the admin appointment detail's own
   * reschedule section implicitly allows (it's shown for any non-terminal
   * status there too, since only pending/confirmed appointments still have a
   * meaningful future start time to move). */
  canReschedule(detail: EmployeeAppointmentDetailModel): boolean {
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
    this.employeeAppointment
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

  // ---- Simple no-body transitions ----

  confirm(): void {
    const id = this.appointmentId();
    if (!id) return;

    this.acting.set(true);
    this.employeeAppointment
      .confirm(id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Termin je potvrđen.', 'U redu', { duration: 3000 });
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Radnja nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  complete(): void {
    const id = this.appointmentId();
    if (!id) return;

    this.acting.set(true);
    this.employeeAppointment
      .complete(id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Termin je označen kao završen.', 'U redu', { duration: 3000 });
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Radnja nije uspela.', 'U redu', { duration: 4000 }),
      });
  }

  // ---- Reason-collecting transitions (reject/no-show both require a non-empty value) ----

  toggleReasonAction(action: ReasonAction): void {
    this.reasonAction.set(this.reasonAction() === action ? null : action);
    this.reasonText.set('');
  }

  submitReasonAction(): void {
    const action = this.reasonAction();
    const id = this.appointmentId();
    const text = this.reasonText().trim();
    if (!action || !id || !text) return;

    this.acting.set(true);
    const request$ = action === 'reject' ? this.employeeAppointment.reject(id, text) : this.employeeAppointment.noShow(id, text);
    const message = action === 'reject' ? 'Termin je odbijen.' : 'Termin je označen kao "nije se pojavio/la".';

    this.reasonAction.set(null);
    request$.pipe(finalize(() => this.acting.set(false))).subscribe({
      next: () => {
        this.snackBar.open(message, 'U redu', { duration: 3000 });
        this.load();
      },
      error: (error) => this.snackBar.open(error?.message || 'Radnja nije uspela.', 'U redu', { duration: 4000 }),
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
    this.employeeAppointment
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
