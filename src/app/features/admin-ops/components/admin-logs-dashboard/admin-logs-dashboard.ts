import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AdminLogReport } from '../../services/log-report';
import { LogSummary } from '../../models/log-summary';
import { LogSummaryView } from '../log-summary-view/log-summary-view';

/** Today's live traffic/error digest, plus a link into the paginated history.
 * Mounted at /admin/logovi. */
@Component({
  selector: 'app-admin-logs-dashboard',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, LogSummaryView],
  templateUrl: './admin-logs-dashboard.html',
  styleUrl: './admin-logs-dashboard.scss',
})
export class AdminLogsDashboard implements OnInit {
  private logReport = inject(AdminLogReport);
  private snackBar = inject(MatSnackBar);

  summary = signal<LogSummary | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.logReport
      .getLive()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error) => this.snackBar.open(error?.message || 'Greška pri učitavanju logova.', 'U redu', { duration: 4000 }),
      });
  }
}
