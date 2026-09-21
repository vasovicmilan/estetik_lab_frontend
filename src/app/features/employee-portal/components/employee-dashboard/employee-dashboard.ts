import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { EmployeeDashboard as EmployeeDashboardService } from '../../services/employee-dashboard';
import { EmployeeDashboard as EmployeeDashboardModel } from '../../models/dashboard';

/** Landing page of the employee portal - today's appointments, this week's
 * count/pending count, and (only when isCommissionBased) a balance summary +
 * recent commissions. Mounted at /zaposleni-panel (index route). */
@Component({
  selector: 'app-employee-dashboard',
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.scss',
})
export class EmployeeDashboard implements OnInit {
  private employeeDashboard = inject(EmployeeDashboardService);
  private snackBar = inject(MatSnackBar);

  dashboard = signal<EmployeeDashboardModel | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  /** No date-pipe/locale-data convention exists elsewhere in this app to
   * mirror (checked - see employee-earnings for the same helper), so this
   * just formats with the browser's own sr-RS locale support. */
  formatDate(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('sr-RS');
  }

  private load(): void {
    this.loading.set(true);
    this.employeeDashboard
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dashboard) => this.dashboard.set(dashboard),
        error: (error) => this.snackBar.open(error?.message || 'Učitavanje pregleda nije uspelo.', 'U redu', { duration: 4000 }),
      });
  }
}
