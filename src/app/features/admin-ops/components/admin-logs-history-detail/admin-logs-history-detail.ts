import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AdminLogReport } from '../../services/log-report';
import { LogSummary } from '../../models/log-summary';
import { LogSummaryView } from '../log-summary-view/log-summary-view';

/** Single stored day's LogSummary - GET /admin/logs/history/:date. A 404 (no
 * summary stored for that day) is shown as a friendly message, not a raw
 * error, per the task spec. Mounted at /admin/logovi/istorija/:date. */
@Component({
  selector: 'app-admin-logs-history-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, LogSummaryView],
  templateUrl: './admin-logs-history-detail.html',
  styleUrl: './admin-logs-history-detail.scss',
})
export class AdminLogsHistoryDetail implements OnInit {
  private logReport = inject(AdminLogReport);
  private route = inject(ActivatedRoute);

  date = signal<string | null>(null);
  summary = signal<LogSummary | null>(null);
  loading = signal(false);
  notFound = signal(false);

  ngOnInit(): void {
    const date = this.route.snapshot.paramMap.get('date');
    if (!date) return;

    this.date.set(date);
    this.loading.set(true);
    this.notFound.set(false);
    this.logReport
      .getByDate(date)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: () => this.notFound.set(true),
      });
  }
}
