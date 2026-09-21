import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { EmployeeAppointment } from '../../services/employee-appointment';
import { EmployeeAppointmentListItem } from '../../models/appointment';

/** Flat list of GET /employee/appointments - the appointments assigned to the
 * logged-in employee. Kept simple (no client-side grouping, unlike
 * account-appointments) since the dashboard already covers today/this-week.
 * Mounted at /zaposleni-panel/termini. */
@Component({
  selector: 'app-employee-appointments',
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './employee-appointments.html',
  styleUrl: './employee-appointments.scss',
})
export class EmployeeAppointments implements OnInit {
  private employeeAppointment = inject(EmployeeAppointment);
  private snackBar = inject(MatSnackBar);

  appointments = signal<EmployeeAppointmentListItem[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    // 100 is well beyond how many appointments a single employee realistically
    // has open at once - same simplification as account-appointments, avoids
    // building pagination for a list this small.
    this.employeeAppointment
      .list({ limit: 100 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ data }) => this.appointments.set(data),
        error: (error) => this.snackBar.open(error?.message || 'Učitavanje termina nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
