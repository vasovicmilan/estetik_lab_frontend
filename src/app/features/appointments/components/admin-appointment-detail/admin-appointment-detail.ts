import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, finalize } from 'rxjs';
import { Appointment } from '../../services/appointment';
import { AppointmentAdminDetail as AppointmentAdminDetailModel, EmployeePickerItem } from '../../models/appointment';

/** Reason/note-collecting actions - each shows a small inline expanding text
 * field instead of a prompt()/dialog, matching the task's "no dialog library"
 * guidance. Only one can be open at a time. */
type ReasonAction = 'reject' | 'cancel' | 'no_show';

/** Rich read+act view of GET /admin/appointments/:id - client info, service/variant,
 * term time, status + status-transition action buttons, therapist reassignment,
 * price/discount/coupon info, the who/when audit trail (only the fields relevant
 * to the current status), reschedule, delete. Mounted at /admin/zakazivanja/:id. */
@Component({
  selector: 'app-admin-appointment-detail',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-appointment-detail.html',
  styleUrl: './admin-appointment-detail.scss',
})
export class AdminAppointmentDetail implements OnInit {
  private appointment = inject(Appointment);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  appointmentId = signal<string | null>(null);
  detail = signal<AppointmentAdminDetailModel | null>(null);
  loading = signal(false);
  notFound = signal(false);
  acting = signal(false);

  employees = signal<EmployeePickerItem[]>([]);
  employeesLoaded = signal(false);

  /** Which reason-collecting action's inline text field is currently open. */
  reasonAction = signal<ReasonAction | null>(null);
  reasonText = signal('');

  reassignEmployeeId = signal('');
  rescheduleValue = signal('');

  eligibleEmployees = computed(() => {
    const detail = this.detail();
    if (!detail) return [];
    const eligibleIds = new Set(detail.eligibleEmployeeIds);
    return this.employees().filter((e) => eligibleIds.has(e.id));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.appointmentId.set(id);
    this.load();

    // Best-effort - if the admin lacks manage_employees this 403s and resolves
    // to an empty list (see listEmployeesForPicker()'s comment), so the reassign
    // control just stays empty instead of erroring the whole page.
    this.appointment.listEmployeesForPicker().subscribe({
      next: (employees) => {
        this.employees.set(employees);
        this.employeesLoaded.set(true);
      },
      error: () => this.employeesLoaded.set(true),
    });
  }

  private load(): void {
    const id = this.appointmentId();
    if (!id) return;

    this.loading.set(true);
    this.notFound.set(false);
    this.appointment
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.rescheduleValue.set(this.toDatetimeLocal(detail.termin.pocetakRaw));
          this.reassignEmployeeId.set(detail.terapeutId ?? '');
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
    this.runAction(this.appointment.confirm(this.appointmentId()!), 'Termin je potvrđen.');
  }

  complete(): void {
    this.runAction(this.appointment.complete(this.appointmentId()!), 'Termin je označen kao završen.');
  }

  reopen(): void {
    this.runAction(this.appointment.reopen(this.appointmentId()!), 'Termin je ponovo otvoren.');
  }

  // ---- Reason-collecting transitions ----

  toggleReasonAction(action: ReasonAction): void {
    this.reasonAction.set(this.reasonAction() === action ? null : action);
    this.reasonText.set('');
  }

  submitReasonAction(): void {
    const action = this.reasonAction();
    const id = this.appointmentId();
    if (!action || !id) return;

    const reason = this.reasonText().trim() || undefined;
    let request$: Observable<{ message: string }>;
    let message: string;
    switch (action) {
      case 'reject':
        request$ = this.appointment.reject(id, reason);
        message = 'Termin je odbijen.';
        break;
      case 'cancel':
        request$ = this.appointment.cancel(id, reason);
        message = 'Termin je otkazan.';
        break;
      case 'no_show':
        request$ = this.appointment.noShow(id, reason);
        message = 'Termin je označen kao "nije se pojavio/la".';
        break;
      default:
        return;
    }

    this.reasonAction.set(null);
    this.runAction(request$, message);
  }

  // ---- Reassign / reschedule ----

  reassign(): void {
    const id = this.appointmentId();
    const employeeId = this.reassignEmployeeId();
    if (!id || !employeeId) return;

    this.runAction(this.appointment.reassign(id, employeeId), 'Terapeut je promenjen.');
  }

  reschedule(): void {
    const id = this.appointmentId();
    const value = this.rescheduleValue();
    if (!id || !value) return;

    this.acting.set(true);
    this.appointment
      .reschedule(id, value)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Termin je pomeren.', 'U redu', { duration: 3000 });
          this.load();
        },
        error: (error) => this.snackBar.open(error?.message || 'Pomeranje termina nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  // ---- Delete ----

  remove(): void {
    const id = this.appointmentId();
    if (!id) return;
    if (!confirm('Obrisati ovo zakazivanje? Ova radnja se ne može poništiti.')) return;

    this.acting.set(true);
    this.appointment
      .delete(id)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Zakazivanje je obrisano.', 'U redu', { duration: 3000 });
          this.router.navigate(['/admin/zakazivanja']);
        },
        error: () => this.snackBar.open('Brisanje nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }

  // ---- Shared action runner ----

  private runAction(request$: Observable<{ message: string }>, successMessage: string): void {
    this.acting.set(true);
    request$.pipe(finalize(() => this.acting.set(false))).subscribe({
      next: () => {
        this.snackBar.open(successMessage, 'U redu', { duration: 3000 });
        this.load();
      },
      error: (error) => this.snackBar.open(error?.message || 'Radnja nije uspela.', 'U redu', { duration: 4000 }),
    });
  }
}
